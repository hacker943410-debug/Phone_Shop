"use server";

import { revalidatePath } from "next/cache";

import {
  ActivationCountUnit,
  ActivationMonthCountMode,
  DiscountMethod,
  DiscountTarget,
  RevenueCalculationMethod,
  type ActivationCountUnit as ActivationCountUnitValue,
  type ActivationMonthCountMode as ActivationMonthCountModeValue,
  type DiscountMethod as DiscountMethodValue,
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

function readActivationCountUnit(
  formData: FormData,
  key: string,
): ActivationCountUnitValue | null {
  const value = readText(formData, key);

  switch (value) {
    case ActivationCountUnit.DAY:
    case ActivationCountUnit.MONTH:
      return value;
    default:
      return null;
  }
}

function readActivationMonthCountMode(
  formData: FormData,
  key: string,
): ActivationMonthCountModeValue | null {
  const value = readText(formData, key);

  switch (value) {
    case ActivationMonthCountMode.INCLUDE_CURRENT_MONTH:
    case ActivationMonthCountMode.EXCLUDE_CURRENT_MONTH:
      return value;
    default:
      return null;
  }
}

function revalidatePolicyViews() {
  revalidatePath("/settings/policies");
  revalidatePath("/sales");
  revalidatePath("/");
  revalidatePath("/reports/summary");
}

export async function upsertSaleProfitPolicyAction(formData: FormData) {
  await requireRole("ADMIN");

  const id = readOptionalText(formData, "id");
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
    !carrierId ||
    !startsAt ||
    !endsAt ||
    !calculationMethod ||
    calculationValue === null ||
    endsAt < startsAt
  ) {
    return;
  }

  const carrier = await prisma.carrier.findUnique({
    where: { id: carrierId },
    select: { id: true, name: true },
  });

  if (!carrier) {
    return;
  }

  const conflictingPolicy = await prisma.saleProfitPolicy.findFirst({
    where: {
      carrierId,
      ...(id ? { id: { not: id } } : {}),
    },
    select: {
      id: true,
    },
  });

  if (conflictingPolicy) {
    return;
  }

  const data = {
    name: carrier.name,
    carrierId,
    startsAt,
    endsAt,
    calculationMethod,
    calculationValue,
    memo,
  };

  if (id) {
    await prisma.saleProfitPolicy.update({
      where: { id },
      data,
    });
  } else {
    await prisma.saleProfitPolicy.create({
      data,
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

export async function upsertStaffCommissionPolicyAction(formData: FormData) {
  await requireRole("ADMIN");

  const id = readOptionalText(formData, "id");
  const staffId = readText(formData, "staffId");
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
    !staffId ||
    !startsAt ||
    !endsAt ||
    !calculationMethod ||
    calculationValue === null ||
    endsAt < startsAt
  ) {
    return;
  }

  const staff = await prisma.user.findUnique({
    where: { id: staffId },
    select: {
      id: true,
      displayName: true,
      username: true,
      isActive: true,
      role: true,
    },
  });

  if (!staff || staff.role !== "STAFF") {
    return;
  }

  const data = {
    name: staff.displayName,
    carrierId: null,
    staffId: staff.id,
    startsAt,
    endsAt,
    calculationMethod,
    calculationValue,
    memo,
  };

  if (id) {
    await prisma.staffCommissionPolicy.update({
      where: { id },
      data,
    });
  } else {
    await prisma.staffCommissionPolicy.create({
      data,
    });
  }

  revalidatePolicyViews();
}

export async function toggleStaffCommissionPolicyActiveAction(formData: FormData) {
  await requireRole("ADMIN");

  const id = readText(formData, "id");
  const nextActive = readText(formData, "nextActive") === "true";

  if (!id) {
    return;
  }

  await prisma.staffCommissionPolicy.update({
    where: { id },
    data: { isActive: nextActive },
  });

  revalidatePolicyViews();
}

export async function upsertDiscountPolicyAction(formData: FormData) {
  await requireRole("ADMIN");

  const id = readOptionalText(formData, "id");
  const deviceModelId = readText(formData, "deviceModelId");
  const startsAt = readRequiredDate(formData, "startsAt", "start");
  const endsAt = readRequiredDate(formData, "endsAt", "end");
  const discountMethod = readDiscountMethod(formData, "discountMethod");
  const discountValue = readInt(formData, "discountValue");
  const memo = readOptionalText(formData, "memo");

  if (
    !deviceModelId ||
    !startsAt ||
    !endsAt ||
    !discountMethod ||
    discountValue === null ||
    endsAt < startsAt
  ) {
    return;
  }

  const deviceModel = await prisma.deviceModel.findUnique({
    where: { id: deviceModelId },
    select: { id: true, name: true },
  });

  if (!deviceModel) {
    return;
  }

  const data = {
    name: deviceModel.name,
    target: DiscountTarget.DEVICE,
    carrierId: null,
    deviceModelId: deviceModel.id,
    startsAt,
    endsAt,
    discountMethod,
    discountValue,
    memo,
  };

  if (id) {
    await prisma.discountPolicy.update({
      where: { id },
      data,
    });
  } else {
    await prisma.discountPolicy.create({
      data,
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

export async function upsertCarrierActivationRuleAction(formData: FormData) {
  await requireRole("ADMIN");

  const id = readOptionalText(formData, "id");
  const carrierId = readText(formData, "carrierId");
  const countUnit = readActivationCountUnit(formData, "countUnit");
  const countValue = readInt(formData, "countValue");
  const rawMonthCountMode = readActivationMonthCountMode(
    formData,
    "monthCountMode",
  );
  const memo = readOptionalText(formData, "memo");
  const monthCountMode =
    countUnit === ActivationCountUnit.MONTH ? rawMonthCountMode : null;

  if (
    !carrierId ||
    !countUnit ||
    countValue === null ||
    countValue <= 0 ||
    (countUnit === ActivationCountUnit.MONTH && !monthCountMode)
  ) {
    return;
  }

  const conflictingRule = await prisma.carrierActivationRule.findFirst({
    where: {
      carrierId,
      ...(id ? { id: { not: id } } : {}),
    },
    select: {
      id: true,
    },
  });

  if (conflictingRule) {
    return;
  }

  if (id) {
    await prisma.carrierActivationRule.update({
      where: { id },
      data: {
        carrierId,
        countUnit,
        countValue,
        monthCountMode,
        memo,
      },
    });
  } else {
    await prisma.carrierActivationRule.create({
      data: {
        carrierId,
        countUnit,
        countValue,
        monthCountMode,
        memo,
      },
    });
  }

  revalidatePolicyViews();
}

export async function toggleCarrierActivationRuleActiveAction(formData: FormData) {
  await requireRole("ADMIN");

  const id = readText(formData, "id");
  const nextActive = readText(formData, "nextActive") === "true";

  if (!id) {
    return;
  }

  await prisma.carrierActivationRule.update({
    where: { id },
    data: { isActive: nextActive },
  });

  revalidatePolicyViews();
}
