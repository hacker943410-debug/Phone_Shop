import type { Metadata } from "next";

import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { getDashboardReportData } from "@/lib/dashboard-reporting";

export const metadata: Metadata = {
  title: "대시보드",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    preset?: string | string[];
    dateFrom?: string | string[];
    dateTo?: string | string[];
  }>;
}) {
  const report = await getDashboardReportData(await searchParams);

  return <DashboardOverview report={report} />;
}
