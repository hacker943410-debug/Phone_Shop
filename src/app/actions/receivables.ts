"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireCurrentUser } from "@/lib/auth/dal";
import { parseKstDateInput } from "@/lib/date-utils";
import { prisma } from "@/lib/prisma";
import { calculateReceivableState } from "@/lib/receivable-payments";
import {
  PaymentMethod,
  PaymentStatus,
  ReceivableStatus,
  type PaymentMethod as PaymentMethodValue,
} from "../../../prisma/generated/client/enums";

function resolveReceivableReturnTo(returnTo: string | null) {
  if (!returnTo || !returnTo.startsWith("/receivables")) {
    return "/receivables";
  }

  return returnTo;
}

function buildReceivableNoticeHref(notice: string, returnTo: string | null) {
  const target = new URL(
    resolveReceivableReturnTo(returnTo),
    "https://phoneshop.local",
  );
  target.searchParams.set("notice", notice);
  return `${target.pathname}${target.search}`;
}

function redirectReceivableNotice(
  notice: string,
  returnTo: string | null = null,
): never {
  redirect(buildReceivableNoticeHref(notice, returnTo));
}

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readOptionalText(formData: FormData, key: string) {
  const value = readText(formData, key);
  return value.length > 0 ? value : null;
}

function readPositiveInt(formData: FormData, key: string) {
  const value = readText(formData, key).replace(/\D/g, "");

  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function readRequiredDate(formData: FormData, key: string) {
  const value = readText(formData, key);
  return value ? parseKstDateInput(value, "start") : null;
}

function readPaymentMethod(
  formData: FormData,
  key: string,
): PaymentMethodValue | null {
  const value = readText(formData, key);

  switch (value) {
    case PaymentMethod.CASH:
    case PaymentMethod.CARD:
    case PaymentMethod.BANK_TRANSFER:
      return value;
    default:
      return null;
  }
}

function revalidateReceivableViews() {
  revalidatePath("/receivables");
  revalidatePath("/customers");
  revalidatePath("/sales");
  revalidatePath("/");
}

export async function createManualReceivableAction(formData: FormData) {
  await requireCurrentUser();

  const customerId = readText(formData, "customerId");
  const amount = readPositiveInt(formData, "amount");
  const memo = readOptionalText(formData, "memo");
  const returnTo = readOptionalText(formData, "returnTo");

  if (!customerId || amount === null) {
    redirectReceivableNotice("invalid-manual-receivable-form", returnTo);
  }

  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      isHidden: false,
    },
    select: {
      id: true,
    },
  });

  if (!customer) {
    redirectReceivableNotice("manual-receivable-customer-not-found", returnTo);
  }

  await prisma.receivable.create({
    data: {
      saleId: null,
      customerId: customer.id,
      status: ReceivableStatus.UNPAID,
      originalAmount: amount,
      balanceAmount: amount,
      memo,
    },
  });

  revalidateReceivableViews();
}

async function resolveDefaultStoreId() {
  const defaultStore = await prisma.store.findFirst({
    where: {
      isActive: true,
    },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    select: {
      id: true,
    },
  });

  return defaultStore?.id ?? null;
}

export async function recordPaymentAction(formData: FormData) {
  const currentUser = await requireCurrentUser();

  const receivableId = readText(formData, "receivableId");
  const paymentDate = readRequiredDate(formData, "paymentDate");
  const amount = readPositiveInt(formData, "amount");
  const method = readPaymentMethod(formData, "method");
  const memo = readOptionalText(formData, "memo");

  if (!receivableId || !paymentDate || amount === null || !method) {
    redirectReceivableNotice("invalid-payment-form");
  }

  const defaultStoreId = await resolveDefaultStoreId();

  try {
    await prisma.$transaction(async (tx) => {
      const receivable = await tx.receivable.findUnique({
        where: {
          id: receivableId,
        },
        select: {
          id: true,
          saleId: true,
          sale: {
            select: {
              storeId: true,
            },
          },
          originalAmount: true,
          payments: {
            where: {
              status: PaymentStatus.COMPLETED,
            },
            select: {
              amount: true,
              paymentDate: true,
            },
          },
        },
      });

      if (!receivable) {
        throw new Error("RECEIVABLE_NOT_FOUND");
      }

      const nextState = calculateReceivableState(receivable.originalAmount, [
        ...receivable.payments,
        {
          amount,
          paymentDate,
        },
      ]);

      await tx.payment.create({
        data: {
          receivableId: receivable.id,
          saleId: receivable.saleId,
          storeId: receivable.sale?.storeId ?? defaultStoreId,
          staffId: currentUser.id,
          paymentDate,
          amount,
          method,
          status: PaymentStatus.COMPLETED,
          memo,
        },
      });

      await tx.receivable.update({
        where: {
          id: receivable.id,
        },
        data: {
          status: nextState.status,
          balanceAmount: nextState.balanceAmount,
          closedAt: nextState.closedAt,
        },
      });
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "RECEIVABLE_NOT_FOUND") {
        redirectReceivableNotice("receivable-not-found");
      }

      if (error.message === "PAYMENT_OVER_BALANCE") {
        redirectReceivableNotice("payment-over-balance");
      }
    }

    throw error;
  }

  revalidateReceivableViews();
}

export async function cancelPaymentAction(formData: FormData) {
  const currentUser = await requireCurrentUser();

  const paymentId = readText(formData, "paymentId");
  const cancellationReason = readOptionalText(formData, "cancellationReason");

  if (!paymentId) {
    redirectReceivableNotice("payment-not-found");
  }

  if (!cancellationReason) {
    redirectReceivableNotice("payment-cancel-reason-required");
  }

  try {
    await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: {
          id: paymentId,
        },
        select: {
          id: true,
          receivableId: true,
          status: true,
        },
      });

      if (!payment || payment.status !== PaymentStatus.COMPLETED) {
        throw new Error("PAYMENT_NOT_FOUND");
      }

      await tx.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          status: PaymentStatus.CANCELED,
          canceledAt: new Date(),
          canceledById: currentUser.id,
          cancellationReason,
        },
      });

      const receivable = await tx.receivable.findUnique({
        where: {
          id: payment.receivableId,
        },
        select: {
          id: true,
          originalAmount: true,
          payments: {
            where: {
              status: PaymentStatus.COMPLETED,
            },
            select: {
              amount: true,
              paymentDate: true,
            },
          },
        },
      });

      if (!receivable) {
        throw new Error("RECEIVABLE_NOT_FOUND");
      }

      const nextState = calculateReceivableState(
        receivable.originalAmount,
        receivable.payments,
      );

      await tx.receivable.update({
        where: {
          id: receivable.id,
        },
        data: {
          status: nextState.status,
          balanceAmount: nextState.balanceAmount,
          closedAt: nextState.closedAt,
        },
      });
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "PAYMENT_NOT_FOUND") {
        redirectReceivableNotice("payment-not-found");
      }

      if (error.message === "RECEIVABLE_NOT_FOUND") {
        redirectReceivableNotice("receivable-not-found");
      }
    }

    throw error;
  }

  revalidateReceivableViews();
}
