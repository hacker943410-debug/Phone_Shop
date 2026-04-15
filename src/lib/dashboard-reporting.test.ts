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
      storeId: "",
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
      storeId: "",
    });
  });

  it("builds a csv report with summary and sales sections", () => {
    const report: DashboardReportData = {
      filters: {
        preset: "custom",
        dateFrom: "2026-04-01",
        dateTo: "2026-04-12",
        storeId: "",
      },
      periodLabel: "2026-04-01 ~ 2026-04-12",
      generatedAt: "2026-04-12",
      availableStores: [],
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
        activationEligibleCount: 2,
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
      receivableSnapshots: [],
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
          customerName: "김수현",
          carrierName: "KT",
          deviceModelName: "iPhone 16",
          staffName: "박선우",
          collectedAmount: 988_000,
          receivableAmount: 300_000,
          receivableStatus: "PARTIALLY_PAID",
          profitAmount: 380_000,
        },
      ],
      activationEligibleCustomers: [
        {
          customerId: "customer-yoon-seojin",
          customerName: "윤서진",
          carrierName: "KT",
          lastSaleDate: "2025-12-02",
          eligibleDate: "2026-04-08",
          ruleLabel: "127일 기준",
        },
      ],
      carrierTrendSeries: [
        {
          carrierName: "KT",
          totalCount: 2,
          points: [
            { date: "2026-04-11", count: 2 },
          ],
        },
      ],
    };

    const csv = buildDashboardCsv(report);

    expect(csv).toContain("PhoneShop 기간 보고서");
    expect(csv).toContain("조회 기간,2026-04-01 ~ 2026-04-12");
    expect(csv).toContain("일자,판매 건수,판매 금액,수납 금액,리베이트,정책 수익,총이익");
    expect(csv).toContain("판매일,고객,통신사,기종,담당자,수납 금액,미수 금액,총이익");
    expect(csv).toContain("2026-04-11,김수현,KT,iPhone 16,박선우,988000,300000,380000");
  });
});
