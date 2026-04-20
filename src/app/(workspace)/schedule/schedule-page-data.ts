import { getActivationEligibleDate } from "@/lib/activation-rules";
import { formatKstDate, parseKstDateInput } from "@/lib/date-utils";
import {
  getHolidayStatusLabel,
  getKoreanHolidaysForMonth,
  type KoreanHolidayFetchStatus,
} from "@/lib/holidays";
import { formatWon } from "@/lib/formatters";
import { prisma } from "@/lib/prisma";
import {
  buildScheduleCalendarWeeks,
  countScheduleEventsInRange,
  getScheduleEventPriority,
  listScheduleMonthsBetween,
  resolveScheduleMonthState,
  shiftScheduleMonth,
  sortScheduleEvents,
  type ManualScheduleStatusValue,
  type ScheduleCalendarDay,
  type ScheduleEventKind,
  type ScheduleEventRecord,
} from "@/lib/schedule";

const dayMs = 86_400_000;

export type ScheduleSearchParams = {
  month?: string | string[];
};

export interface ScheduleManualScheduleItem {
  id: string;
  title: string;
  scheduledDate: string;
  status: ManualScheduleStatusValue;
  customerId: string | null;
  customerName: string | null;
  memo: string | null;
  saleId: string | null;
  saleCustomerId: string | null;
  saleLabel: string | null;
  createdByName: string;
}

export interface ScheduleDialogCustomerOption {
  id: string;
  label: string;
}

export interface ScheduleOverviewPageData {
  month: {
    currentMonthInput: string;
    monthInput: string;
    monthLabel: string;
    prevMonthInput: string;
    nextMonthInput: string;
  };
  metrics: {
    retentionDueIn3Days: number;
    retentionDueIn7Days: number;
    automaticScheduleCount: number;
    manualScheduleCount: number;
  };
  calendarWeeks: ScheduleCalendarDay[][];
  monthEventCounts: Array<{
    kind: ScheduleEventKind;
    count: number;
  }>;
  highlightEvents: ScheduleEventRecord[];
  allMonthEvents: ScheduleEventRecord[];
  manualSchedules: ScheduleEventRecord[];
  manualScheduleItems: ScheduleManualScheduleItem[];
  customerOptions: ScheduleDialogCustomerOption[];
  retentionAlerts: Array<{
    customerName: string;
    carrierName: string;
    eligibleDate: string;
    daysUntil: number;
  }>;
  holidayInfo: {
    status: KoreanHolidayFetchStatus;
    label: string;
  };
}

function readSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function resolveHolidayStatus(statuses: KoreanHolidayFetchStatus[]) {
  if (statuses.includes("api")) {
    return "api" as const;
  }

  if (statuses.includes("cache")) {
    return "cache" as const;
  }

  return "error" as const;
}

function buildMonthCounts(events: ScheduleEventRecord[]) {
  const kinds: ScheduleEventKind[] = [
    "HOLIDAY",
    "RETENTION_DUE",
    "SALE_COMPLETED",
    "PAYMENT_COMPLETED",
    "MANUAL",
  ];

  return kinds.map((kind) => ({
    kind,
    count: events.filter((event) => event.kind === kind).length,
  }));
}

export async function getScheduleOverviewPageData(
  searchParams: ScheduleSearchParams,
): Promise<ScheduleOverviewPageData> {
  const requestedMonthInput = readSearchParam(searchParams.month);
  const monthState = resolveScheduleMonthState(requestedMonthInput);
  const visibleMonthInputs = listScheduleMonthsBetween(
    monthState.visibleStartInput.slice(0, 7),
    monthState.visibleEndInput.slice(0, 7),
  );
  const todayInput = formatKstDate(new Date());
  const todayStart = parseKstDateInput(todayInput, "start");

  const [
    manualSchedules,
    visibleSales,
    visiblePayments,
    activationRules,
    retentionCustomers,
    customerOptions,
    completedSales,
    holidayResults,
  ] = await Promise.all([
    prisma.manualSchedule.findMany({
      where: {
        scheduledDate: {
          gte: monthState.visibleStart,
          lte: monthState.visibleEnd,
        },
      },
      orderBy: [{ scheduledDate: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        title: true,
        scheduledDate: true,
        status: true,
        customerId: true,
        saleId: true,
        memo: true,
        customer: {
          select: {
            name: true,
          },
        },
        sale: {
          select: {
            customerId: true,
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
        createdBy: {
          select: {
            displayName: true,
          },
        },
      },
    }),
    prisma.sale.findMany({
      where: {
        status: "COMPLETED",
        saleDate: {
          gte: monthState.visibleStart,
          lte: monthState.visibleEnd,
        },
      },
      orderBy: [{ saleDate: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        saleDate: true,
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
    }),
    prisma.payment.findMany({
      where: {
        status: "COMPLETED",
        paymentDate: {
          gte: monthState.visibleStart,
          lte: monthState.visibleEnd,
        },
      },
      orderBy: [{ paymentDate: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        paymentDate: true,
        amount: true,
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
    prisma.carrierActivationRule.findMany({
      where: {
        isActive: true,
      },
      select: {
        carrierId: true,
        countUnit: true,
        countValue: true,
        monthCountMode: true,
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
    prisma.customer.findMany({
      where: {
        isHidden: false,
      },
      orderBy: [{ name: "asc" }, { phone: "asc" }],
      select: {
        id: true,
        name: true,
        phone: true,
      },
    }),
    prisma.sale.findMany({
      where: {
        status: "COMPLETED",
      },
      orderBy: [{ saleDate: "desc" }, { createdAt: "desc" }],
      select: {
        customerId: true,
        carrierId: true,
        saleDate: true,
      },
    }),
    Promise.all(visibleMonthInputs.map((monthInput) => getKoreanHolidaysForMonth(monthInput))),
  ]);

  const activationRuleMap = new Map(
    activationRules.map((rule) => [rule.carrierId, rule]),
  );
  const latestSaleMap = new Map<string, { saleDate: Date }>();

  for (const sale of completedSales) {
    const key = `${sale.customerId}:${sale.carrierId}`;

    if (!latestSaleMap.has(key)) {
      latestSaleMap.set(key, { saleDate: sale.saleDate });
    }
  }

  const retentionDueCandidates = retentionCustomers
    .map((customer) => {
      if (!customer.currentCarrierId || !customer.currentCarrier) {
        return null;
      }

      const rule = activationRuleMap.get(customer.currentCarrierId);
      const latestSale = latestSaleMap.get(`${customer.id}:${customer.currentCarrierId}`);

      if (!rule || !latestSale) {
        return null;
      }

      const eligibleDate = getActivationEligibleDate(latestSale.saleDate, rule);
      const eligibleDateInput = formatKstDate(eligibleDate);
      const daysUntil = Math.round(
        (eligibleDate.getTime() - todayStart.getTime()) / dayMs,
      );

      return {
        customerName: customer.name,
        carrierName: customer.currentCarrier.name,
        dateInput: eligibleDateInput,
        daysUntil,
      };
    })
    .filter(
      (
        candidate,
      ): candidate is {
        customerName: string;
        carrierName: string;
        dateInput: string;
        daysUntil: number;
      } => candidate !== null,
    )
    .sort((left, right) => {
      if (left.dateInput !== right.dateInput) {
        return left.dateInput.localeCompare(right.dateInput, "ko-KR");
      }

      return left.customerName.localeCompare(right.customerName, "ko-KR");
    });
  const customerOptionItems = customerOptions.map<ScheduleDialogCustomerOption>(
    (customer) => ({
      id: customer.id,
      label: [customer.name, customer.phone].filter(Boolean).join(" · "),
    }),
  );
  const manualScheduleItems = manualSchedules.map<ScheduleManualScheduleItem>(
    (schedule) => ({
      id: schedule.id,
      title: schedule.title,
      scheduledDate: formatKstDate(schedule.scheduledDate),
      status: schedule.status,
      customerId: schedule.customerId,
      customerName: schedule.customer?.name ?? null,
      memo: schedule.memo,
      saleId: schedule.saleId,
      saleCustomerId: schedule.sale?.customerId ?? null,
      saleLabel: schedule.sale
        ? `${schedule.sale.carrier.name} ${schedule.sale.deviceModel.name}`
        : null,
      createdByName: schedule.createdBy.displayName,
    }),
  );

  const holidayEvents = holidayResults.flatMap((result) =>
    result.items.map<ScheduleEventRecord>((item) => ({
      id: `holiday:${item.dateInput}:${item.name}`,
      dateInput: item.dateInput,
      kind: "HOLIDAY",
      title: item.name,
      subtitle: "대한민국 공휴일",
      customerName: null,
      priority: getScheduleEventPriority("HOLIDAY"),
      manualStatus: null,
      manualScheduleId: null,
    })),
  );
  const retentionDueEvents = retentionDueCandidates
    .filter(
      (candidate) =>
        candidate.dateInput >= monthState.visibleStartInput &&
        candidate.dateInput <= monthState.visibleEndInput,
    )
    .map<ScheduleEventRecord>((candidate) => ({
      id: `retention:${candidate.dateInput}:${candidate.customerName}:${candidate.carrierName}`,
      dateInput: candidate.dateInput,
      kind: "RETENTION_DUE",
      title: `${candidate.customerName} 유지기간 만료`,
      subtitle: `${candidate.carrierName} 재개통 가능일`,
      customerName: candidate.customerName,
      priority: getScheduleEventPriority("RETENTION_DUE"),
      manualStatus: null,
      manualScheduleId: null,
    }));
  const saleEvents = visibleSales.map<ScheduleEventRecord>((sale) => ({
    id: `sale:${sale.id}`,
    dateInput: formatKstDate(sale.saleDate),
    kind: "SALE_COMPLETED",
    title: `${sale.customer.name} 판매 등록`,
    subtitle: `${sale.carrier.name} ${sale.deviceModel.name}`,
    customerName: sale.customer.name,
    priority: getScheduleEventPriority("SALE_COMPLETED"),
    manualStatus: null,
    manualScheduleId: null,
  }));
  const paymentEvents = visiblePayments.map<ScheduleEventRecord>((payment) => ({
    id: `payment:${payment.id}`,
    dateInput: formatKstDate(payment.paymentDate),
    kind: "PAYMENT_COMPLETED",
    title: `${payment.sale.customer.name} 수납 ${formatWon(payment.amount)}`,
    subtitle: `${payment.sale.carrier.name} ${payment.sale.deviceModel.name}`,
    customerName: payment.sale.customer.name,
    priority: getScheduleEventPriority("PAYMENT_COMPLETED"),
    manualStatus: null,
    manualScheduleId: null,
  }));
  const manualEvents = manualScheduleItems.map<ScheduleEventRecord>((schedule) => ({
    id: `manual:${schedule.id}`,
    dateInput: schedule.scheduledDate,
    kind: "MANUAL",
    title: schedule.title,
    subtitle:
      schedule.memo ||
      [
        schedule.customerName,
        schedule.saleLabel,
        `등록 ${schedule.createdByName}`,
      ]
        .filter(Boolean)
        .join(" / "),
    customerName: schedule.customerName,
    priority: getScheduleEventPriority("MANUAL"),
    manualStatus: schedule.status,
    manualScheduleId: schedule.id,
  }));

  const visibleEvents = sortScheduleEvents([
    ...holidayEvents,
    ...retentionDueEvents,
    ...saleEvents,
    ...paymentEvents,
    ...manualEvents,
  ]);
  const allMonthEvents = visibleEvents.filter(
    (event) =>
      event.dateInput >= monthState.monthStartInput &&
      event.dateInput <= monthState.monthEndInput,
  );
  const manualSchedulesInMonth = allMonthEvents.filter(
    (event) => event.kind === "MANUAL",
  );
  const highlightEvents =
    allMonthEvents.filter((event) => event.dateInput >= todayInput).slice(0, 8) ||
    [];
  const calendarWeeks = buildScheduleCalendarWeeks({
    monthState,
    events: visibleEvents,
  });
  const holidayStatus = resolveHolidayStatus(holidayResults.map((result) => result.status));

  return {
    month: {
      currentMonthInput: todayInput.slice(0, 7),
      monthInput: monthState.monthInput,
      monthLabel: monthState.monthLabel,
      prevMonthInput: shiftScheduleMonth(monthState.monthInput, -1),
      nextMonthInput: shiftScheduleMonth(monthState.monthInput, 1),
    },
    metrics: {
      retentionDueIn3Days: retentionDueCandidates.filter(
        (candidate) => candidate.daysUntil >= 0 && candidate.daysUntil <= 3,
      ).length,
      retentionDueIn7Days: retentionDueCandidates.filter(
        (candidate) => candidate.daysUntil >= 0 && candidate.daysUntil <= 7,
      ).length,
      automaticScheduleCount: countScheduleEventsInRange({
        events: allMonthEvents,
        dateFrom: monthState.monthStartInput,
        dateTo: monthState.monthEndInput,
        kinds: [
          "HOLIDAY",
          "RETENTION_DUE",
          "SALE_COMPLETED",
          "PAYMENT_COMPLETED",
        ],
      }),
      manualScheduleCount: manualSchedulesInMonth.length,
    },
    calendarWeeks,
    monthEventCounts: buildMonthCounts(allMonthEvents),
    highlightEvents: highlightEvents.length > 0 ? highlightEvents : allMonthEvents.slice(0, 8),
    allMonthEvents,
    manualSchedules: manualSchedulesInMonth,
    manualScheduleItems,
    customerOptions: customerOptionItems,
    retentionAlerts: retentionDueCandidates
      .filter((candidate) => candidate.daysUntil >= 0 && candidate.daysUntil <= 7)
      .map((candidate) => ({
        customerName: candidate.customerName,
        carrierName: candidate.carrierName,
        eligibleDate: candidate.dateInput,
        daysUntil: candidate.daysUntil,
      })),
    holidayInfo: {
      status: holidayStatus,
      label: getHolidayStatusLabel(holidayStatus),
    },
  };
}
