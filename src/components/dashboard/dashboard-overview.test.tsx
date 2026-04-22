import { render, screen } from "@testing-library/react";

import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import type { DashboardReportData } from "@/lib/dashboard-reporting";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

const report: DashboardReportData = {
  filters: {
    preset: "week",
    dateFrom: "2026-04-06",
    dateTo: "2026-04-12",
    storeId: "",
    staffId: "",
  },
  periodLabel: "2026-04-06 ~ 2026-04-12",
  generatedAt: "2026-04-12",
  availableStores: [
    { id: "store-main", name: "본점" },
    { id: "store-gangnam", name: "강남점" },
  ],
  availableStaffs: [
    { id: "user-kim", name: "김지훈" },
    { id: "user-park", name: "박선영" },
  ],
  metrics: [
    {
      label: "선택 기간 매출",
      value: "₩4,618,000",
      helper: "판매 4건 / 오늘 취소 0건",
      accent: "amber",
    },
    {
      label: "선택 기간 수금",
      value: "₩3,638,000",
      helper: "당일 수금 ₩3,518,000 / 추가 수납 ₩120,000",
      accent: "teal",
    },
    {
      label: "현재 미수금",
      value: "₩980,000",
      helper: "미수 3건 / 부분수납 1건",
      accent: "slate",
    },
    {
      label: "선택 기간 순이익",
      value: "₩1,170,000",
      helper: "리베이트 ₩980,000 / 정책 수익 ₩190,000",
      accent: "amber",
    },
  ],
  summary: {
    todaySalesCount: 0,
    todayCanceledSalesCount: 0,
    todayInitialReceivedAmount: 0,
    todayAdditionalPaymentAmount: 0,
    todayCollectedAmount: 0,
    currentReceivableBalance: 980_000,
    currentReceivableCount: 3,
    partialReceivableCount: 1,
    activationEligibleCount: 1,
    periodSalesCount: 4,
    periodSalesAmount: 4_618_000,
    periodInitialReceivedAmount: 3_518_000,
    periodAdditionalPaymentAmount: 120_000,
    periodCollectedAmount: 3_638_000,
    periodReceivableCreatedAmount: 1_100_000,
    periodRebateAmount: 980_000,
    periodPolicyRevenueAmount: 190_000,
    periodProfitAmount: 1_170_000,
  },
  attentionItems: [],
  receivableSnapshots: [
    {
      customerName: "김지원",
      carrierName: "KT",
      deviceModelName: "iPhone 16",
      balanceAmount: 600_000,
    },
  ],
  storeSummaries: [
    {
      storeId: "store-gangnam",
      storeName: "강남점",
      salesCount: 2,
      salesAmount: 2_430_000,
      collectedAmount: 2_108_000,
      additionalPaymentAmount: 120_000,
      profitAmount: 630_000,
    },
  ],
  staffSummaries: [
    {
      staffId: "user-kim",
      staffName: "김지훈",
      salesCount: 2,
      paymentCount: 1,
      salesAmount: 1_940_000,
      collectedAmount: 1_560_000,
      additionalPaymentAmount: 0,
      profitAmount: 250_000,
    },
  ],
  receivableHealthBuckets: [
    {
      id: "0-7",
      label: "0~7일",
      count: 1,
      balanceAmount: 180_000,
      tone: "teal",
    },
    {
      id: "8-30",
      label: "8~30일",
      count: 1,
      balanceAmount: 300_000,
      tone: "slate",
    },
    {
      id: "31-60",
      label: "31~60일",
      count: 1,
      balanceAmount: 500_000,
      tone: "amber",
    },
    {
      id: "61+",
      label: "61일 이상",
      count: 0,
      balanceAmount: 0,
      tone: "rose",
    },
  ],
  dailySummaries: [
    {
      date: "2026-04-11",
      salesCount: 2,
      salesAmount: 2_428_000,
      collectedAmount: 2_108_000,
      rebateAmount: 560_000,
      policyRevenueAmount: 70_000,
      profitAmount: 630_000,
    },
  ],
  recentSales: [
    {
      id: "sale-1",
      saleDate: "2026-04-11",
      customerName: "김서현",
      carrierName: "KT",
      deviceModelName: "iPhone 16",
      staffName: "박선영",
      collectedAmount: 988_000,
      receivableAmount: 300_000,
      receivableStatus: "PARTIALLY_PAID",
      profitAmount: 380_000,
    },
  ],
  activationEligibleCustomers: [
    {
      customerId: "customer-yoon",
      customerName: "윤서진",
      carrierName: "KT",
      lastSaleDate: "2025-12-02",
      eligibleDate: "2026-04-08",
      daysUntil: 2,
      ruleLabel: "127일 기준",
    },
  ],
  retentionTopCustomers: [
    {
      customerId: "customer-yoon",
      customerName: "윤서진",
      carrierName: "KT",
      lastSaleDate: "2025-12-02",
      eligibleDate: "2026-04-08",
      daysUntil: 2,
      ruleLabel: "127일 기준",
    },
  ],
  upcomingScheduleRows: [
    {
      id: "manual:schedule-1",
      dateInput: "2026-04-09",
      kindLabel: "수동 일정",
      title: "유지 안내 콜백",
      customerName: "윤서진",
      subtitle: "KT / iPhone 16 / 오후 연락",
      statusLabel: "예정",
    },
  ],
  carrierTrendSeries: [
    {
      carrierName: "KT",
      totalCount: 2,
      points: [
        { date: "2026-04-10", count: 1 },
        { date: "2026-04-11", count: 1 },
      ],
    },
    {
      carrierName: "SKT",
      totalCount: 1,
      points: [
        { date: "2026-04-10", count: 0 },
        { date: "2026-04-11", count: 1 },
      ],
    },
  ],
};

describe("DashboardOverview", () => {
  it("renders the compact dashboard, charts, tables, and export links", () => {
    render(<DashboardOverview report={report} />);
    expect(screen.getByText("직원별 업무 처리 건수")).toBeInTheDocument();

    expect(screen.getByText("선택 기간 매출")).toBeInTheDocument();
    expect(screen.getByText("매장별 매출 실적")).toBeInTheDocument();
    expect(screen.getByText("통신사별 판매 건수")).toBeInTheDocument();
    expect(screen.getByText("기간별 흐름")).toBeInTheDocument();
    expect(screen.getByText("미수금 건전성")).toBeInTheDocument();
    expect(screen.getByText("유지만료예정고객 Top 10")).toBeInTheDocument();
    expect(screen.getByText("예정된 일정 Top 10")).toBeInTheDocument();
    expect(screen.getByText("조회 기간 2026-04-06 ~ 2026-04-12")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "상세 리포트" })).toHaveAttribute(
      "href",
      "/reports/summary?preset=week&dateFrom=2026-04-06&dateTo=2026-04-12",
    );
    expect(screen.getByRole("link", { name: "CSV" })).toHaveAttribute(
      "href",
      "/api/reports/summary?preset=week&dateFrom=2026-04-06&dateTo=2026-04-12",
    );
    expect(screen.getByRole("link", { name: "PDF" })).toHaveAttribute(
      "href",
      "/api/reports/summary/pdf?preset=week&dateFrom=2026-04-06&dateTo=2026-04-12",
    );
    expect(screen.getByText("D-2")).toBeInTheDocument();
    expect(screen.getByText("유지 안내 콜백")).toBeInTheDocument();
  });
});
