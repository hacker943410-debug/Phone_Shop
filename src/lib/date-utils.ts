const kstDateFormatter = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function formatKstDate(date: Date) {
  return kstDateFormatter.format(date);
}

export function formatKstDateRange(startDate: Date, endDate: Date) {
  return `${formatKstDate(startDate)} ~ ${formatKstDate(endDate)}`;
}

export function parseKstDateInput(value: string, mode: "start" | "end") {
  const time = mode === "start" ? "00:00:00" : "23:59:59";
  return new Date(`${value}T${time}+09:00`);
}
