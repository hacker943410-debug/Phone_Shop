import {
  formatActivationRuleLabel,
  getActivationEligibleDate,
  isActivationEligible,
} from "@/lib/activation-rules";
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
  storeId: string;
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

export interface DashboardStoreSummary {
  storeId: string;
  storeName: string;
  salesCount: number;
  salesAmount: number;
  collectedAmount: number;
  additionalPaymentAmount: number;
  profitAmount: number;
}

export interface DashboardStoreOption {
  id: string;
  name: string;
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

export interface DashboardReceivableSnapshot {
  customerName: string;
  carrierName: string;
  deviceModelName: string;
  balanceAmount: number;
}

export interface DashboardActivationEligibleCustomer {
  customerId: string;
  customerName: string;
  carrierName: string;
  lastSaleDate: string;
  eligibleDate: string;
  ruleLabel: string;
}

export interface DashboardCarrierTrendPoint {
  date: string;
  count: number;
}

export interface DashboardCarrierTrendSeries {
  carrierName: string;
  totalCount: number;
  points: DashboardCarrierTrendPoint[];
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
  activationEligibleCount: number;
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
  availableStores: DashboardStoreOption[];
  metrics: DashboardMetric[];
  summary: DashboardSummary;
  attentionItems: DashboardAttentionItem[];
  receivableSnapshots: DashboardReceivableSnapshot[];
  storeSummaries: DashboardStoreSummary[];
  staffSummaries: DashboardStaffSummary[];
  dailySummaries: DashboardDailySummary[];
  recentSales: DashboardRecentSale[];
  activationEligibleCustomers: DashboardActivationEligibleCustomer[];
  carrierTrendSeries: DashboardCarrierTrendSeries[];
}

type DashboardRawSearchParams = {
  preset?: string | string[];
  dateFrom?: string | string[];
  dateTo?: string | string[];
  storeId?: string | string[];
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
  const storeIdValue = readFirst(rawSearchParams.storeId);

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
      storeId: storeIdValue,
    };
  }

  const preset =
    isDashboardPreset(presetValue) && presetValue !== "custom"
      ? presetValue
      : "7d";

  return {
    preset,
    ...resolvePresetRange(preset, referenceDate),
    storeId: storeIdValue,
  };
}

export function buildDashboardQueryString(filters: DashboardFilters) {
  const searchParams = new URLSearchParams();
  searchParams.set("preset", filters.preset);
  searchParams.set("dateFrom", filters.dateFrom);
  searchParams.set("dateTo", filters.dateTo);
  if (filters.storeId) {
    searchParams.set("storeId", filters.storeId);
  }
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
  activationEligibleCustomers: DashboardActivationEligibleCustomer[];
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

  if (input.activationEligibleCustomers.length > 0) {
    items.push({
      title: `개통 가능 고객 ${input.activationEligibleCustomers.length}건`,
      detail: input.activationEligibleCustomers
        .slice(0, 3)
        .map(
          (record) =>
            `${record.customerName} / ${record.carrierName} / 가능일 ${record.eligibleDate}`,
        )
        .join(" / "),
      badge: "후속 확인",
      tone: "amber",
    });
  } else {
    items.push({
      title: "개통 가능 고객 없음",
      detail: "현재 규칙 기준으로 즉시 개통 가능한 고객이 없습니다.",
      badge: "안정",
      tone: "teal",
    });
  }

  return items;
}

export async function getDashboardReportData(
  rawSearchParams: DashboardRawSearchParams,
): Promise<DashboardReportData> {
  const filters = resolveDashboardFilters(rawSearchParams);
  const selectedStoreId = filters.storeId || undefined;
  const periodStart = parseKstDateInput(filters.dateFrom, "start");
  const periodEnd = parseKstDateInput(filters.dateTo, "end");
  const referenceDate = new Date();
  const todayFilters = resolveDashboardFilters({ preset: "today" });
  const todayStart = parseKstDateInput(todayFilters.dateFrom, "start");
  const todayEnd = parseKstDateInput(todayFilters.dateTo, "end");

  const [
    activeStores,
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
    activationRules,
    activationCustomers,
    activationSales,
  ] = await Promise.all([
    prisma.store.findMany({
      where: {
        isActive: true,
      },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
      },
    }),
    prisma.sale.findMany({
      where: {
        status: "COMPLETED",
        ...(selectedStoreId ? { storeId: selectedStoreId } : {}),
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
        store: {
          select: {
            id: true,
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
        ...(selectedStoreId ? { storeId: selectedStoreId } : {}),
        paymentDate: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      select: {
        amount: true,
        paymentDate: true,
        store: {
          select: {
            id: true,
            name: true,
          },
        },
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
        ...(selectedStoreId ? { storeId: selectedStoreId } : {}),
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
        ...(selectedStoreId ? { storeId: selectedStoreId } : {}),
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
        ...(selectedStoreId ? { storeId: selectedStoreId } : {}),
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
        ...(selectedStoreId
          ? {
              sale: {
                storeId: selectedStoreId,
              },
            }
          : {}),
        balanceAmount: {
          gt: 0,
        },
      },
    }),
    prisma.receivable.count({
      where: {
        ...(selectedStoreId
          ? {
              sale: {
                storeId: selectedStoreId,
              },
            }
          : {}),
        balanceAmount: {
          gt: 0,
        },
      },
    }),
    prisma.receivable.count({
      where: {
        ...(selectedStoreId
          ? {
              sale: {
                storeId: selectedStoreId,
              },
            }
          : {}),
        status: "PARTIALLY_PAID",
      },
    }),
    prisma.receivable.findMany({
      where: {
        ...(selectedStoreId
          ? {
              sale: {
                storeId: selectedStoreId,
              },
            }
          : {}),
        balanceAmount: {
          gt: 0,
        },
      },
      take: 10,
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
        ...(selectedStoreId
          ? {
              sale: {
                storeId: selectedStoreId,
              },
            }
          : {}),
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
    prisma.carrierActivationRule.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        carrier: {
          name: "asc",
        },
      },
      include: {
        carrier: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.customer.findMany({
      where: {
        isHidden: false,
        currentCarrierId: {
          not: null,
        },
      },
      select: {
        id: true,
        name: true,
        currentCarrierId: true,
        currentCarrier: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.sale.findMany({
      where: {
        status: "COMPLETED",
        ...(selectedStoreId ? { storeId: selectedStoreId } : {}),
      },
      orderBy: [{ saleDate: "desc" }, { createdAt: "desc" }],
      select: {
        customerId: true,
        carrierId: true,
        saleDate: true,
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
  const activationRuleMap = new Map(
    activationRules.map((rule) => [rule.carrierId, rule]),
  );
  const latestActivationSaleMap = new Map<
    string,
    {
      carrierId: string;
      saleDate: Date;
    }
  >();

  for (const sale of activationSales) {
    const key = `${sale.customerId}:${sale.carrierId}`;

    if (!latestActivationSaleMap.has(key)) {
      latestActivationSaleMap.set(key, sale);
    }
  }

  const activationEligibleCustomers: DashboardActivationEligibleCustomer[] =
    activationCustomers
      .map((customer) => {
        const carrierId = customer.currentCarrierId;

        if (!carrierId || !customer.currentCarrier) {
          return null;
        }

        const rule = activationRuleMap.get(carrierId);
        const latestSale = latestActivationSaleMap.get(`${customer.id}:${carrierId}`);

        if (!rule || !latestSale) {
          return null;
        }

        const ruleConfig = {
          countUnit: rule.countUnit,
          countValue: rule.countValue,
          monthCountMode: rule.monthCountMode,
        };

        if (!isActivationEligible(referenceDate, latestSale.saleDate, ruleConfig)) {
          return null;
        }

        return {
          customerId: customer.id,
          customerName: customer.name,
          carrierName: customer.currentCarrier.name,
          lastSaleDate: formatKstDate(latestSale.saleDate),
          eligibleDate: formatKstDate(
            getActivationEligibleDate(latestSale.saleDate, ruleConfig),
          ),
          ruleLabel: formatActivationRuleLabel(ruleConfig),
        };
      })
      .filter((customer): customer is DashboardActivationEligibleCustomer => customer !== null)
      .sort((left, right) => {
        if (left.eligibleDate !== right.eligibleDate) {
          return left.eligibleDate.localeCompare(right.eligibleDate, "ko-KR");
        }

        return left.customerName.localeCompare(right.customerName, "ko-KR");
      });

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
    activationEligibleCount: activationEligibleCustomers.length,
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

  const storeMap = new Map<string, DashboardStoreSummary>();
  const staffMap = new Map<string, DashboardStaffSummary>();

  for (const sale of periodSales) {
    const storeId = sale.store?.id ?? "unassigned";
    const storeName = sale.store?.name ?? "미지정 매장";
    const existing = storeMap.get(storeId) ?? {
      storeId,
      storeName,
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

    storeMap.set(storeId, existing);
  }

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
    const paymentStoreId = payment.store?.id ?? "unassigned";
    const paymentStoreName = payment.store?.name ?? "미지정 매장";
    const storeSummary = storeMap.get(paymentStoreId) ?? {
      storeId: paymentStoreId,
      storeName: paymentStoreName,
      salesCount: 0,
      salesAmount: 0,
      collectedAmount: 0,
      additionalPaymentAmount: 0,
      profitAmount: 0,
    };

    storeSummary.additionalPaymentAmount += payment.amount;
    storeSummary.collectedAmount += payment.amount;

    storeMap.set(paymentStoreId, storeSummary);

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

  const carrierDailyCountMap = new Map<string, Map<string, number>>();
  const carrierTotalCountMap = new Map<string, number>();

  for (const sale of periodSales) {
    const carrierName = sale.carrier.name;
    const dateKey = formatKstDate(sale.saleDate);
    const dailyMap = carrierDailyCountMap.get(carrierName) ?? new Map<string, number>();

    dailyMap.set(dateKey, (dailyMap.get(dateKey) ?? 0) + 1);
    carrierDailyCountMap.set(carrierName, dailyMap);
    carrierTotalCountMap.set(
      carrierName,
      (carrierTotalCountMap.get(carrierName) ?? 0) + 1,
    );
  }

  const carrierTrendSeries: DashboardCarrierTrendSeries[] = [...carrierTotalCountMap.entries()]
    .sort((left, right) => {
      if (right[1] !== left[1]) {
        return right[1] - left[1];
      }

      return left[0].localeCompare(right[0], "ko-KR");
    })
    .slice(0, 3)
    .map(([carrierName, totalCount]) => ({
      carrierName,
      totalCount,
      points: listDateInputs(filters.dateFrom, filters.dateTo).map((date) => ({
        date,
        count: carrierDailyCountMap.get(carrierName)?.get(date) ?? 0,
      })),
    }));

  return {
    filters,
    periodLabel: formatKstDateRange(periodStart, periodEnd),
    generatedAt: formatKstDate(new Date()),
    availableStores: activeStores,
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
      activationEligibleCustomers,
    }),
    receivableSnapshots: topReceivables.map((record) => ({
      customerName: record.customer.name,
      carrierName: record.sale.carrier.name,
      deviceModelName: record.sale.deviceModel.name,
      balanceAmount: record.balanceAmount,
    })),
    storeSummaries: [...storeMap.values()].sort((left, right) => {
      if (right.salesAmount !== left.salesAmount) {
        return right.salesAmount - left.salesAmount;
      }

      if (right.profitAmount !== left.profitAmount) {
        return right.profitAmount - left.profitAmount;
      }

      return left.storeName.localeCompare(right.storeName, "ko-KR");
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
    recentSales: periodSales.slice(0, 10).map((sale) => ({
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
    activationEligibleCustomers,
    carrierTrendSeries,
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
    ["개통 가능 고객", report.summary.activationEligibleCount],
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
    ["판매일", "고객", "통신사", "기종", "담당자", "수납 금액", "미수 금액", "총이익"],
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
