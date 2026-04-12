import { formatKstDate, formatKstDateRange, parseKstDateInput } from "@/lib/date-utils";
import { prisma } from "@/lib/prisma";

export const dashboardPresets = ["today", "7d", "30d", "month", "custom"] as const;

export type DashboardPreset = (typeof dashboardPresets)[number];

type DashboardTone = "amber" | "teal" | "rose" | "slate";
type DashboardAccent = "amber" | "teal" | "slate";
type ReceivableStatusValue = "UNPAID" | "PARTIALLY_PAID" | "PAID";

export interface DashboardFilters {
  preset: DashboardPreset;
  dateFrom: string;
  dateTo: string;
}

export interface DashboardMetric {
  label: string;
  value: string;
  helper: string;
  accent: DashboardAccent;
}

export interface DashboardAttentionItem {
  title: string;
  detail: string;
  badge: string;
  tone: DashboardTone;
}

export interface DashboardStaffSummary {
  staffId: string;
  staffName: string;
  salesCount: number;
  salesAmount: number;
  collectedAmount: number;
  additionalPaymentAmount: number;
  profitAmount: number;
}

export interface DashboardDailySummary {
  date: string;
  salesCount: number;
  salesAmount: number;
  collectedAmount: number;
  rebateAmount: number;
  policyRevenueAmount: number;
  profitAmount: number;
}

export interface DashboardRecentSale {
  id: string;
  saleDate: string;
  customerName: string;
  carrierName: string;
  deviceModelName: string;
  staffName: string;
  collectedAmount: number;
  receivableAmount: number;
  receivableStatus: ReceivableStatusValue | null;
  profitAmount: number;
}

export interface DashboardSummary {
  todaySalesCount: number;
  todayCanceledSalesCount: number;
  todayInitialReceivedAmount: number;
  todayAdditionalPaymentAmount: number;
  todayCollectedAmount: number;
  currentReceivableBalance: number;
  currentReceivableCount: number;
  partialReceivableCount: number;
  periodSalesCount: number;
  periodSalesAmount: number;
  periodInitialReceivedAmount: number;
  periodAdditionalPaymentAmount: number;
  periodCollectedAmount: number;
  periodReceivableCreatedAmount: number;
  periodRebateAmount: number;
  periodPolicyRevenueAmount: number;
  periodProfitAmount: number;
}

export interface DashboardReportData {
  filters: DashboardFilters;
  periodLabel: string;
  generatedAt: string;
  metrics: DashboardMetric[];
  summary: DashboardSummary;
  attentionItems: DashboardAttentionItem[];
  staffSummaries: DashboardStaffSummary[];
  dailySummaries: DashboardDailySummary[];
  recentSales: DashboardRecentSale[];
}

type DashboardRawSearchParams = {
  preset?: string | string[];
  dateFrom?: string | string[];
  dateTo?: string | string[];
};

function readFirst(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function isDashboardPreset(value: string): value is DashboardPreset {
  return dashboardPresets.includes(value as DashboardPreset);
}

function isDateInput(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  return !Number.isNaN(parseKstDateInput(value, "start").getTime());
}

function shiftKstDateInput(dateInput: string, offsetDays: number) {
  const date = parseKstDateInput(dateInput, "start");
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return formatKstDate(date);
}

function resolvePresetRange(
  preset: Exclude<DashboardPreset, "custom">,
  referenceDate: Date,
) {
  const today = formatKstDate(referenceDate);

  switch (preset) {
    case "today":
      return {
        dateFrom: today,
        dateTo: today,
      };
    case "7d":
      return {
        dateFrom: shiftKstDateInput(today, -6),
        dateTo: today,
      };
    case "30d":
      return {
        dateFrom: shiftKstDateInput(today, -29),
        dateTo: today,
      };
    case "month":
      return {
        dateFrom: `${today.slice(0, 8)}01`,
        dateTo: today,
      };
  }
}

function sumBy<T>(items: T[], iteratee: (item: T) => number) {
  return items.reduce((total, item) => total + iteratee(item), 0);
}

function listDateInputs(dateFrom: string, dateTo: string) {
  const values: string[] = [];
  let current = dateFrom;

  while (current <= dateTo) {
    values.push(current);
    current = shiftKstDateInput(current, 1);
  }

  return values;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getDashboardPresetLabel(preset: DashboardPreset) {
  switch (preset) {
    case "today":
      return "오늘";
    case "7d":
      return "최근 7일";
    case "30d":
      return "최근 30일";
    case "month":
      return "이번 달";
    case "custom":
      return "직접 지정";
  }
}

export function resolveDashboardFilters(
  rawSearchParams: DashboardRawSearchParams,
  referenceDate = new Date(),
): DashboardFilters {
  const presetValue = readFirst(rawSearchParams.preset);
  const dateFromValue = readFirst(rawSearchParams.dateFrom);
  const dateToValue = readFirst(rawSearchParams.dateTo);

  if (isDateInput(dateFromValue) || isDateInput(dateToValue)) {
    const fallbackRange = resolvePresetRange("7d", referenceDate);
    let dateFrom = isDateInput(dateFromValue)
      ? dateFromValue
      : (isDateInput(dateToValue) ? dateToValue : fallbackRange.dateFrom);
    let dateTo = isDateInput(dateToValue)
      ? dateToValue
      : (isDateInput(dateFromValue) ? dateFromValue : fallbackRange.dateTo);

    if (dateFrom > dateTo) {
      [dateFrom, dateTo] = [dateTo, dateFrom];
    }

    return {
      preset: "custom",
      dateFrom,
      dateTo,
    };
  }

  const preset =
    isDashboardPreset(presetValue) && presetValue !== "custom"
      ? presetValue
      : "7d";

  return {
    preset,
    ...resolvePresetRange(preset, referenceDate),
  };
}

export function buildDashboardQueryString(filters: DashboardFilters) {
  const searchParams = new URLSearchParams();
  searchParams.set("preset", filters.preset);
  searchParams.set("dateFrom", filters.dateFrom);
  searchParams.set("dateTo", filters.dateTo);
  return searchParams.toString();
}

function buildDashboardMetrics(summary: DashboardSummary): DashboardMetric[] {
  return [
    {
      label: "오늘 판매 건수",
      value: `${summary.todaySalesCount}건`,
      helper: `완료 판매 ${summary.todaySalesCount}건 / 취소 ${summary.todayCanceledSalesCount}건`,
      accent: "amber",
    },
    {
      label: "오늘 수납 금액",
      value: formatCurrency(summary.todayCollectedAmount),
      helper: `즉시 수납 ${formatCurrency(summary.todayInitialReceivedAmount)} / 추가 수납 ${formatCurrency(summary.todayAdditionalPaymentAmount)}`,
      accent: "teal",
    },
    {
      label: "현재 미수금 잔액",
      value: formatCurrency(summary.currentReceivableBalance),
      helper: `미수금 ${summary.currentReceivableCount}건 / 부분 수납 ${summary.partialReceivableCount}건`,
      accent: "slate",
    },
    {
      label: "선택 기간 리베이트",
      value: formatCurrency(summary.periodRebateAmount),
      helper: `선택 기간 판매 ${summary.periodSalesCount}건 기준`,
      accent: "amber",
    },
    {
      label: "선택 기간 정책 수익",
      value: formatCurrency(summary.periodPolicyRevenueAmount),
      helper: `기간 수납 ${formatCurrency(summary.periodCollectedAmount)} 흐름 포함`,
      accent: "teal",
    },
    {
      label: "선택 기간 총이익",
      value: formatCurrency(summary.periodProfitAmount),
      helper: `판매 금액 ${formatCurrency(summary.periodSalesAmount)} / 미수 발생 ${formatCurrency(summary.periodReceivableCreatedAmount)}`,
      accent: "amber",
    },
  ];
}

function buildAttentionItems(input: {
  currentReceivableCount: number;
  partialReceivableCount: number;
  currentReceivableBalance: number;
  topReceivables: Array<{
    customerName: string;
    carrierName: string;
    deviceModelName: string;
    balanceAmount: number;
  }>;
  partialReceivables: Array<{
    customerName: string;
    balanceAmount: number;
  }>;
  inventorySnapshot: {
    inStockCount: number;
    reservedCount: number;
    sampleItems: string[];
  };
}): DashboardAttentionItem[] {
  const items: DashboardAttentionItem[] = [];

  if (input.currentReceivableCount > 0) {
    const detail = input.topReceivables
      .map(
        (record) =>
          `${record.customerName} / ${record.carrierName} ${record.deviceModelName} / ${formatCurrency(record.balanceAmount)}`,
      )
      .join(" / ");

    items.push({
      title: `미수금 잔액 ${input.currentReceivableCount}건`,
      detail: detail || `현재 미수 총액 ${formatCurrency(input.currentReceivableBalance)}`,
      badge: "즉시 확인",
      tone: "rose",
    });
  } else {
    items.push({
      title: "현재 미수금 없음",
      detail: "열려 있는 미수금이 없어 추가 수납 추적이 필요한 건이 없습니다.",
      badge: "안정",
      tone: "teal",
    });
  }

  if (input.partialReceivableCount > 0) {
    const detail = input.partialReceivables
      .map((record) => `${record.customerName} ${formatCurrency(record.balanceAmount)}`)
      .join(" / ");

    items.push({
      title: `부분 수납 진행 ${input.partialReceivableCount}건`,
      detail: detail || "추가 입금 확인이 필요한 부분 수납 건이 있습니다.",
      badge: "추적 필요",
      tone: "amber",
    });
  } else {
    items.push({
      title: "부분 수납 진행 없음",
      detail: "부분 수납 상태의 고객이 없어 잔액 확인이 단순한 상태입니다.",
      badge: "정리됨",
      tone: "teal",
    });
  }

  items.push({
    title: `판매 대기 재고 ${input.inventorySnapshot.inStockCount}대 / 예약 ${input.inventorySnapshot.reservedCount}대`,
    detail:
      input.inventorySnapshot.sampleItems.join(" / ") ||
      "현재 노출 중인 판매 대기 재고가 없습니다.",
    badge:
      input.inventorySnapshot.reservedCount > 0
        ? "재고 확인"
        : "재고 안정",
    tone:
      input.inventorySnapshot.inStockCount > 0 ||
      input.inventorySnapshot.reservedCount > 0
        ? "slate"
        : "teal",
  });

  return items;
}

export async function getDashboardReportData(
  rawSearchParams: DashboardRawSearchParams,
): Promise<DashboardReportData> {
  const filters = resolveDashboardFilters(rawSearchParams);
  const periodStart = parseKstDateInput(filters.dateFrom, "start");
  const periodEnd = parseKstDateInput(filters.dateTo, "end");
  const todayFilters = resolveDashboardFilters({ preset: "today" });
  const todayStart = parseKstDateInput(todayFilters.dateFrom, "start");
  const todayEnd = parseKstDateInput(todayFilters.dateTo, "end");

  const [
    periodSales,
    periodPayments,
    todayCompletedSales,
    todayCompletedPayments,
    todayCanceledSalesCount,
    receivableAggregate,
    currentReceivableCount,
    partialReceivableCount,
    topReceivables,
    partialReceivables,
    inventoryCounts,
    inventorySamples,
  ] = await Promise.all([
    prisma.sale.findMany({
      where: {
        status: "COMPLETED",
        saleDate: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      orderBy: [{ saleDate: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        saleDate: true,
        finalSalePrice: true,
        actualReceivedAmount: true,
        receivableAmount: true,
        rebateAmount: true,
        policyRevenueAmount: true,
        totalProfitAmount: true,
        customer: {
          select: {
            name: true,
          },
        },
        carrier: {
          select: {
            name: true,
          },
        },
        deviceModel: {
          select: {
            name: true,
          },
        },
        staff: {
          select: {
            id: true,
            displayName: true,
          },
        },
        receivable: {
          select: {
            status: true,
            balanceAmount: true,
          },
        },
      },
    }),
    prisma.payment.findMany({
      where: {
        status: "COMPLETED",
        paymentDate: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      select: {
        amount: true,
        paymentDate: true,
        staff: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    }),
    prisma.sale.findMany({
      where: {
        status: "COMPLETED",
        saleDate: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      select: {
        actualReceivedAmount: true,
      },
    }),
    prisma.payment.findMany({
      where: {
        status: "COMPLETED",
        paymentDate: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      select: {
        amount: true,
      },
    }),
    prisma.sale.count({
      where: {
        status: "CANCELED",
        saleDate: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    }),
    prisma.receivable.aggregate({
      _sum: {
        balanceAmount: true,
      },
      where: {
        balanceAmount: {
          gt: 0,
        },
      },
    }),
    prisma.receivable.count({
      where: {
        balanceAmount: {
          gt: 0,
        },
      },
    }),
    prisma.receivable.count({
      where: {
        status: "PARTIALLY_PAID",
      },
    }),
    prisma.receivable.findMany({
      where: {
        balanceAmount: {
          gt: 0,
        },
      },
      take: 3,
      orderBy: [{ balanceAmount: "desc" }, { createdAt: "desc" }],
      select: {
        balanceAmount: true,
        customer: {
          select: {
            name: true,
          },
        },
        sale: {
          select: {
            carrier: {
              select: {
                name: true,
              },
            },
            deviceModel: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    }),
    prisma.receivable.findMany({
      where: {
        status: "PARTIALLY_PAID",
      },
      take: 3,
      orderBy: [{ balanceAmount: "desc" }, { updatedAt: "desc" }],
      select: {
        balanceAmount: true,
        customer: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.inventoryItem.groupBy({
      by: ["status"],
      where: {
        isHidden: false,
        status: {
          in: ["IN_STOCK", "RESERVED"],
        },
      },
      _count: {
        _all: true,
      },
    }),
    prisma.inventoryItem.findMany({
      where: {
        isHidden: false,
        status: {
          in: ["IN_STOCK", "RESERVED"],
        },
      },
      take: 3,
      orderBy: [{ receivedAt: "asc" }, { createdAt: "asc" }],
      select: {
        status: true,
        carrier: {
          select: {
            name: true,
          },
        },
        deviceModel: {
          select: {
            name: true,
          },
        },
        capacity: true,
      },
    }),
  ]);

  const todayInitialReceivedAmount = sumBy(
    todayCompletedSales,
    (sale) => sale.actualReceivedAmount,
  );
  const todayAdditionalPaymentAmount = sumBy(
    todayCompletedPayments,
    (payment) => payment.amount,
  );

  const summary: DashboardSummary = {
    todaySalesCount: todayCompletedSales.length,
    todayCanceledSalesCount,
    todayInitialReceivedAmount,
    todayAdditionalPaymentAmount,
    todayCollectedAmount:
      todayInitialReceivedAmount + todayAdditionalPaymentAmount,
    currentReceivableBalance: receivableAggregate._sum.balanceAmount ?? 0,
    currentReceivableCount,
    partialReceivableCount,
    periodSalesCount: periodSales.length,
    periodSalesAmount: sumBy(periodSales, (sale) => sale.finalSalePrice),
    periodInitialReceivedAmount: sumBy(
      periodSales,
      (sale) => sale.actualReceivedAmount,
    ),
    periodAdditionalPaymentAmount: sumBy(
      periodPayments,
      (payment) => payment.amount,
    ),
    periodCollectedAmount:
      sumBy(periodSales, (sale) => sale.actualReceivedAmount) +
      sumBy(periodPayments, (payment) => payment.amount),
    periodReceivableCreatedAmount: sumBy(
      periodSales,
      (sale) => sale.receivableAmount,
    ),
    periodRebateAmount: sumBy(periodSales, (sale) => sale.rebateAmount),
    periodPolicyRevenueAmount: sumBy(
      periodSales,
      (sale) => sale.policyRevenueAmount,
    ),
    periodProfitAmount: sumBy(periodSales, (sale) => sale.totalProfitAmount),
  };

  const staffMap = new Map<string, DashboardStaffSummary>();

  for (const sale of periodSales) {
    const existing = staffMap.get(sale.staff.id) ?? {
      staffId: sale.staff.id,
      staffName: sale.staff.displayName,
      salesCount: 0,
      salesAmount: 0,
      collectedAmount: 0,
      additionalPaymentAmount: 0,
      profitAmount: 0,
    };

    existing.salesCount += 1;
    existing.salesAmount += sale.finalSalePrice;
    existing.collectedAmount += sale.actualReceivedAmount;
    existing.profitAmount += sale.totalProfitAmount;

    staffMap.set(sale.staff.id, existing);
  }

  for (const payment of periodPayments) {
    const existing = staffMap.get(payment.staff.id) ?? {
      staffId: payment.staff.id,
      staffName: payment.staff.displayName,
      salesCount: 0,
      salesAmount: 0,
      collectedAmount: 0,
      additionalPaymentAmount: 0,
      profitAmount: 0,
    };

    existing.additionalPaymentAmount += payment.amount;
    existing.collectedAmount += payment.amount;

    staffMap.set(payment.staff.id, existing);
  }

  const dailySummaryMap = new Map<string, DashboardDailySummary>();

  for (const dateInput of listDateInputs(filters.dateFrom, filters.dateTo)) {
    dailySummaryMap.set(dateInput, {
      date: dateInput,
      salesCount: 0,
      salesAmount: 0,
      collectedAmount: 0,
      rebateAmount: 0,
      policyRevenueAmount: 0,
      profitAmount: 0,
    });
  }

  for (const sale of periodSales) {
    const key = formatKstDate(sale.saleDate);
    const current = dailySummaryMap.get(key);

    if (!current) {
      continue;
    }

    current.salesCount += 1;
    current.salesAmount += sale.finalSalePrice;
    current.collectedAmount += sale.actualReceivedAmount;
    current.rebateAmount += sale.rebateAmount;
    current.policyRevenueAmount += sale.policyRevenueAmount;
    current.profitAmount += sale.totalProfitAmount;
  }

  for (const payment of periodPayments) {
    const key = formatKstDate(payment.paymentDate);
    const current = dailySummaryMap.get(key);

    if (!current) {
      continue;
    }

    current.collectedAmount += payment.amount;
  }

  const inventorySummary = {
    inStockCount:
      inventoryCounts.find((group) => group.status === "IN_STOCK")?._count._all ??
      0,
    reservedCount:
      inventoryCounts.find((group) => group.status === "RESERVED")?._count._all ??
      0,
    sampleItems: inventorySamples.map(
      (item) =>
        `${item.status === "RESERVED" ? "예약" : "판매 대기"} / ${item.carrier.name} ${item.deviceModel.name} ${item.capacity}`,
    ),
  };

  return {
    filters,
    periodLabel: formatKstDateRange(periodStart, periodEnd),
    generatedAt: formatKstDate(new Date()),
    metrics: buildDashboardMetrics(summary),
    summary,
    attentionItems: buildAttentionItems({
      currentReceivableCount,
      partialReceivableCount,
      currentReceivableBalance: summary.currentReceivableBalance,
      topReceivables: topReceivables.map((record) => ({
        customerName: record.customer.name,
        carrierName: record.sale.carrier.name,
        deviceModelName: record.sale.deviceModel.name,
        balanceAmount: record.balanceAmount,
      })),
      partialReceivables: partialReceivables.map((record) => ({
        customerName: record.customer.name,
        balanceAmount: record.balanceAmount,
      })),
      inventorySnapshot: inventorySummary,
    }),
    staffSummaries: [...staffMap.values()].sort((left, right) => {
      if (right.profitAmount !== left.profitAmount) {
        return right.profitAmount - left.profitAmount;
      }

      if (right.salesCount !== left.salesCount) {
        return right.salesCount - left.salesCount;
      }

      return right.collectedAmount - left.collectedAmount;
    }),
    dailySummaries: [...dailySummaryMap.values()],
    recentSales: periodSales.slice(0, 8).map((sale) => ({
      id: sale.id,
      saleDate: formatKstDate(sale.saleDate),
      customerName: sale.customer.name,
      carrierName: sale.carrier.name,
      deviceModelName: sale.deviceModel.name,
      staffName: sale.staff.displayName,
      collectedAmount: sale.actualReceivedAmount,
      receivableAmount: sale.receivableAmount,
      receivableStatus: sale.receivable?.status ?? null,
      profitAmount: sale.totalProfitAmount,
    })),
  };
}

function escapeCsvCell(value: string | number) {
  const text = String(value);

  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, "\"\"")}"`;
  }

  return text;
}

function buildCsvRows(report: DashboardReportData) {
  return [
    ["PhoneShop 기간 보고서"],
    ["생성일", report.generatedAt],
    ["조회 기간", report.periodLabel],
    ["프리셋", getDashboardPresetLabel(report.filters.preset)],
    [],
    ["요약 항목", "값"],
    ["오늘 판매 건수", report.summary.todaySalesCount],
    ["오늘 수납 금액", report.summary.todayCollectedAmount],
    ["현재 미수금 잔액", report.summary.currentReceivableBalance],
    ["선택 기간 판매 건수", report.summary.periodSalesCount],
    ["선택 기간 판매 금액", report.summary.periodSalesAmount],
    ["선택 기간 수납 금액", report.summary.periodCollectedAmount],
    ["선택 기간 리베이트", report.summary.periodRebateAmount],
    ["선택 기간 정책 수익", report.summary.periodPolicyRevenueAmount],
    ["선택 기간 총이익", report.summary.periodProfitAmount],
    [],
    ["일자", "판매 건수", "판매 금액", "수납 금액", "리베이트", "정책 수익", "총이익"],
    ...report.dailySummaries.map((row) => [
      row.date,
      row.salesCount,
      row.salesAmount,
      row.collectedAmount,
      row.rebateAmount,
      row.policyRevenueAmount,
      row.profitAmount,
    ]),
    [],
    ["판매일", "고객", "통신사", "단말기", "담당자", "수납 금액", "미수 금액", "총이익"],
    ...report.recentSales.map((row) => [
      row.saleDate,
      row.customerName,
      row.carrierName,
      row.deviceModelName,
      row.staffName,
      row.collectedAmount,
      row.receivableAmount,
      row.profitAmount,
    ]),
  ];
}

export function buildDashboardCsv(report: DashboardReportData) {
  return buildCsvRows(report)
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\r\n");
}
