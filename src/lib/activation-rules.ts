import { formatKstDate, parseKstDateInput } from "@/lib/date-utils";

export type ActivationCountUnitValue = "DAY" | "MONTH";
export type ActivationMonthCountModeValue =
  | "INCLUDE_CURRENT_MONTH"
  | "EXCLUDE_CURRENT_MONTH";

export interface ActivationRuleConfig {
  countUnit: ActivationCountUnitValue;
  countValue: number;
  monthCountMode: ActivationMonthCountModeValue | null;
}

function normalizeKstStart(date: Date) {
  return parseKstDateInput(formatKstDate(date), "start");
}

function addUtcDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
}

function resolveMonthOffset(year: number, month: number, offset: number) {
  const totalMonth = year * 12 + (month - 1) + offset;

  return {
    year: Math.floor(totalMonth / 12),
    month: (totalMonth % 12) + 1,
  };
}

export function getActivationEligibleDate(
  saleDate: Date,
  rule: ActivationRuleConfig,
) {
  const normalizedSaleDate = normalizeKstStart(saleDate);

  if (rule.countUnit === "DAY") {
    return addUtcDays(normalizedSaleDate, rule.countValue);
  }

  const monthOffset =
    rule.monthCountMode === "EXCLUDE_CURRENT_MONTH"
      ? rule.countValue + 1
      : rule.countValue;
  const [saleYear, saleMonth] = formatKstDate(saleDate)
    .slice(0, 7)
    .split("-")
    .map(Number);
  const nextMonth = resolveMonthOffset(saleYear, saleMonth, monthOffset);

  return parseKstDateInput(
    `${nextMonth.year}-${String(nextMonth.month).padStart(2, "0")}-01`,
    "start",
  );
}

export function isActivationEligible(
  referenceDate: Date,
  saleDate: Date,
  rule: ActivationRuleConfig,
) {
  return normalizeKstStart(referenceDate) >= getActivationEligibleDate(saleDate, rule);
}

export function formatActivationRuleLabel(rule: ActivationRuleConfig) {
  if (rule.countUnit === "DAY") {
    return `${rule.countValue}일 기준`;
  }

  return `${rule.countValue}개월 / ${
    rule.monthCountMode === "EXCLUDE_CURRENT_MONTH"
      ? "당월 미포함"
      : "당월 포함"
  }`;
}
