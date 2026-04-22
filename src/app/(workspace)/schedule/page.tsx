import type { Metadata } from "next";

import {
  buildScheduleInitialDialogState,
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
  const resolvedSearchParams = await searchParams;
  const pageData = await getScheduleOverviewPageData(resolvedSearchParams);
  const initialDialogState = buildScheduleInitialDialogState(
    resolvedSearchParams,
    pageData.todayInput,
  );

  return (
    <ScheduleOverview
      initialDialogState={initialDialogState}
      pageData={pageData}
    />
  );
}
