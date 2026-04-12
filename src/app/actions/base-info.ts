"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/dal";
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

function revalidateBaseInfoViews() {
  revalidatePath("/settings/base");
  revalidatePath("/sales");
}

export async function upsertCarrierAction(formData: FormData) {
  await requireRole("ADMIN");

  const id = readOptionalText(formData, "id");
  const code = readText(formData, "code").toUpperCase();
  const name = readText(formData, "name");

  if (!code || !name) {
    return;
  }

  if (id) {
    await prisma.carrier.update({
      where: { id },
      data: { code, name },
    });
  } else {
    await prisma.carrier.create({
      data: { code, name },
    });
  }

  revalidateBaseInfoViews();
}

export async function toggleCarrierActiveAction(formData: FormData) {
  await requireRole("ADMIN");

  const id = readText(formData, "id");
  const nextActive = readText(formData, "nextActive") === "true";

  if (!id) {
    return;
  }

  await prisma.carrier.update({
    where: { id },
    data: { isActive: nextActive },
  });

  revalidateBaseInfoViews();
}

export async function upsertRatePlanAction(formData: FormData) {
  await requireRole("ADMIN");

  const id = readOptionalText(formData, "id");
  const carrierId = readText(formData, "carrierId");
  const name = readText(formData, "name");
  const monthlyFee = readInt(formData, "monthlyFee");
  const description = readOptionalText(formData, "description");

  if (!carrierId || !name || monthlyFee === null) {
    return;
  }

  if (id) {
    await prisma.ratePlan.update({
      where: { id },
      data: { carrierId, name, monthlyFee, description },
    });
  } else {
    await prisma.ratePlan.create({
      data: { carrierId, name, monthlyFee, description },
    });
  }

  revalidateBaseInfoViews();
}

export async function toggleRatePlanActiveAction(formData: FormData) {
  await requireRole("ADMIN");

  const id = readText(formData, "id");
  const nextActive = readText(formData, "nextActive") === "true";

  if (!id) {
    return;
  }

  await prisma.ratePlan.update({
    where: { id },
    data: { isActive: nextActive },
  });

  revalidateBaseInfoViews();
}

export async function upsertAddOnServiceAction(formData: FormData) {
  await requireRole("ADMIN");

  const id = readOptionalText(formData, "id");
  const carrierId = readOptionalText(formData, "carrierId");
  const name = readText(formData, "name");
  const monthlyFee = readInt(formData, "monthlyFee");
  const description = readOptionalText(formData, "description");

  if (!name) {
    return;
  }

  if (id) {
    await prisma.addOnService.update({
      where: { id },
      data: {
        carrierId,
        name,
        monthlyFee,
        description,
      },
    });
  } else {
    await prisma.addOnService.create({
      data: {
        carrierId,
        name,
        monthlyFee,
        description,
      },
    });
  }

  revalidateBaseInfoViews();
}

export async function toggleAddOnServiceActiveAction(formData: FormData) {
  await requireRole("ADMIN");

  const id = readText(formData, "id");
  const nextActive = readText(formData, "nextActive") === "true";

  if (!id) {
    return;
  }

  await prisma.addOnService.update({
    where: { id },
    data: { isActive: nextActive },
  });

  revalidateBaseInfoViews();
}
