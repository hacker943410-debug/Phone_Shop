import type { Metadata } from "next";

import { BaseInfoOverview } from "@/components/workspace/base-info-overview";
import { requireRole } from "@/lib/auth/dal";
import { getBaseInfoOverviewData } from "@/lib/base-info-page-data";

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
  | "staffs"
  | "carriers"
  | "salesAgencies"
  | "colors"
  | "deviceModels"
  | "ratePlans"
  | "addOnServices"
  | "backup"
  | "restore" {
  return (
    value === "stores" ||
    value === "staffs" ||
    value === "carriers" ||
    value === "salesAgencies" ||
    value === "colors" ||
    value === "deviceModels" ||
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
  const overviewData = await getBaseInfoOverviewData();

  return (
    <BaseInfoOverview
      {...overviewData}
      initialTab={initialTab}
      notice={notice}
    />
  );
}
