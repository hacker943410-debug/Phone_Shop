import {
  buildDashboardCsv,
  resolveDashboardFilters,
  type DashboardReportData,
} from "@/lib/dashboard-reporting";

describe("dashboard reporting", () => {
  it("defaults to the last 7 days when filters are absent", () => {
    expect(
      resolveDashboardFilters({}, new Date("2026-04-12T09:00:00+09:00")),
    ).toEqual({
      preset: "7d",
      dateFrom: "2026-04-06",
      dateTo: "2026-04-12",
    });
  });

  it("uses a custom date range when explicit dates are provided", () => {
    expect(
      resolveDashboardFilters(
        {
          preset: "month",
          dateFrom: "2026-04-12",
          dateTo: "2026-04-01",
        },
        new Date("2026-04-12T09:00:00+09:00"),
      ),
    ).toEqual({
      preset: "custom",
      dateFrom: "2026-04-01",
      dateTo: "2026-04-12",
    });
  });

  it("builds a csv report with summary and sales sections", () => {
    const report: DashboardReportData = {
      filters: {
        preset: "custom",
        dateFrom: "2026-04-01",
        dateTo: "2026-04-12",
      },
      periodLabel: "2026-04-01 ~ 2026-04-12",
      generatedAt: "2026-04-12",
      metrics: [],
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
      attentionItems: [],
      staffSummaries: [],
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

    const csv = buildDashboardCsv(report);

    expect(csv).toContain("PhoneShop 기간 보고서");
    expect(csv).toContain("조회 기간,2026-04-01 ~ 2026-04-12");
    expect(csv).toContain("일자,판매 건수,판매 금액,수납 금액,리베이트,정책 수익,총이익");
    expect(csv).toContain("판매일,고객,통신사,단말기,담당자,수납 금액,미수 금액,총이익");
    expect(csv).toContain("2026-04-11,김서현,KT,iPhone 16,박선영,988000,300000,380000");
  });
});
