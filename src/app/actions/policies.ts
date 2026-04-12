"use server";

import { revalidatePath } from "next/cache";

import {
  DiscountMethod,
  DiscountTarget,
  RevenueCalculationMethod,
  type DiscountMethod as DiscountMethodValue,
  type DiscountTarget as DiscountTargetValue,
  type RevenueCalculationMethod as RevenueCalculationMethodValue,
} from "../../../prisma/generated/client/enums";
import { requireRole } from "@/lib/auth/dal";
import { parseKstDateInput } from "@/lib/date-utils";
import { prisma } from "@/lib/prisma";

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readOptionalText(formData: FormData, key: string) {
  const value = readText(formData, key);
  return value.length > 0 ? value : null;
}

function readInt(formData: FormData, key: string) {
  const value = readText(formData, key);

  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function readRequiredDate(formData: FormData, key: string, mode: "start" | "end") {
  const value = readText(formData, key);
  return value ? parseKstDateInput(value, mode) : null;
}

function readDiscountMethod(formData: FormData, key: string): DiscountMethodValue | null {
  const value = readText(formData, key);

  switch (value) {
    case DiscountMethod.PERCENTAGE:
    case DiscountMethod.FIXED_AMOUNT:
      return value;
    default:
      return null;
  }
}

function readDiscountTarget(formData: FormData, key: string): DiscountTargetValue | null {
  const value = readText(formData, key);

  switch (value) {
    case DiscountTarget.CARRIER:
    case DiscountTarget.DEVICE:
      return value;
    default:
      return null;
  }
}

function readRevenueCalculationMethod(
  formData: FormData,
  key: string,
): RevenueCalculationMethodValue | null {
  const value = readText(formData, key);

  switch (value) {
    case RevenueCalculationMethod.NONE:
    case RevenueCalculationMethod.FIXED_AMOUNT:
    case RevenueCalculationMethod.PERCENTAGE:
      return value;
    default:
      return null;
  }
}

function revalidatePolicyViews() {
  revalidatePath("/settings/policies");
  revalidatePath("/sales");
}

export async function upsertRebatePolicyAction(formData: FormData) {
  await requireRole("ADMIN");

  const id = readOptionalText(formData, "id");
  const name = readText(formData, "name");
  const carrierId = readText(formData, "carrierId");
  const deviceModelId = readText(formData, "deviceModelId");
  const startsAt = readRequiredDate(formData, "startsAt", "start");
  const endsAt = readRequiredDate(formData, "endsAt", "end");
  const defaultRebateAmount = readInt(formData, "defaultRebateAmount");
  const memo = readOptionalText(formData, "memo");

  if (
    !name ||
    !carrierId ||
    !deviceModelId ||
    !startsAt ||
    !endsAt ||
    defaultRebateAmount === null ||
    endsAt < startsAt
  ) {
    return;
  }

  if (id) {
    await prisma.rebatePolicy.update({
      where: { id },
      data: {
        name,
        carrierId,
        deviceModelId,
        startsAt,
        endsAt,
        defaultRebateAmount,
        memo,
      },
    });
  } else {
    await prisma.rebatePolicy.create({
      data: {
        name,
        carrierId,
        deviceModelId,
        startsAt,
        endsAt,
        defaultRebateAmount,
        memo,
      },
    });
  }

  revalidatePolicyViews();
}

export async function toggleRebatePolicyActiveAction(formData: FormData) {
  await requireRole("ADMIN");

  const id = readText(formData, "id");
  const nextActive = readText(formData, "nextActive") === "true";

  if (!id) {
    return;
  }

  await prisma.rebatePolicy.update({
    where: { id },
    data: { isActive: nextActive },
  });

  revalidatePolicyViews();
}

export async function upsertSaleProfitPolicyAction(formData: FormData) {
  await requireRole("ADMIN");

  const id = readOptionalText(formData, "id");
  const name = readText(formData, "name");
  const carrierId = readText(formData, "carrierId");
  const startsAt = readRequiredDate(formData, "startsAt", "start");
  const endsAt = readRequiredDate(formData, "endsAt", "end");
  const calculationMethod = readRevenueCalculationMethod(formData, "calculationMethod");
  const rawCalculationValue = readInt(formData, "calculationValue");
  const memo = readOptionalText(formData, "memo");
  const calculationValue =
    calculationMethod === RevenueCalculationMethod.NONE
      ? rawCalculationValue ?? 0
      : rawCalculationValue;

  if (
    !name ||
    !carrierId ||
    !startsAt ||
    !endsAt ||
    !calculationMethod ||
    calculationValue === null ||
    endsAt < startsAt
  ) {
    return;
  }

  if (id) {
    await prisma.saleProfitPolicy.update({
      where: { id },
      data: {
        name,
        carrierId,
        startsAt,
        endsAt,
        calculationMethod,
        calculationValue,
        memo,
      },
    });
  } else {
    await prisma.saleProfitPolicy.create({
      data: {
        name,
        carrierId,
        startsAt,
        endsAt,
        calculationMethod,
        calculationValue,
        memo,
      },
    });
  }

  revalidatePolicyViews();
}

export async function toggleSaleProfitPolicyActiveAction(formData: FormData) {
  await requireRole("ADMIN");

  const id = readText(formData, "id");
  const nextActive = readText(formData, "nextActive") === "true";

  if (!id) {
    return;
  }

  await prisma.saleProfitPolicy.update({
    where: { id },
    data: { isActive: nextActive },
  });

  revalidatePolicyViews();
}

export async function upsertDiscountPolicyAction(formData: FormData) {
  await requireRole("ADMIN");

  const id = readOptionalText(formData, "id");
  const name = readText(formData, "name");
  const target = readDiscountTarget(formData, "target");
  const carrierId = readOptionalText(formData, "carrierId");
  const deviceModelId = readOptionalText(formData, "deviceModelId");
  const startsAt = readRequiredDate(formData, "startsAt", "start");
  const endsAt = readRequiredDate(formData, "endsAt", "end");
  const discountMethod = readDiscountMethod(formData, "discountMethod");
  const discountValue = readInt(formData, "discountValue");
  const memo = readOptionalText(formData, "memo");

  if (
    !name ||
    !target ||
    !startsAt ||
    !endsAt ||
    !discountMethod ||
    discountValue === null ||
    endsAt < startsAt
  ) {
    return;
  }

  if (target === DiscountTarget.CARRIER && !carrierId) {
    return;
  }

  if (target === DiscountTarget.DEVICE && !deviceModelId) {
    return;
  }

  if (id) {
    await prisma.discountPolicy.update({
      where: { id },
      data: {
        name,
        target,
        carrierId,
        deviceModelId,
        startsAt,
        endsAt,
        discountMethod,
        discountValue,
        memo,
      },
    });
  } else {
    await prisma.discountPolicy.create({
      data: {
        name,
        target,
        carrierId,
        deviceModelId,
        startsAt,
        endsAt,
        discountMethod,
        discountValue,
        memo,
      },
    });
  }

  revalidatePolicyViews();
}

export async function toggleDiscountPolicyActiveAction(formData: FormData) {
  await requireRole("ADMIN");

  const id = readText(formData, "id");
  const nextActive = readText(formData, "nextActive") === "true";

  if (!id) {
    return;
  }

  await prisma.discountPolicy.update({
    where: { id },
    data: { isActive: nextActive },
  });

  revalidatePolicyViews();
}
