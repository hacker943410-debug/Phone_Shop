"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireCurrentUser } from "@/lib/auth/dal";
import { parseKstDateInput } from "@/lib/date-utils";
import { normalizeImei } from "@/lib/phone-utils";
import { prisma } from "@/lib/prisma";
import {
  InventoryStatus,
  type InventoryStatus as InventoryStatusValue,
} from "../../../prisma/generated/client/enums";

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

function readInventoryStatus(
  formData: FormData,
  key: string,
): InventoryStatusValue | null {
  const value = readText(formData, key);

  switch (value) {
    case InventoryStatus.IN_STOCK:
    case InventoryStatus.RESERVED:
    case InventoryStatus.SOLD:
    case InventoryStatus.RETURNED:
    case InventoryStatus.DISCARDED:
      return value;
    default:
      return null;
  }
}

function readRequiredDate(formData: FormData, key: string) {
  const value = readText(formData, key);
  return value ? parseKstDateInput(value, "start") : null;
}

function resolveDispatchedAt(
  status: InventoryStatusValue,
  currentDispatchedAt: Date | null,
) {
  switch (status) {
    case InventoryStatus.SOLD:
    case InventoryStatus.RETURNED:
    case InventoryStatus.DISCARDED:
      return currentDispatchedAt ?? new Date();
    default:
      return null;
  }
}

async function resolveStoreId(inputStoreId: string | null) {
  if (inputStoreId) {
    return inputStoreId;
  }

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

function revalidateInventoryViews() {
  revalidatePath("/inventory");
  revalidatePath("/sales");
}

async function ensureUniqueImei(id: string | null, imei: string) {
  const duplicate = await prisma.inventoryItem.findFirst({
    where: {
      imei,
      ...(id ? { id: { not: id } } : {}),
    },
    select: {
      id: true,
    },
  });

  if (duplicate) {
    redirect("/inventory?notice=duplicate-imei");
  }
}

export async function upsertInventoryItemAction(formData: FormData) {
  await requireCurrentUser();

  const id = readOptionalText(formData, "id");
  const rawStoreId = readOptionalText(formData, "storeId");
  const carrierId = readText(formData, "carrierId");
  const deviceModelId = readText(formData, "deviceModelId");
  const color = readText(formData, "color");
  const capacity = readText(formData, "capacity");
  const imei = normalizeImei(readText(formData, "imei"));
  const costAmount = readInt(formData, "costAmount");
  const status = readInventoryStatus(formData, "status");
  const receivedAt = readRequiredDate(formData, "receivedAt");
  const assigneeId = readOptionalText(formData, "assigneeId");
  const notes = readOptionalText(formData, "notes");
  const storeId = await resolveStoreId(rawStoreId);

  if (
    !storeId ||
    !carrierId ||
    !deviceModelId ||
    !color ||
    !capacity ||
    !imei ||
    costAmount === null ||
    !status ||
    !receivedAt
  ) {
    redirect("/inventory?notice=invalid-inventory-form");
  }

  await ensureUniqueImei(id, imei);

  if (id) {
    const existing = await prisma.inventoryItem.findUnique({
      where: {
        id,
      },
      select: {
        dispatchedAt: true,
      },
    });

    if (!existing) {
      redirect("/inventory?notice=inventory-not-found");
    }

    await prisma.inventoryItem.update({
      where: {
        id,
      },
      data: {
        carrierId,
        storeId,
        deviceModelId,
        color,
        capacity,
        imei,
        costAmount,
        status,
        receivedAt,
        assigneeId,
        notes,
        dispatchedAt: resolveDispatchedAt(status, existing.dispatchedAt),
      },
    });
  } else {
    await prisma.inventoryItem.create({
      data: {
        carrierId,
        storeId,
        deviceModelId,
        color,
        capacity,
        imei,
        costAmount,
        status,
        receivedAt,
        assigneeId,
        notes,
        dispatchedAt: resolveDispatchedAt(status, null),
      },
    });
  }

  revalidateInventoryViews();
}

export async function toggleInventoryItemHiddenAction(formData: FormData) {
  await requireCurrentUser();

  const id = readText(formData, "id");
  const nextHidden = readText(formData, "nextHidden") === "true";

  if (!id) {
    redirect("/inventory?notice=inventory-not-found");
  }

  await prisma.inventoryItem.update({
    where: {
      id,
    },
    data: {
      isHidden: nextHidden,
    },
  });

  revalidateInventoryViews();
}
