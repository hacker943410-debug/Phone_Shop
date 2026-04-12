import { render, screen } from "@testing-library/react";

import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import type { DashboardReportData } from "@/lib/dashboard-reporting";

const report: DashboardReportData = {
  filters: {
    preset: "7d",
    dateFrom: "2026-04-06",
    dateTo: "2026-04-12",
  },
  periodLabel: "2026-04-06 ~ 2026-04-12",
  generatedAt: "2026-04-12",
  metrics: [
    {
      label: "오늘 판매 건수",
      value: "0건",
      helper: "완료 판매 0건 / 취소 0건",
      accent: "amber",
    },
    {
      label: "오늘 수납 금액",
      value: "₩0",
      helper: "즉시 수납 ₩0 / 추가 수납 ₩0",
      accent: "teal",
    },
    {
      label: "현재 미수금 잔액",
      value: "₩980,000",
      helper: "미수금 3건 / 부분 수납 1건",
      accent: "slate",
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
  attentionItems: [
    {
      title: "미수금 잔액 3건",
      detail: "김서현 ₩180,000 / 정하은 ₩420,000 / 오시온 ₩380,000",
      badge: "즉시 확인",
      tone: "rose",
    },
  ],
  staffSummaries: [
    {
      staffId: "user-kim-jh",
      staffName: "김지후",
      salesCount: 2,
      salesAmount: 1_940_000,
      collectedAmount: 1_560_000,
      additionalPaymentAmount: 0,
      profitAmount: 250_000,
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
};

describe("DashboardOverview", () => {
  it("renders live dashboard sections and report actions", () => {
    render(<DashboardOverview report={report} />);

    expect(
      screen.getByRole("heading", {
        name: "오늘 숫자와 기간 보고를 한 화면에서 봅니다.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("오늘 판매 건수")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "인쇄용 보고서" }),
    ).toHaveAttribute(
      "href",
      "/reports/summary?preset=7d&dateFrom=2026-04-06&dateTo=2026-04-12",
    );
    expect(
      screen.getByRole("link", { name: "CSV 다운로드" }),
    ).toHaveAttribute(
      "href",
      "/api/reports/summary?preset=7d&dateFrom=2026-04-06&dateTo=2026-04-12",
    );
    expect(screen.getByText("운영 체크")).toBeInTheDocument();
    expect(screen.getByText("담당자 요약")).toBeInTheDocument();
    expect(screen.getByText("최근 판매")).toBeInTheDocument();
  });
});
