"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  type ScheduleInitialDialogState,
  type ScheduleManualScheduleItem,
  type ScheduleOverviewPageData,
} from "@/app/(workspace)/schedule/schedule-page-data";
import { EmptyState } from "@/components/workspace/admin-form-controls";
import {
  ScheduleUpsertDialog,
  type ScheduleDialogSeed,
} from "@/components/workspace/schedule-upsert-dialog";
import {
  ActionChip,
  MetricCard,
  PageIntro,
  Panel,
  TonePill,
} from "@/components/workspace/workspace-primitives";
import { secondaryButtonClassName } from "@/components/workspace/ui-classnames";
import type {
  ScheduleCalendarDay,
  ScheduleEventKind,
  ScheduleEventRecord,
} from "@/lib/schedule";

const cardSurfaceClassName =
  "rounded-[1.2rem] border border-stone-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(245,243,239,0.96)_100%)] p-4 shadow-[0_18px_38px_-34px_rgba(15,23,42,0.24)]";

const interactiveCardClassName =
  "w-full rounded-[1rem] border border-stone-200 bg-white/90 p-3 text-left transition hover:border-slate-300 hover:shadow-[0_16px_34px_-30px_rgba(15,23,42,0.3)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900";

const weekdayLabels = ["일", "월", "화", "수", "목", "금", "토"];

interface ScheduleDialogState {
  defaultDateInput: string;
  initialSchedule: ScheduleDialogSeed | null;
}

function buildMonthHref(monthInput: string) {
  return `/schedule?month=${encodeURIComponent(monthInput)}`;
}

function getEventKindLabel(kind: ScheduleEventKind) {
  switch (kind) {
    case "HOLIDAY":
      return "공휴일";
    case "RETENTION_DUE":
      return "유지 만료";
    case "SALE_COMPLETED":
      return "판매";
    case "PAYMENT_COMPLETED":
      return "수납";
    case "MANUAL":
      return "수동";
  }
}

function getEventTone(kind: ScheduleEventKind) {
  switch (kind) {
    case "HOLIDAY":
      return "rose" as const;
    case "RETENTION_DUE":
      return "amber" as const;
    case "SALE_COMPLETED":
      return "teal" as const;
    case "PAYMENT_COMPLETED":
      return "slate" as const;
    case "MANUAL":
      return "charcoal" as const;
  }
}

function getEventFrame(kind: ScheduleEventKind) {
  switch (kind) {
    case "HOLIDAY":
      return "border-rose-200 bg-rose-50/90 text-rose-900";
    case "RETENTION_DUE":
      return "border-amber-200 bg-amber-50/90 text-amber-900";
    case "SALE_COMPLETED":
      return "border-blue-200 bg-blue-50/90 text-blue-900";
    case "PAYMENT_COMPLETED":
      return "border-stone-200 bg-stone-100/90 text-stone-700";
    case "MANUAL":
      return "border-slate-300 bg-slate-900 text-white";
  }
}

function getManualStatusLabel(status: ScheduleEventRecord["manualStatus"]) {
  switch (status) {
    case "OPEN":
      return "진행 중";
    case "DONE":
      return "완료";
    case "CANCELED":
      return "취소";
    default:
      return null;
  }
}

function getManualStatusTone(status: ScheduleEventRecord["manualStatus"]) {
  switch (status) {
    case "OPEN":
      return "amber" as const;
    case "DONE":
      return "teal" as const;
    case "CANCELED":
      return "rose" as const;
    default:
      return "slate" as const;
  }
}

function getHolidayEvent(day: ScheduleCalendarDay) {
  return day.events.find((event) => event.kind === "HOLIDAY") ?? null;
}

function getVisibleCalendarEvents(day: ScheduleCalendarDay) {
  return day.events.filter((event) => event.kind !== "HOLIDAY");
}

function EventLine({
  event,
  onEditManualSchedule,
}: {
  event: ScheduleEventRecord;
  onEditManualSchedule: (scheduleId: string) => void;
}) {
  const manualStatusLabel = getManualStatusLabel(event.manualStatus);
  const frameClassName = getEventFrame(event.kind);
  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className="font-semibold">{event.title}</span>
        <span className="shrink-0 text-[0.65rem] font-semibold uppercase tracking-[0.18em] opacity-80">
          {getEventKindLabel(event.kind)}
        </span>
      </div>
      {event.subtitle ? (
        <p className="mt-1 line-clamp-2 opacity-90">{event.subtitle}</p>
      ) : null}
      {manualStatusLabel ? (
        <div className="mt-2">
          <TonePill
            label={manualStatusLabel}
            tone={getManualStatusTone(event.manualStatus)}
          />
        </div>
      ) : null}
    </>
  );

  if (event.kind === "MANUAL" && event.manualScheduleId) {
    const manualScheduleId = event.manualScheduleId;

    return (
      <button
        aria-label={`${event.title} 일정 수정`}
        className={`w-full rounded-[0.9rem] border px-2.5 py-2 text-left text-[0.74rem] leading-5 transition hover:brightness-[1.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${frameClassName}`}
        onClick={() => onEditManualSchedule(manualScheduleId)}
        type="button"
      >
        {content}
      </button>
    );
  }

  return (
    <div
      className={`rounded-[0.9rem] border px-2.5 py-2 text-left text-[0.74rem] leading-5 ${frameClassName}`}
    >
      {content}
    </div>
  );
}

function UpcomingEventCard({
  event,
  onEditManualSchedule,
}: {
  event: ScheduleEventRecord;
  onEditManualSchedule: (scheduleId: string) => void;
}) {
  const content = (
    <div className="flex items-start justify-between gap-3">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-slate-950">
          {event.dateInput} · {event.title}
        </p>
        {event.subtitle ? (
          <p className="text-sm leading-6 text-slate-600">{event.subtitle}</p>
        ) : null}
      </div>
      <div className="shrink-0">
        <TonePill
          label={getEventKindLabel(event.kind)}
          tone={getEventTone(event.kind)}
        />
      </div>
    </div>
  );

  if (event.manualScheduleId) {
    const manualScheduleId = event.manualScheduleId;

    return (
      <button
        aria-label={`${event.title} 일정 수정`}
        className={interactiveCardClassName}
        onClick={() => onEditManualSchedule(manualScheduleId)}
        type="button"
      >
        {content}
      </button>
    );
  }

  return <div className={cardSurfaceClassName}>{content}</div>;
}

function WorkQueueCard({
  description,
  items,
  title,
}: {
  description: string;
  items: React.ReactNode[];
  title: string;
}) {
  return (
    <article className="rounded-[1.2rem] border border-stone-200 bg-white/92 p-4 shadow-[0_18px_38px_-34px_rgba(15,23,42,0.24)]">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold tracking-[-0.03em] text-slate-950">
          {title}
        </h3>
        <TonePill label={`${items.length}건`} tone="charcoal" />
      </div>
      <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      <div className="mt-3 space-y-2">
        {items.length > 0 ? (
          items
        ) : (
          <EmptyState message="현재 확인할 항목이 없습니다." />
        )}
      </div>
    </article>
  );
}

export function ScheduleOverview({
  initialDialogState = null,
  pageData,
}: {
  initialDialogState?: ScheduleInitialDialogState | null;
  pageData: ScheduleOverviewPageData;
}) {
  const router = useRouter();
  const [dialogState, setDialogState] = useState<ScheduleDialogState | null>(
    initialDialogState,
  );
  const todayEvents = useMemo(
    () =>
      pageData.highlightEvents.filter((event) => event.dateInput === pageData.todayInput),
    [pageData.highlightEvents, pageData.todayInput],
  );
  const pendingManualSchedules = useMemo(
    () =>
      [...pageData.manualScheduleItems]
        .filter(
          (item) =>
            item.status === "OPEN" && item.scheduledDate <= pageData.todayInput,
        )
        .sort((left, right) => left.scheduledDate.localeCompare(right.scheduledDate, "ko-KR"))
        .slice(0, 8),
    [pageData.manualScheduleItems, pageData.todayInput],
  );
  const retentionQueue = useMemo(
    () =>
      pageData.retentionAlerts
        .filter((item) => item.daysUntil >= 0)
        .slice(0, 8),
    [pageData.retentionAlerts],
  );

  const openCreateDialog = (dateInput: string) => {
    setDialogState({
      defaultDateInput: dateInput,
      initialSchedule: null,
    });
  };

  const openEditDialog = (scheduleId: string) => {
    const target = pageData.manualScheduleItems.find((item) => item.id === scheduleId);

    if (!target) {
      return;
    }

    setDialogState({
      defaultDateInput: target.scheduledDate,
      initialSchedule: target,
    });
  };

  const closeDialog = () => {
    setDialogState(null);
  };

  useEffect(() => {
    if (!initialDialogState) {
      return;
    }

    router.replace(buildMonthHref(pageData.month.monthInput), { scroll: false });
  }, [initialDialogState, pageData.month.monthInput, router]);

  return (
    <>
      <div className="flex flex-col gap-3 p-3 sm:p-4 2xl:p-5">
        <PageIntro
          title="일정 관리"
          className="shrink-0"
          actions={
            <>
              <ActionChip label={pageData.month.monthLabel} tone="dark" />
              <ActionChip label={pageData.holidayInfo.label} />
              <ActionChip label="수동 일정 생성·수정·삭제 가능" />
            </>
          }
        />

        <section className="grid shrink-0 gap-3 sm:grid-cols-2 2xl:grid-cols-4">
          <MetricCard
            accent="amber"
            helper="오늘부터 3일 이내 재연락 가능 고객 수"
            label="3일 내 유지 만료"
            value={`${pageData.metrics.retentionDueIn3Days}건`}
          />
          <MetricCard
            accent="teal"
            helper="오늘부터 7일 이내 재연락 가능 고객 수"
            label="7일 내 유지 만료"
            value={`${pageData.metrics.retentionDueIn7Days}건`}
          />
          <MetricCard
            accent="slate"
            helper="공휴일, 유지 만료, 판매, 수납 자동 이벤트 합계"
            label="월간 자동 일정"
            value={`${pageData.metrics.automaticScheduleCount}건`}
          />
          <MetricCard
            accent="amber"
            helper="현재 조회 월에 등록된 수동 일정 수"
            label="수동 일정"
            value={`${pageData.metrics.manualScheduleCount}건`}
          />
        </section>

        <section className="grid gap-3 xl:grid-cols-3">
          <WorkQueueCard
            title="오늘 예정"
            description="오늘 바로 처리해야 하는 일정만 먼저 모았습니다."
            items={todayEvents.map((event) => (
              <UpcomingEventCard
                key={event.id}
                event={event}
                onEditManualSchedule={openEditDialog}
              />
            ))}
          />
          <WorkQueueCard
            title="미처리 수동 일정"
            description="오늘 이전 일정 중 아직 열려 있는 수동 일정입니다."
            items={pendingManualSchedules.map((item) => (
              <button
                key={item.id}
                className={interactiveCardClassName}
                onClick={() => openEditDialog(item.id)}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-950">
                      {item.scheduledDate} · {item.title}
                    </p>
                    <p className="text-sm leading-6 text-slate-600">
                      {[item.customerName, item.saleLabel, item.memo]
                        .filter(Boolean)
                        .join(" / ") || "상세 메모 없음"}
                    </p>
                  </div>
                  <TonePill label="미처리" tone="amber" />
                </div>
              </button>
            ))}
          />
          <WorkQueueCard
            title="유지 만료 임박"
            description="7일 이내 재연락 가능한 고객을 빠르게 확인합니다."
            items={retentionQueue.map((item) => (
              <div key={`${item.customerName}:${item.eligibleDate}`} className={cardSurfaceClassName}>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-950">
                      {item.customerName}
                    </p>
                    <p className="text-sm leading-6 text-slate-600">
                      {item.carrierName} / 가능일 {item.eligibleDate}
                    </p>
                  </div>
                  <TonePill
                    label={item.daysUntil === 0 ? "D-day" : `D-${item.daysUntil}`}
                    tone={item.daysUntil <= 3 ? "rose" : "amber"}
                  />
                </div>
              </div>
            ))}
          />
        </section>

        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <Panel
            title="월간 캘린더"
            description="판매, 수납, 유지 만료, 수동 일정을 한 화면에서 확인합니다."
            actions={
              <div className="flex flex-wrap gap-2">
                <a
                  href={buildMonthHref(pageData.month.prevMonthInput)}
                  className={`${secondaryButtonClassName} h-9 px-3`}
                >
                  이전 달
                </a>
                <a
                  href={buildMonthHref(pageData.month.currentMonthInput)}
                  className={`${secondaryButtonClassName} h-9 px-3`}
                >
                  이번 달
                </a>
                <a
                  href={buildMonthHref(pageData.month.nextMonthInput)}
                  className={`${secondaryButtonClassName} h-9 px-3`}
                >
                  다음 달
                </a>
              </div>
            }
            contentClassName="space-y-3"
          >
            <div className={cardSurfaceClassName}>
              <div className="flex flex-wrap items-center gap-2">
                {pageData.monthEventCounts.map((item) => (
                  <TonePill
                    key={item.kind}
                    label={`${getEventKindLabel(item.kind)} ${item.count}건`}
                    tone={getEventTone(item.kind)}
                  />
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[760px] rounded-[1.35rem] border border-stone-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(246,243,238,0.98)_100%)] shadow-[0_18px_42px_-38px_rgba(15,23,42,0.34)]">
                <div className="grid grid-cols-7 border-b border-stone-200">
                  {weekdayLabels.map((label) => (
                    <div
                      key={label}
                      className="px-3 py-2.5 text-center text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-slate-500"
                    >
                      {label}
                    </div>
                  ))}
                </div>

                {pageData.calendarWeeks.map((week, weekIndex) => (
                  <div
                    key={`${pageData.month.monthInput}-week-${weekIndex}`}
                    className="grid grid-cols-7"
                  >
                    {week.map((day) => {
                      const holidayEvent = getHolidayEvent(day);
                      const visibleEvents = getVisibleCalendarEvents(day);
                      const dateButtonClassName = [
                        "inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-sm font-semibold tracking-[-0.04em] transition hover:bg-slate-200/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900",
                        day.isToday && holidayEvent
                          ? "bg-rose-700 text-white hover:bg-rose-600"
                          : day.isToday
                            ? "bg-slate-950 text-white hover:bg-slate-800"
                            : holidayEvent
                              ? "text-rose-700"
                              : day.isCurrentMonth
                                ? "text-slate-950"
                                : "text-slate-400",
                      ].join(" ");
                      const dayClassName = [
                        "min-h-[10.2rem] border-b border-r border-stone-200 px-2.5 py-2.5",
                        holidayEvent && "bg-rose-50/80",
                        !holidayEvent &&
                          !day.isCurrentMonth &&
                          "bg-stone-100/70 text-slate-400",
                        !holidayEvent &&
                          day.isWeekend &&
                          day.isCurrentMonth &&
                          "bg-stone-50/65",
                      ]
                        .filter(Boolean)
                        .join(" ");

                      return (
                        <article key={day.dateInput} className={dayClassName}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex min-w-0 items-start gap-2">
                              <button
                                aria-label={`${day.dateInput} 일정 추가`}
                                className={dateButtonClassName}
                                onClick={() => openCreateDialog(day.dateInput)}
                                type="button"
                              >
                                {day.dayNumber}
                              </button>
                              {holidayEvent ? (
                                <p className="pt-1 text-xs font-semibold text-rose-700">
                                  {holidayEvent.title}
                                </p>
                              ) : null}
                            </div>
                            {visibleEvents.length > 0 ? (
                              <span className="text-[0.68rem] font-medium text-slate-500">
                                {visibleEvents.length}건
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-2.5 space-y-1.5">
                            {visibleEvents.slice(0, 3).map((event) => (
                              <EventLine
                                key={event.id}
                                event={event}
                                onEditManualSchedule={openEditDialog}
                              />
                            ))}
                            {visibleEvents.length > 3 ? (
                              <div className="rounded-[0.85rem] border border-dashed border-stone-300 px-2.5 py-2 text-[0.72rem] font-medium text-slate-500">
                                +{visibleEvents.length - 3}건 더 있음
                              </div>
                            ) : null}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          <aside className="space-y-3">
            <section className="rounded-[1.55rem] border border-stone-200 bg-white/92 p-4 shadow-[0_20px_42px_-38px_rgba(15,23,42,0.3)] backdrop-blur-sm">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-[1rem] font-semibold tracking-[-0.035em] text-slate-950">
                  다가오는 일정
                </h2>
                <TonePill
                  label={`${pageData.highlightEvents.length}건`}
                  tone="charcoal"
                />
              </div>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                공휴일을 제외한 업무 일정만 표시합니다.
              </p>

              <div className="mt-3 space-y-2">
                {pageData.highlightEvents.length === 0 ? (
                  <EmptyState message="현재 조회 월에 표시할 업무 일정이 없습니다." />
                ) : (
                  <ul className="space-y-2">
                    {pageData.highlightEvents.map((event) => (
                      <li key={event.id}>
                        <UpcomingEventCard
                          event={event}
                          onEditManualSchedule={openEditDialog}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>

      {dialogState ? (
        <ScheduleUpsertDialog
          customerOptions={pageData.customerOptions}
          defaultDateInput={dialogState.defaultDateInput}
          initialSchedule={dialogState.initialSchedule}
          onClose={closeDialog}
        />
      ) : null}
    </>
  );
}
