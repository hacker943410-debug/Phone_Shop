import { formatKstDate, parseKstDateInput } from "@/lib/date-utils";

export type ManualScheduleStatusValue = "OPEN" | "DONE" | "CANCELED";

export type ScheduleEventKind =
  | "HOLIDAY"
  | "RETENTION_DUE"
  | "SALE_COMPLETED"
  | "PAYMENT_COMPLETED"
  | "MANUAL";

export interface ScheduleEventRecord {
  id: string;
  dateInput: string;
  kind: ScheduleEventKind;
  title: string;
  subtitle: string | null;
  customerName: string | null;
  priority: number;
  manualStatus: ManualScheduleStatusValue | null;
  manualScheduleId: string | null;
}

export interface ScheduleCalendarDay {
  dateInput: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  events: ScheduleEventRecord[];
}

export interface ScheduleMonthState {
  monthInput: string;
  monthLabel: string;
  year: number;
  month: number;
  monthStart: Date;
  monthEnd: Date;
  monthStartInput: string;
  monthEndInput: string;
  visibleStart: Date;
  visibleEnd: Date;
  visibleStartInput: string;
  visibleEndInput: string;
}

function isValidMonthInput(value: string) {
  if (!/^\d{4}-\d{2}$/.test(value)) {
    return false;
  }

  const month = Number.parseInt(value.slice(5, 7), 10);
  return month >= 1 && month <= 12;
}

function addUtcDays(date: Date, offsetDays: number) {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + offsetDays);
  return nextDate;
}

function getMonthEnd(monthStart: Date) {
  const nextMonthStart = addUtcMonths(monthStart, 1);
  return addUtcDays(nextMonthStart, -1);
}

function addUtcMonths(date: Date, offsetMonths: number) {
  const [year, month] = formatKstDate(date)
    .slice(0, 7)
    .split("-")
    .map(Number);
  const totalMonth = year * 12 + (month - 1) + offsetMonths;
  const nextYear = Math.floor(totalMonth / 12);
  const nextMonth = (totalMonth % 12) + 1;

  return parseKstDateInput(
    `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`,
    "start",
  );
}

function getKstWeekday(dateInput: string) {
  return new Date(`${dateInput}T12:00:00+09:00`).getUTCDay();
}

function compareScheduleEvents(
  left: ScheduleEventRecord,
  right: ScheduleEventRecord,
) {
  if (left.dateInput !== right.dateInput) {
    return left.dateInput.localeCompare(right.dateInput, "ko-KR");
  }

  if (left.priority !== right.priority) {
    return left.priority - right.priority;
  }

  if (left.customerName && right.customerName && left.customerName !== right.customerName) {
    return left.customerName.localeCompare(right.customerName, "ko-KR");
  }

  return left.title.localeCompare(right.title, "ko-KR");
}

export function getScheduleEventPriority(kind: ScheduleEventKind) {
  switch (kind) {
    case "HOLIDAY":
      return 1;
    case "RETENTION_DUE":
      return 2;
    case "SALE_COMPLETED":
      return 3;
    case "PAYMENT_COMPLETED":
      return 4;
    case "MANUAL":
      return 5;
  }
}

export function sortScheduleEvents(events: ScheduleEventRecord[]) {
  return [...events].sort(compareScheduleEvents);
}

export function shiftScheduleMonth(monthInput: string, offsetMonths: number) {
  const monthState = resolveScheduleMonthState(monthInput);
  return formatKstDate(addUtcMonths(monthState.monthStart, offsetMonths)).slice(0, 7);
}

export function listScheduleMonthsBetween(
  startMonthInput: string,
  endMonthInput: string,
) {
  const values: string[] = [];
  let current = startMonthInput;

  while (current <= endMonthInput) {
    values.push(current);
    current = shiftScheduleMonth(current, 1);
  }

  return values;
}

export function resolveScheduleMonthState(
  rawMonthInput?: string,
  referenceDate = new Date(),
): ScheduleMonthState {
  const fallbackMonthInput = formatKstDate(referenceDate).slice(0, 7);
  const monthInput =
    rawMonthInput && isValidMonthInput(rawMonthInput)
      ? rawMonthInput
      : fallbackMonthInput;
  const monthStart = parseKstDateInput(`${monthInput}-01`, "start");
  const monthEnd = getMonthEnd(monthStart);
  const monthStartInput = formatKstDate(monthStart);
  const monthEndInput = formatKstDate(monthEnd);
  const startWeekday = getKstWeekday(monthStartInput);
  const endWeekday = getKstWeekday(monthEndInput);
  const visibleStart = addUtcDays(monthStart, -startWeekday);
  const visibleEnd = addUtcDays(monthEnd, 6 - endWeekday);

  return {
    monthInput,
    monthLabel: new Intl.DateTimeFormat("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "long",
    }).format(parseKstDateInput(`${monthInput}-01`, "start")),
    year: Number.parseInt(monthInput.slice(0, 4), 10),
    month: Number.parseInt(monthInput.slice(5, 7), 10),
    monthStart,
    monthEnd,
    monthStartInput,
    monthEndInput,
    visibleStart,
    visibleEnd,
    visibleStartInput: formatKstDate(visibleStart),
    visibleEndInput: formatKstDate(visibleEnd),
  };
}

export function buildScheduleCalendarWeeks(input: {
  monthState: ScheduleMonthState;
  events: ScheduleEventRecord[];
  referenceDate?: Date;
}) {
  const eventMap = new Map<string, ScheduleEventRecord[]>();
  const todayInput = formatKstDate(input.referenceDate ?? new Date());

  for (const event of sortScheduleEvents(input.events)) {
    const current = eventMap.get(event.dateInput) ?? [];
    current.push(event);
    eventMap.set(event.dateInput, current);
  }

  const days: ScheduleCalendarDay[] = [];
  let current = input.monthState.visibleStartInput;

  while (current <= input.monthState.visibleEndInput) {
    const events = eventMap.get(current) ?? [];
    const weekday = getKstWeekday(current);

    days.push({
      dateInput: current,
      dayNumber: Number.parseInt(current.slice(-2), 10),
      isCurrentMonth: current.startsWith(input.monthState.monthInput),
      isToday: current === todayInput,
      isWeekend: weekday === 0 || weekday === 6,
      events,
    });

    current = formatKstDate(addUtcDays(parseKstDateInput(current, "start"), 1));
  }

  const weeks: ScheduleCalendarDay[][] = [];

  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }

  return weeks;
}

export function countScheduleEventsInRange(input: {
  events: ScheduleEventRecord[];
  dateFrom: string;
  dateTo: string;
  kinds?: ScheduleEventKind[];
}) {
  const kindSet = input.kinds ? new Set(input.kinds) : null;

  return input.events.filter((event) => {
    if (event.dateInput < input.dateFrom || event.dateInput > input.dateTo) {
      return false;
    }

    if (kindSet && !kindSet.has(event.kind)) {
      return false;
    }

    return true;
  }).length;
}
