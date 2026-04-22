import {
  formatActivationRuleLabel,
  getActivationEligibleDate,
  isActivationEligible,
} from "@/lib/activation-rules";
import { formatKstDate, formatKstDateRange, parseKstDateInput } from "@/lib/date-utils";
import {
  dashboardPresets,
  type DashboardActivationEligibleCustomer,
  type DashboardAttentionItem,
  type DashboardCarrierTrendSeries,
  type DashboardDailySummary,
  type DashboardFilters,
  type DashboardMetric,
  type DashboardPreset,
  type DashboardReceivableHealthBucket,
  type DashboardReportData,
  type DashboardStaffOption,
  type DashboardStaffSummary,
  type DashboardStoreSummary,
  type DashboardSummary,
  type DashboardUpcomingScheduleRow,
} from "@/lib/dashboard-reporting-types";
import { prisma } from "@/lib/prisma";
import {
  getScheduleEventPriority,
  listUpcomingBusinessScheduleEvents,
  type ScheduleEventRecord,
} from "@/lib/schedule";

export * from "@/lib/dashboard-reporting-types";

type DashboardRawSearchParams = {
  preset?: string | string[];
  dateFrom?: string | string[];
  dateTo?: string | string[];
  storeId?: string | string[];
  staffId?: string | string[];
};

const dayMs = 86_400_000;

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
  const todayDate = parseKstDateInput(today, "start");

  switch (preset) {
    case "today":
      return {
        dateFrom: today,
        dateTo: today,
      };
    case "week": {
      const weekStartDate = new Date(todayDate);
      const weekday = new Date(`${today}T12:00:00+09:00`).getUTCDay();
      const offset = weekday === 0 ? -6 : 1 - weekday;

      weekStartDate.setUTCDate(weekStartDate.getUTCDate() + offset);

      return {
        dateFrom: formatKstDate(weekStartDate),
        dateTo: today,
      };
    }
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
    case "week":
      return "이번 주";
    case "month":
      return "이번 달";
    case "custom":
      return "직접 선택";
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
  const staffIdValue = readFirst(rawSearchParams.staffId);

  if (isDateInput(dateFromValue) || isDateInput(dateToValue)) {
    const fallbackRange = resolvePresetRange("month", referenceDate);
    let dateFrom = isDateInput(dateFromValue)
      ? dateFromValue
      : isDateInput(dateToValue)
        ? dateToValue
        : fallbackRange.dateFrom;
    let dateTo = isDateInput(dateToValue)
      ? dateToValue
      : isDateInput(dateFromValue)
        ? dateFromValue
        : fallbackRange.dateTo;

    if (dateFrom > dateTo) {
      [dateFrom, dateTo] = [dateTo, dateFrom];
    }

    return {
      preset: "custom",
      dateFrom,
      dateTo,
      storeId: storeIdValue,
      staffId: staffIdValue,
    };
  }

  const preset =
    isDashboardPreset(presetValue) && presetValue !== "custom"
      ? presetValue
      : "month";

  return {
    preset,
    ...resolvePresetRange(preset, referenceDate),
    storeId: storeIdValue,
    staffId: staffIdValue,
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

  if (filters.staffId) {
    searchParams.set("staffId", filters.staffId);
  }

  return searchParams.toString();
}

function buildDashboardMetricCards(summary: DashboardSummary): DashboardMetric[] {
  return [
    {
      label: "선택 기간 매출",
      value: formatCurrency(summary.periodSalesAmount),
      helper: `판매 ${summary.periodSalesCount}건 / 오늘 취소 ${summary.todayCanceledSalesCount}건`,
      accent: "amber",
    },
    {
      label: "선택 기간 수금",
      value: formatCurrency(summary.periodCollectedAmount),
      helper: `당일 수금 ${formatCurrency(summary.periodInitialReceivedAmount)} / 추가 수납 ${formatCurrency(summary.periodAdditionalPaymentAmount)}`,
      accent: "teal",
    },
    {
      label: "현재 미수금",
      value: formatCurrency(summary.currentReceivableBalance),
      helper: `미수 ${summary.currentReceivableCount}건 / 부분수납 ${summary.partialReceivableCount}건`,
      accent: "slate",
    },
    {
      label: "선택 기간 순이익",
      value: formatCurrency(summary.periodProfitAmount),
      helper: `리베이트 ${formatCurrency(summary.periodRebateAmount)} / 정책 수익 ${formatCurrency(summary.periodPolicyRevenueAmount)}`,
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
      title: `부분수납 진행 ${input.partialReceivableCount}건`,
      detail: detail || "추가 입금 확인이 필요한 부분수납 건이 있습니다.",
      badge: "추적 필요",
      tone: "amber",
    });
  } else {
    items.push({
      title: "부분수납 진행 없음",
      detail: "부분수납 상태의 고객이 없어 잔액 확인이 단순한 상태입니다.",
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

function buildSaleScopedWhere(storeId?: string, staffId?: string) {
  if (!storeId && !staffId) {
    return undefined;
  }

  return {
    ...(storeId ? { storeId } : {}),
    ...(staffId ? { staffId } : {}),
  };
}

function buildReceivableScopedWhere(storeId?: string, staffId?: string) {
  const saleWhere = buildSaleScopedWhere(storeId, staffId);

  if (!saleWhere) {
    return {};
  }

  return {
    sale: saleWhere,
  };
}

function buildUpcomingManualScheduleWhere(storeId?: string, staffId?: string) {
  if (!storeId && !staffId) {
    return {};
  }

  const saleWhere = buildSaleScopedWhere(storeId, staffId);
  const orFilters: Array<Record<string, unknown>> = [];

  if (saleWhere) {
    orFilters.push({ sale: saleWhere });
  }

  if (staffId) {
    orFilters.push({
      createdById: staffId,
      saleId: null,
    });
  }

  return orFilters.length > 0 ? { OR: orFilters } : {};
}

function buildReceivableHealthBuckets(input: {
  receivables: Array<{
    balanceAmount: number;
    createdAt: Date;
  }>;
  referenceDate: Date;
}): DashboardReceivableHealthBucket[] {
  const bucketMap = new Map<string, DashboardReceivableHealthBucket>([
    ["0-7", { id: "0-7", label: "0~7일", count: 0, balanceAmount: 0, tone: "teal" }],
    ["8-30", { id: "8-30", label: "8~30일", count: 0, balanceAmount: 0, tone: "slate" }],
    ["31-60", { id: "31-60", label: "31~60일", count: 0, balanceAmount: 0, tone: "amber" }],
    ["61+", { id: "61+", label: "61일 이상", count: 0, balanceAmount: 0, tone: "rose" }],
  ]);

  for (const receivable of input.receivables) {
    const ageDays = Math.max(
      0,
      Math.floor((input.referenceDate.getTime() - receivable.createdAt.getTime()) / dayMs),
    );
    const bucketId =
      ageDays <= 7 ? "0-7" : ageDays <= 30 ? "8-30" : ageDays <= 60 ? "31-60" : "61+";
    const bucket = bucketMap.get(bucketId);

    if (!bucket) {
      continue;
    }

    bucket.count += 1;
    bucket.balanceAmount += receivable.balanceAmount;
  }

  return [...bucketMap.values()];
}

function formatManualScheduleStatusLabel(status: string | null) {
  switch (status) {
    case "DONE":
      return "완료";
    case "CANCELED":
      return "취소";
    default:
      return "예정";
  }
}

function buildUpcomingScheduleRows(input: {
  todayInput: string;
  retentionRows: DashboardActivationEligibleCustomer[];
  manualSchedules: Array<{
    id: string;
    title: string;
    scheduledDate: Date;
    status: string;
    memo: string | null;
    customer: {
      name: string;
    } | null;
    sale: {
      customer: {
        name: string;
      } | null;
      carrier: {
        name: string;
      } | null;
      deviceModel: {
        name: string;
      } | null;
    } | null;
  }>;
}): DashboardUpcomingScheduleRow[] {
  const manualEvents = input.manualSchedules.map<ScheduleEventRecord>((schedule) => {
    const customerName = schedule.customer?.name ?? schedule.sale?.customer?.name ?? null;
    const subtitleParts = [
      schedule.sale?.carrier?.name ?? null,
      schedule.sale?.deviceModel?.name ?? null,
      schedule.memo ?? null,
    ].filter(Boolean);

    return {
      id: `manual:${schedule.id}`,
      dateInput: formatKstDate(schedule.scheduledDate),
      kind: "MANUAL",
      title: schedule.title,
      subtitle: subtitleParts.length > 0 ? subtitleParts.join(" / ") : null,
      customerName,
      priority: getScheduleEventPriority("MANUAL"),
      manualStatus: schedule.status as "OPEN" | "DONE" | "CANCELED",
      manualScheduleId: schedule.id,
    };
  });

  const retentionEvents = input.retentionRows.map<ScheduleEventRecord>((row) => ({
    id: `retention:${row.customerId}:${row.eligibleDate}`,
    dateInput: row.eligibleDate,
    kind: "RETENTION_DUE",
    title: "유지 만료 예정",
    subtitle: `${row.carrierName} / ${row.ruleLabel}`,
    customerName: row.customerName,
    priority: getScheduleEventPriority("RETENTION_DUE"),
    manualStatus: null,
    manualScheduleId: null,
  }));

  const retentionDaysMap = new Map(
    input.retentionRows.map((row) => [
      `retention:${row.customerId}:${row.eligibleDate}`,
      row.daysUntil,
    ]),
  );

  return listUpcomingBusinessScheduleEvents({
    events: [...retentionEvents, ...manualEvents],
    dateFrom: input.todayInput,
    limit: 10,
  }).map((event) => {
    const daysUntil = retentionDaysMap.get(event.id);
    const statusLabel =
      event.kind === "RETENTION_DUE"
        ? daysUntil === 0
          ? "D-day"
          : `D-${daysUntil ?? 0}`
        : formatManualScheduleStatusLabel(event.manualStatus);

    return {
      id: event.id,
      dateInput: event.dateInput,
      kindLabel: event.kind === "RETENTION_DUE" ? "유지 만료" : "수동 일정",
      title: event.title,
      customerName: event.customerName,
      subtitle: event.subtitle,
      statusLabel,
    };
  });
}

export async function getDashboardReportData(
  rawSearchParams: DashboardRawSearchParams,
): Promise<DashboardReportData> {
  const filters = resolveDashboardFilters(rawSearchParams);
  const selectedStoreId = filters.storeId || undefined;
  const selectedStaffId = filters.staffId || undefined;
  const saleScopedWhere = buildSaleScopedWhere(selectedStoreId, selectedStaffId);
  const receivableScopedWhere = buildReceivableScopedWhere(
    selectedStoreId,
    selectedStaffId,
  );
  const periodStart = parseKstDateInput(filters.dateFrom, "start");
  const periodEnd = parseKstDateInput(filters.dateTo, "end");
  const referenceDate = new Date();
  const todayFilters = resolveDashboardFilters({
    preset: "today",
    storeId: filters.storeId,
    staffId: filters.staffId,
  });
  const todayStart = parseKstDateInput(todayFilters.dateFrom, "start");
  const todayEnd = parseKstDateInput(todayFilters.dateTo, "end");
  const todayInput = formatKstDate(referenceDate);
  const upcomingScheduleEnd = parseKstDateInput(shiftKstDateInput(todayInput, 30), "end");

  const [
    activeStores,
    activeStaffs,
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
    receivableHealthRows,
    activationRules,
    activationCustomers,
    activationSales,
    upcomingManualSchedules,
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
    prisma.user.findMany({
      where: {
        isActive: true,
        role: {
          in: ["ADMIN", "STAFF"],
        },
      },
      orderBy: [{ displayName: "asc" }, { username: "asc" }],
      select: {
        id: true,
        displayName: true,
      },
    }),
    prisma.sale.findMany({
      where: {
        status: "COMPLETED",
        ...(saleScopedWhere ?? {}),
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
        ...(saleScopedWhere ?? {}),
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
        ...(saleScopedWhere ?? {}),
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
        ...(saleScopedWhere ?? {}),
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
        ...(saleScopedWhere ?? {}),
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
        ...receivableScopedWhere,
        balanceAmount: {
          gt: 0,
        },
      },
    }),
    prisma.receivable.count({
      where: {
        ...receivableScopedWhere,
        balanceAmount: {
          gt: 0,
        },
      },
    }),
    prisma.receivable.count({
      where: {
        ...receivableScopedWhere,
        status: "PARTIALLY_PAID",
      },
    }),
    prisma.receivable.findMany({
      where: {
        ...receivableScopedWhere,
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
        ...receivableScopedWhere,
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
    prisma.receivable.findMany({
      where: {
        ...receivableScopedWhere,
        balanceAmount: {
          gt: 0,
        },
      },
      select: {
        balanceAmount: true,
        createdAt: true,
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
        ...(saleScopedWhere ?? {}),
      },
      orderBy: [{ saleDate: "desc" }, { createdAt: "desc" }],
      select: {
        customerId: true,
        carrierId: true,
        saleDate: true,
      },
    }),
    prisma.manualSchedule.findMany({
      where: {
        scheduledDate: {
          gte: todayStart,
          lte: upcomingScheduleEnd,
        },
        status: "OPEN",
        ...buildUpcomingManualScheduleWhere(selectedStoreId, selectedStaffId),
      },
      orderBy: [{ scheduledDate: "asc" }, { createdAt: "asc" }],
      take: 30,
      select: {
        id: true,
        title: true,
        scheduledDate: true,
        status: true,
        memo: true,
        customer: {
          select: {
            name: true,
          },
        },
        sale: {
          select: {
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
          },
        },
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

        const eligibleDate = getActivationEligibleDate(latestSale.saleDate, ruleConfig);
        const daysUntil = Math.round(
          (eligibleDate.getTime() - parseKstDateInput(todayInput, "start").getTime()) / dayMs,
        );

        return {
          customerId: customer.id,
          customerName: customer.name,
          carrierName: customer.currentCarrier.name,
          lastSaleDate: formatKstDate(latestSale.saleDate),
          eligibleDate: formatKstDate(eligibleDate),
          daysUntil,
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
      paymentCount: 0,
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
      paymentCount: 0,
      salesAmount: 0,
      collectedAmount: 0,
      additionalPaymentAmount: 0,
      profitAmount: 0,
    };

    existing.paymentCount += 1;
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
    .slice(0, 5)
    .map(([carrierName, totalCount]) => ({
      carrierName,
      totalCount,
      points: listDateInputs(filters.dateFrom, filters.dateTo).map((date) => ({
        date,
        count: carrierDailyCountMap.get(carrierName)?.get(date) ?? 0,
      })),
    }));

  const retentionTopCustomers = activationEligibleCustomers
    .filter((customer) => customer.daysUntil >= 0)
    .slice(0, 10);
  const upcomingScheduleRows = buildUpcomingScheduleRows({
    todayInput,
    retentionRows: activationEligibleCustomers.filter((customer) => customer.daysUntil >= 0),
    manualSchedules: upcomingManualSchedules,
  });

  return {
    filters,
    periodLabel: formatKstDateRange(periodStart, periodEnd),
    generatedAt: formatKstDate(referenceDate),
    availableStores: activeStores,
    availableStaffs: activeStaffs.map<DashboardStaffOption>((staff) => ({
      id: staff.id,
      name: staff.displayName,
    })),
    metrics: buildDashboardMetricCards(summary),
    summary,
    attentionItems: buildAttentionItems({
      currentReceivableCount,
      partialReceivableCount,
      currentReceivableBalance: summary.currentReceivableBalance,
      topReceivables: topReceivables.map((record) => ({
        customerName: record.customer.name,
        carrierName: record.sale?.carrier.name ?? "수동 등록",
        deviceModelName: record.sale?.deviceModel.name ?? "미수금",
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
      carrierName: record.sale?.carrier.name ?? "수동 등록",
      deviceModelName: record.sale?.deviceModel.name ?? "미수금",
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
      const rightActivityCount = right.salesCount + right.paymentCount;
      const leftActivityCount = left.salesCount + left.paymentCount;

      if (rightActivityCount !== leftActivityCount) {
        return rightActivityCount - leftActivityCount;
      }

      if (right.salesCount !== left.salesCount) {
        return right.salesCount - left.salesCount;
      }

      return right.paymentCount - left.paymentCount;
    }),
    receivableHealthBuckets: buildReceivableHealthBuckets({
      receivables: receivableHealthRows,
      referenceDate,
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
    retentionTopCustomers,
    upcomingScheduleRows,
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
    ["매장 필터", report.filters.storeId || "전체"],
    ["직원 필터", report.filters.staffId || "전체"],
    [],
    ["요약 항목", "값"],
    ["오늘 판매 건수", report.summary.todaySalesCount],
    ["오늘 수금 금액", report.summary.todayCollectedAmount],
    ["현재 미수금 잔액", report.summary.currentReceivableBalance],
    ["개통 가능 고객", report.summary.activationEligibleCount],
    ["선택 기간 판매 건수", report.summary.periodSalesCount],
    ["선택 기간 판매 금액", report.summary.periodSalesAmount],
    ["선택 기간 수금 금액", report.summary.periodCollectedAmount],
    ["선택 기간 리베이트", report.summary.periodRebateAmount],
    ["선택 기간 정책 수익", report.summary.periodPolicyRevenueAmount],
    ["선택 기간 순이익", report.summary.periodProfitAmount],
    [],
    [
      "일자",
      "판매 건수",
      "판매 금액",
      "수금 금액",
      "리베이트",
      "정책 수익",
      "순이익",
    ],
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
    [
      "판매일",
      "고객",
      "통신사",
      "기종",
      "담당자",
      "수금 금액",
      "미수 금액",
      "순이익",
    ],
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
