import type { Metadata } from "next";

import {
  getScheduleOverviewPageData,
  type ScheduleSearchParams,
} from "@/app/(workspace)/schedule/schedule-page-data";
import { ScheduleOverview } from "@/components/workspace/schedule-overview";

export const metadata: Metadata = {
  title: "일정 관리",
};

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<ScheduleSearchParams>;
}) {
  const pageData = await getScheduleOverviewPageData(await searchParams);

  return <ScheduleOverview pageData={pageData} />;
}
