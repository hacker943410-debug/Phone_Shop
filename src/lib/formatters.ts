const currencyFormatter = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
  maximumFractionDigits: 0,
});

export function formatWon(amount: number) {
  return currencyFormatter.format(amount);
}

export function formatAllowanceValue(
  value: number | null | undefined,
  unit: "분" | "GB",
) {
  if (value === null || value === undefined || value <= 0) {
    return "미입력";
  }

  if (value >= 999999) {
    return "무제한";
  }

  return `${value.toLocaleString("ko-KR")}${unit}`;
}

export function formatRatePlanAllowanceSummary(input: {
  voiceCallMinutes: number | null | undefined;
  videoCallMinutes: number | null | undefined;
  dataAllowanceGb: number | null | undefined;
}) {
  return [
    `음성 ${formatAllowanceValue(input.voiceCallMinutes, "분")}`,
    `영상 ${formatAllowanceValue(input.videoCallMinutes, "분")}`,
    `데이터 ${formatAllowanceValue(input.dataAllowanceGb, "GB")}`,
  ].join(" · ");
}

