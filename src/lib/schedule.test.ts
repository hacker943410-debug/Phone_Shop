import {
  buildScheduleCalendarWeeks,
  getScheduleEventPriority,
  listUpcomingBusinessScheduleEvents,
  listScheduleMonthsBetween,
  resolveScheduleMonthState,
} from "@/lib/schedule";

describe("schedule helpers", () => {
  it("resolves month ranges to full calendar weeks", () => {
    const monthState = resolveScheduleMonthState(
      "2026-04",
      new Date("2026-04-20T12:00:00+09:00"),
    );

    expect(monthState.monthStartInput).toBe("2026-04-01");
    expect(monthState.monthEndInput).toBe("2026-04-30");
    expect(monthState.visibleStartInput).toBe("2026-03-29");
    expect(monthState.visibleEndInput).toBe("2026-05-02");
  });

  it("orders same-day events by schedule priority inside the calendar grid", () => {
    const monthState = resolveScheduleMonthState("2026-04");
    const weeks = buildScheduleCalendarWeeks({
      monthState,
      referenceDate: new Date("2026-04-20T12:00:00+09:00"),
      events: [
        {
          id: "sale",
          dateInput: "2026-04-21",
          kind: "SALE_COMPLETED",
          title: "판매 등록",
          subtitle: null,
          customerName: "김서현",
          priority: getScheduleEventPriority("SALE_COMPLETED"),
          manualStatus: null,
          manualScheduleId: null,
        },
        {
          id: "manual",
          dateInput: "2026-04-21",
          kind: "MANUAL",
          title: "직접 등록 일정",
          subtitle: null,
          customerName: "김서현",
          priority: getScheduleEventPriority("MANUAL"),
          manualStatus: "OPEN",
          manualScheduleId: "manual",
        },
        {
          id: "holiday",
          dateInput: "2026-04-21",
          kind: "HOLIDAY",
          title: "임시 공휴일",
          subtitle: null,
          customerName: null,
          priority: getScheduleEventPriority("HOLIDAY"),
          manualStatus: null,
          manualScheduleId: null,
        },
      ],
    });

    const targetDay = weeks
      .flat()
      .find((day) => day.dateInput === "2026-04-21");

    expect(weeks).toHaveLength(5);
    expect(targetDay?.events.map((event) => event.kind)).toEqual([
      "HOLIDAY",
      "SALE_COMPLETED",
      "MANUAL",
    ]);
  });

  it("lists schedule months between visible boundaries", () => {
    expect(listScheduleMonthsBetween("2026-03", "2026-05")).toEqual([
      "2026-03",
      "2026-04",
      "2026-05",
    ]);
  });

  it("excludes holidays from upcoming items while keeping manual and retention events", () => {
    const upcoming = listUpcomingBusinessScheduleEvents({
      dateFrom: "2026-04-20",
      events: [
        {
          id: "holiday",
          dateInput: "2026-04-20",
          kind: "HOLIDAY",
          title: "임시 공휴일",
          subtitle: null,
          customerName: null,
          priority: getScheduleEventPriority("HOLIDAY"),
          manualStatus: null,
          manualScheduleId: null,
        },
        {
          id: "manual",
          dateInput: "2026-04-21",
          kind: "MANUAL",
          title: "고객 재연락",
          subtitle: null,
          customerName: "김수현",
          priority: getScheduleEventPriority("MANUAL"),
          manualStatus: "OPEN",
          manualScheduleId: "manual",
        },
        {
          id: "retention",
          dateInput: "2026-04-20",
          kind: "RETENTION_DUE",
          title: "유지기간 만료",
          subtitle: null,
          customerName: "박민수",
          priority: getScheduleEventPriority("RETENTION_DUE"),
          manualStatus: null,
          manualScheduleId: null,
        },
      ],
    });

    expect(upcoming.map((event) => event.kind)).toEqual([
      "RETENTION_DUE",
      "MANUAL",
    ]);
  });
});
