import { render, screen, waitFor } from "@testing-library/react";

import { ScheduleOverview } from "@/components/workspace/schedule-overview";
import type {
  ScheduleInitialDialogState,
  ScheduleOverviewPageData,
} from "@/app/(workspace)/schedule/schedule-page-data";

const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

vi.mock("@/components/workspace/schedule-upsert-dialog", () => ({
  ScheduleUpsertDialog: ({
    initialSchedule,
  }: {
    initialSchedule: { title: string } | null;
  }) => <div>dialog:{initialSchedule?.title ?? "empty"}</div>,
}));

const pageData: ScheduleOverviewPageData = {
  todayInput: "2026-04-22",
  month: {
    currentMonthInput: "2026-04",
    monthInput: "2026-04",
    monthLabel: "2026년 4월",
    prevMonthInput: "2026-03",
    nextMonthInput: "2026-05",
  },
  metrics: {
    retentionDueIn3Days: 0,
    retentionDueIn7Days: 0,
    automaticScheduleCount: 0,
    manualScheduleCount: 0,
  },
  calendarWeeks: [],
  monthEventCounts: [],
  highlightEvents: [],
  allMonthEvents: [],
  manualSchedules: [],
  manualScheduleItems: [],
  customerOptions: [],
  retentionAlerts: [],
  holidayInfo: {
    status: "cache",
    label: "캐시 공휴일",
  },
};

const initialDialogState: ScheduleInitialDialogState = {
  defaultDateInput: "2026-04-22",
  initialSchedule: {
    title: "미수금 잔액 확인",
    scheduledDate: "2026-04-22",
    status: "OPEN",
    customerId: "customer-kim",
    memo: "잔액 ₩180,000",
    saleId: "sale-kim",
    saleCustomerId: "customer-kim",
    saleLabel: "KT Galaxy S25",
  },
};

describe("ScheduleOverview", () => {
  afterEach(() => {
    replaceMock.mockClear();
  });

  it("opens a prefilled create dialog from query state and clears the URL", async () => {
    render(
      <ScheduleOverview
        initialDialogState={initialDialogState}
        pageData={pageData}
      />,
    );

    expect(screen.getByText("dialog:미수금 잔액 확인")).toBeInTheDocument();

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/schedule?month=2026-04", {
        scroll: false,
      });
    });
  });
});
