"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/dal";
import {
  createDatabaseBackup,
  readBackupSettings,
  restoreDatabaseBackup,
  saveBackupSettings,
} from "@/lib/backup-storage";
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
  revalidatePath("/settings/policies");
  revalidatePath("/sales");
  revalidatePath("/sales/new");
  revalidatePath("/inventory");
  revalidatePath("/customers");
  revalidatePath("/receivables");
  revalidatePath("/reports/summary");
  revalidatePath("/");
}

function redirectToBaseInfo(tab: string, notice: string): never {
  redirect(`/settings/base?tab=${tab}&notice=${notice}`);
}

async function generateNextStoreCode() {
  const stores = await prisma.store.findMany({
    select: {
      code: true,
    },
  });

  const nextSequence =
    stores.reduce((maxValue, store) => {
      const match = /^STORE(\d+)$/.exec(store.code);

      if (!match) {
        return maxValue;
      }

      return Math.max(maxValue, Number.parseInt(match[1] ?? "0", 10));
    }, 0) + 1;

  return `STORE${String(nextSequence).padStart(3, "0")}`;
}

export async function upsertStoreAction(formData: FormData) {
  await requireRole("ADMIN");

  const id = readOptionalText(formData, "id");
  const rawCode = readText(formData, "code").toUpperCase();
  const name = readText(formData, "name");
  const region = readOptionalText(formData, "region");
  const code = id ? rawCode : await generateNextStoreCode();

  if (!code || !name) {
    return;
  }

  if (id) {
    await prisma.store.update({
      where: { id },
      data: { code, name, region },
    });
  } else {
    const defaultStore = await prisma.store.findFirst({
      where: { isDefault: true },
      select: { id: true },
    });

    await prisma.store.create({
      data: {
        code,
        name,
        region,
        isDefault: !defaultStore,
      },
    });
  }

  revalidateBaseInfoViews();
}

export async function toggleStoreActiveAction(formData: FormData) {
  await requireRole("ADMIN");

  const id = readText(formData, "id");
  const nextActive = readText(formData, "nextActive") === "true";

  if (!id) {
    return;
  }

  await prisma.store.update({
    where: { id },
    data: { isActive: nextActive },
  });

  revalidateBaseInfoViews();
}

export async function setDefaultStoreAction(formData: FormData) {
  await requireRole("ADMIN");

  const id = readText(formData, "id");

  if (!id) {
    return;
  }

  await prisma.$transaction([
    prisma.store.updateMany({
      data: { isDefault: false },
    }),
    prisma.store.update({
      where: { id },
      data: { isDefault: true, isActive: true },
    }),
  ]);

  revalidateBaseInfoViews();
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
  const voiceCallMinutes = readInt(formData, "voiceCallMinutes");
  const videoCallMinutes = readInt(formData, "videoCallMinutes");
  const dataAllowanceGb = readInt(formData, "dataAllowanceGb");
  const description = readOptionalText(formData, "description");

  if (
    !carrierId ||
    !name ||
    monthlyFee === null ||
    voiceCallMinutes === null ||
    videoCallMinutes === null ||
    dataAllowanceGb === null
  ) {
    return;
  }

  if (id) {
    await prisma.ratePlan.update({
      where: { id },
      data: {
        carrierId,
        name,
        monthlyFee,
        voiceCallMinutes,
        videoCallMinutes,
        dataAllowanceGb,
        description,
      },
    });
  } else {
    await prisma.ratePlan.create({
      data: {
        carrierId,
        name,
        monthlyFee,
        voiceCallMinutes,
        videoCallMinutes,
        dataAllowanceGb,
        description,
      },
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

export async function saveBackupDirectoryAction(formData: FormData) {
  await requireRole("ADMIN");

  const backupDirectory = readText(formData, "backupDirectory");

  try {
    await saveBackupSettings(backupDirectory);
  } catch (error) {
    if (error instanceof Error && error.message === "backup-path-required") {
      redirectToBaseInfo("backup", "backup-path-required");
    }

    redirectToBaseInfo("backup", "backup-path-invalid");
  }

  revalidateBaseInfoViews();
  redirectToBaseInfo("backup", "backup-path-saved");
}

export async function createBackupAction() {
  await requireRole("ADMIN");

  const { backupDirectory } = await readBackupSettings();

  if (!backupDirectory) {
    redirectToBaseInfo("backup", "backup-path-required");
  }

  try {
    await prisma.$disconnect();
    await createDatabaseBackup(backupDirectory);
  } catch {
    redirectToBaseInfo("backup", "backup-create-failed");
  }

  revalidateBaseInfoViews();
  redirectToBaseInfo("backup", "backup-created");
}

export async function restoreBackupAction(formData: FormData) {
  await requireRole("ADMIN");

  const fileName = readText(formData, "fileName");
  const { backupDirectory } = await readBackupSettings();

  if (!backupDirectory) {
    redirectToBaseInfo("restore", "backup-path-required");
  }

  if (!fileName) {
    redirectToBaseInfo("restore", "backup-file-missing");
  }

  try {
    await prisma.$disconnect();
    await restoreDatabaseBackup(backupDirectory, fileName);
  } catch (error) {
    if (error instanceof Error && error.message === "backup-file-missing") {
      redirectToBaseInfo("restore", "backup-file-missing");
    }

    redirectToBaseInfo("restore", "backup-restore-failed");
  }

  revalidateBaseInfoViews();
  redirectToBaseInfo("restore", "backup-restored");
}
