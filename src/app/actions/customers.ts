"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { normalizeRedirectPath } from "@/lib/auth/access";
import { requireCurrentUser } from "@/lib/auth/dal";
import {
  type CustomerUpsertActionCustomer,
  type CustomerUpsertActionFields,
  type CustomerUpsertActionState,
} from "@/lib/customer-upsert-action-state";
import { formatKstDate, parseKstDateInput } from "@/lib/date-utils";
import { formatPhoneNumber, normalizePhoneNumber } from "@/lib/phone-utils";
import { prisma } from "@/lib/prisma";

interface CustomerUpsertInput {
  id: string | null;
  name: string;
  phoneInput: string;
  normalizedPhone: string;
  birthDateInput: string;
  birthDate: Date | null;
  address: string | null;
  memo: string | null;
  currentCarrierId: string | null;
  returnTo: string | null;
  fields: CustomerUpsertActionFields;
}

function buildCustomerActionState(
  overrides?: Partial<CustomerUpsertActionState>,
): CustomerUpsertActionState {
  const fields = {
    id: "",
    name: "",
    phone: "",
    currentCarrierId: "",
    birthDate: "",
    address: "",
    memo: "",
    ...(overrides?.fields ?? {}),
  };

  return {
    status: "idle",
    message: null,
    customer: null,
    ...overrides,
    fields,
  };
}

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readOptionalText(formData: FormData, key: string) {
  const value = readText(formData, key);
  return value.length > 0 ? value : null;
}

function readOptionalRedirectPath(formData: FormData, key: string) {
  const value = readOptionalText(formData, key);
  return value ? normalizeRedirectPath(value) : null;
}

function readCustomerUpsertInput(formData: FormData): CustomerUpsertInput {
  const id = readOptionalText(formData, "id");
  const name = readText(formData, "name");
  const phoneInput = readText(formData, "phone");
  const normalizedPhone = normalizePhoneNumber(phoneInput);
  const birthDateInput = readText(formData, "birthDate");
  const birthDate = birthDateInput ? parseKstDateInput(birthDateInput, "start") : null;
  const address = readOptionalText(formData, "address");
  const memo = readOptionalText(formData, "memo");
  const currentCarrierId = readOptionalText(formData, "currentCarrierId");
  const returnTo = readOptionalRedirectPath(formData, "returnTo");

  return {
    id,
    name,
    phoneInput,
    normalizedPhone,
    birthDateInput,
    birthDate,
    address,
    memo,
    currentCarrierId,
    returnTo,
    fields: {
      id: id ?? "",
      name,
      phone: phoneInput,
      currentCarrierId: currentCarrierId ?? "",
      birthDate: birthDateInput,
      address: address ?? "",
      memo: memo ?? "",
    },
  };
}

function revalidateCustomerViews() {
  revalidatePath("/customers");
  revalidatePath("/sales");
  revalidatePath("/sales/new");
}

function buildHref(
  pathname: string,
  entries: Array<[key: string, value: string | null | undefined]>,
) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of entries) {
    if (value) {
      searchParams.set(key, value);
    }
  }

  const query = searchParams.toString();

  if (!query) {
    return pathname;
  }

  const separator = pathname.includes("?") ? "&" : "?";
  return `${pathname}${separator}${query}`;
}

function buildCustomersPageHref(input: {
  notice?: "duplicate-phone" | "invalid-customer-form";
  customerId?: string | null;
  returnTo?: string | null;
}) {
  return buildHref("/customers", [
    ["notice", input.notice],
    ["customerId", input.customerId],
    ["returnTo", input.returnTo],
  ]);
}

async function findDuplicateCustomerId(
  id: string | null,
  normalizedPhone: string,
) {
  const duplicate = await prisma.customer.findFirst({
    where: {
      normalizedPhone,
      ...(id ? { id: { not: id } } : {}),
    },
    select: {
      id: true,
    },
  });

  return duplicate?.id ?? null;
}

function isInvalidCustomerInput(input: CustomerUpsertInput) {
  return !input.name || input.normalizedPhone.length < 9;
}

function toCustomerUpsertActionCustomer(record: {
  id: string;
  name: string;
  phone: string;
  currentCarrierId: string | null;
  currentCarrier: { name: string } | null;
  birthDate: Date | null;
  address: string | null;
  memo: string | null;
}): CustomerUpsertActionCustomer {
  return {
    id: record.id,
    name: record.name,
    phone: record.phone,
    currentCarrierId: record.currentCarrierId,
    currentCarrierName: record.currentCarrier?.name ?? null,
    birthDate: record.birthDate ? formatKstDate(record.birthDate) : null,
    address: record.address,
    memo: record.memo,
  };
}

async function persistCustomerRecord(input: CustomerUpsertInput) {
  const data = {
    name: input.name,
    phone: formatPhoneNumber(input.normalizedPhone),
    normalizedPhone: input.normalizedPhone,
    birthDate: input.birthDate,
    address: input.address,
    memo: input.memo,
    currentCarrierId: input.currentCarrierId,
  };

  return input.id
    ? prisma.customer.update({
        where: {
          id: input.id,
        },
        data,
        select: {
          id: true,
          name: true,
          phone: true,
          currentCarrierId: true,
          birthDate: true,
          address: true,
          memo: true,
          currentCarrier: {
            select: {
              name: true,
            },
          },
        },
      })
    : prisma.customer.create({
        data,
        select: {
          id: true,
          name: true,
          phone: true,
          currentCarrierId: true,
          birthDate: true,
          address: true,
          memo: true,
          currentCarrier: {
            select: {
              name: true,
            },
          },
        },
      });
}

export async function upsertCustomerAction(formData: FormData) {
  await requireCurrentUser();

  const input = readCustomerUpsertInput(formData);

  if (isInvalidCustomerInput(input)) {
    redirect(
      buildCustomersPageHref({
        notice: "invalid-customer-form",
        customerId: input.id,
        returnTo: input.returnTo,
      }),
    );
  }

  const duplicateCustomerId = await findDuplicateCustomerId(
    input.id,
    input.normalizedPhone,
  );

  if (duplicateCustomerId) {
    redirect(
      buildCustomersPageHref({
        notice: "duplicate-phone",
        customerId: duplicateCustomerId,
        returnTo: input.returnTo,
      }),
    );
  }

  const customer = await persistCustomerRecord(input);

  revalidateCustomerViews();

  if (input.returnTo) {
    redirect(
      buildHref(input.returnTo, [
        ["customerId", customer.id],
      ]),
    );
  }
}

export async function upsertCustomerDialogAction(
  _previousState: CustomerUpsertActionState,
  formData: FormData,
): Promise<CustomerUpsertActionState> {
  await requireCurrentUser();

  const input = readCustomerUpsertInput(formData);

  if (isInvalidCustomerInput(input)) {
    return buildCustomerActionState({
      status: "error",
      message: "고객명과 연락처를 다시 확인해 주세요.",
      fields: input.fields,
    });
  }

  const duplicateCustomerId = await findDuplicateCustomerId(
    input.id,
    input.normalizedPhone,
  );

  if (duplicateCustomerId) {
    return buildCustomerActionState({
      status: "error",
      message: "같은 연락처의 고객이 이미 존재합니다. 기존 고객을 선택해 이력을 이어서 관리해 주세요.",
      fields: input.fields,
    });
  }

  const customer = await persistCustomerRecord(input);

  revalidateCustomerViews();

  return buildCustomerActionState({
    status: "success",
    fields: {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      currentCarrierId: customer.currentCarrierId ?? "",
      birthDate: customer.birthDate ? formatKstDate(customer.birthDate) : "",
      address: customer.address ?? "",
      memo: customer.memo ?? "",
    },
    customer: toCustomerUpsertActionCustomer(customer),
  });
}
