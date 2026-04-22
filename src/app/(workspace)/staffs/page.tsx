import type { Metadata } from "next";

import { BaseInfoOverview } from "@/components/workspace/base-info-overview";
import { requireRole } from "@/lib/auth/dal";
import { getBaseInfoOverviewData } from "@/lib/base-info-page-data";

export const metadata: Metadata = {
  title: "직원 관리",
};

export default async function StaffManagementPage() {
  await requireRole("ADMIN");

  const overviewData = await getBaseInfoOverviewData();

  return (
    <BaseInfoOverview
      {...overviewData}
      initialTab="staffs"
      notice={null}
      pageEyebrow="Staff"
      pageTitle="직원 관리"
      visibleTabs={["staffs"]}
    />
  );
}
