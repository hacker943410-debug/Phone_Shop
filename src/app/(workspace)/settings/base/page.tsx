import type { Metadata } from "next";

import { BaseInfoOverview } from "@/components/workspace/base-info-overview";
import {
  defaultBackupDirectory,
  formatBackupCreatedAt,
  formatBackupSize,
  listBackupFiles,
  readBackupSettings,
  resolveDatabaseFilePath,
} from "@/lib/backup-storage";
import { requireRole } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "기초정보",
};

function readSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function isBaseInfoTabValue(
  value: string,
): value is
  | "stores"
  | "carriers"
  | "ratePlans"
  | "addOnServices"
  | "backup"
  | "restore" {
  return (
    value === "stores" ||
    value === "carriers" ||
    value === "ratePlans" ||
    value === "addOnServices" ||
    value === "backup" ||
    value === "restore"
  );
}

function isBaseInfoNoticeValue(
  value: string,
): value is
  | "backup-path-saved"
  | "backup-created"
  | "backup-restored"
  | "backup-path-required"
  | "backup-path-invalid"
  | "backup-create-failed"
  | "backup-file-missing"
  | "backup-restore-failed" {
  return (
    value === "backup-path-saved" ||
    value === "backup-created" ||
    value === "backup-restored" ||
    value === "backup-path-required" ||
    value === "backup-path-invalid" ||
    value === "backup-create-failed" ||
    value === "backup-file-missing" ||
    value === "backup-restore-failed"
  );
}

export default async function BaseInfoPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string | string[];
    notice?: string | string[];
  }>;
}) {
  await requireRole("ADMIN");

  const rawSearchParams = await searchParams;
  const tabValue = readSearchParam(rawSearchParams.tab);
  const noticeValue = readSearchParam(rawSearchParams.notice);

  const initialTab = isBaseInfoTabValue(tabValue) ? tabValue : "stores";
  const notice = isBaseInfoNoticeValue(noticeValue) ? noticeValue : null;

  const [storeRows, carrierRows, ratePlanRows, addOnServiceRows, backupSettings] =
    await Promise.all([
      prisma.store.findMany({
        orderBy: [{ isDefault: "desc" }, { isActive: "desc" }, { name: "asc" }],
      }),
      prisma.carrier.findMany({
        orderBy: [{ isActive: "desc" }, { name: "asc" }],
        include: {
          _count: {
            select: {
              ratePlans: true,
              services: true,
            },
          },
        },
      }),
      prisma.ratePlan.findMany({
        orderBy: [{ isActive: "desc" }, { name: "asc" }],
        include: {
          carrier: {
            select: {
              id: true,
              name: true,
              isActive: true,
            },
          },
        },
      }),
      prisma.addOnService.findMany({
        orderBy: [{ isActive: "desc" }, { name: "asc" }],
        include: {
          carrier: {
            select: {
              id: true,
              name: true,
              isActive: true,
            },
          },
        },
      }),
      readBackupSettings(),
    ]);

  const backupFiles = await listBackupFiles(backupSettings.backupDirectory);

  return (
    <BaseInfoOverview
      stores={storeRows.map((store) => ({
        id: store.id,
        code: store.code,
        name: store.name,
        region: store.region,
        isActive: store.isActive,
        isDefault: store.isDefault,
      }))}
      carriers={carrierRows.map((carrier) => ({
        id: carrier.id,
        code: carrier.code,
        name: carrier.name,
        isActive: carrier.isActive,
        ratePlanCount: carrier._count.ratePlans,
        addOnServiceCount: carrier._count.services,
      }))}
      ratePlans={ratePlanRows.map((ratePlan) => ({
        id: ratePlan.id,
        carrierId: ratePlan.carrierId,
        carrierName: ratePlan.carrier.name,
        carrierActive: ratePlan.carrier.isActive,
        name: ratePlan.name,
        monthlyFee: ratePlan.monthlyFee,
        voiceCallMinutes: ratePlan.voiceCallMinutes,
        videoCallMinutes: ratePlan.videoCallMinutes,
        dataAllowanceGb: ratePlan.dataAllowanceGb,
        description: ratePlan.description,
        isActive: ratePlan.isActive,
      }))}
      addOnServices={addOnServiceRows.map((service) => ({
        id: service.id,
        carrierId: service.carrierId,
        carrierName: service.carrier?.name ?? null,
        carrierActive: service.carrier?.isActive ?? null,
        name: service.name,
        monthlyFee: service.monthlyFee,
        description: service.description,
        isActive: service.isActive,
      }))}
      backupState={{
        currentDirectory: backupSettings.backupDirectory,
        defaultDirectory: defaultBackupDirectory,
        sourceDatabasePath: resolveDatabaseFilePath(),
        backups: backupFiles.map((backup) => ({
          fileName: backup.fileName,
          createdAtLabel: formatBackupCreatedAt(backup.createdAt),
          sizeLabel: formatBackupSize(backup.sizeBytes),
        })),
      }}
      initialTab={initialTab}
      notice={notice}
    />
  );
}
