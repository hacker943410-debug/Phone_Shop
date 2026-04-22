"use client";

import { useState } from "react";

import { joinClassNames } from "@/components/workspace/ui-classnames";
import {
  type DashboardCarrierTrendSeries,
  type DashboardDailySummary,
  type DashboardReceivableHealthBucket,
  type DashboardStaffSummary,
  type DashboardStoreSummary,
} from "@/lib/dashboard-reporting-types";
import { formatWon } from "@/lib/formatters";

const chartFrameClassName =
  "dashboard-reveal flex h-full min-h-0 flex-col overflow-hidden rounded-[1rem] border border-white/80 bg-white/80 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-sm";

const chartPalette = {
  slate: {
    line: "#111827",
    fill: "rgba(17,24,39,0.08)",
    badge: "bg-slate-900 text-white",
    soft: "bg-slate-100 text-slate-700",
  },
  blue: {
    line: "#2563eb",
    fill: "rgba(37,99,235,0.12)",
    badge: "bg-blue-600 text-white",
    soft: "bg-blue-50 text-blue-800",
  },
  amber: {
    line: "#d97706",
    fill: "rgba(217,119,6,0.12)",
    badge: "bg-amber-500 text-white",
    soft: "bg-amber-50 text-amber-800",
  },
  teal: {
    line: "#0f766e",
    fill: "rgba(15,118,110,0.12)",
    badge: "bg-teal-600 text-white",
    soft: "bg-teal-50 text-teal-800",
  },
} as const;

const carrierChartStyles = [
  {
    stroke: "#111827",
    fill: "rgba(17,24,39,0.12)",
    barClassName: "bg-[linear-gradient(90deg,#111827_0%,#334155_100%)]",
    badgeClassName: "bg-slate-900 text-white",
    softClassName: "bg-slate-100 text-slate-700",
  },
  {
    stroke: "#2563eb",
    fill: "rgba(37,99,235,0.12)",
    barClassName: "bg-[linear-gradient(90deg,#1d4ed8_0%,#38bdf8_100%)]",
    badgeClassName: "bg-blue-600 text-white",
    softClassName: "bg-blue-50 text-blue-800",
  },
  {
    stroke: "#d97706",
    fill: "rgba(217,119,6,0.14)",
    barClassName: "bg-[linear-gradient(90deg,#d97706_0%,#f59e0b_100%)]",
    badgeClassName: "bg-amber-500 text-white",
    softClassName: "bg-amber-50 text-amber-800",
  },
  {
    stroke: "#be123c",
    fill: "rgba(190,24,93,0.14)",
    barClassName: "bg-[linear-gradient(90deg,#be123c_0%,#f43f5e_100%)]",
    badgeClassName: "bg-rose-600 text-white",
    softClassName: "bg-rose-50 text-rose-800",
  },
  {
    stroke: "#7c3aed",
    fill: "rgba(124,58,237,0.14)",
    barClassName: "bg-[linear-gradient(90deg,#7c3aed_0%,#a855f7_100%)]",
    badgeClassName: "bg-violet-600 text-white",
    softClassName: "bg-violet-50 text-violet-800",
  },
] as const;

function getCarrierChartStyle(index: number) {
  return carrierChartStyles[index % carrierChartStyles.length];
}

interface LineSeriesConfig {
  id: string;
  label: string;
  color: keyof typeof chartPalette;
  values: number[];
  formatValue: (value: number) => string;
}

function formatDateTick(date: string) {
  return date.slice(5).replace("-", ".");
}

function formatShare(value: number, total: number) {
  if (total <= 0) {
    return "0%";
  }

  return `${Math.round((value / total) * 100)}%`;
}

function formatCompactWonTick(value: number) {
  return `₩${new Intl.NumberFormat("ko-KR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)}`;
}

function formatCountTick(value: number) {
  return `${Math.max(0, Math.round(value))}건`;
}

function getChartPoints(values: number[], width: number, height: number) {
  const paddingX = 26;
  const paddingY = 18;
  const usableWidth = Math.max(width - paddingX * 2, 1);
  const usableHeight = Math.max(height - paddingY * 2, 1);
  const maxValue = Math.max(...values, 1);
  const step = values.length > 1 ? usableWidth / (values.length - 1) : 0;

  return values.map((value, index) => ({
    x: paddingX + step * index,
    y: height - paddingY - (value / maxValue) * usableHeight,
    value,
  }));
}

function buildLinePath(points: Array<{ x: number; y: number }>) {
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
}

function buildAreaPath(points: Array<{ x: number; y: number }>, height: number) {
  if (points.length === 0) {
    return "";
  }

  const floor = height - 18;
  const start = points[0];
  const end = points[points.length - 1];

  return `${buildLinePath(points)} L ${end.x} ${floor} L ${start.x} ${floor} Z`;
}

function getReceivableToneStyles(tone: DashboardReceivableHealthBucket["tone"]) {
  switch (tone) {
    case "teal":
      return {
        stroke: "#14b8a6",
        fillClassName: "bg-teal-50 text-teal-800",
        chipClassName: "bg-teal-100 text-teal-900",
        barClassName: "bg-[linear-gradient(90deg,#0f766e_0%,#14b8a6_100%)]",
      };
    case "amber":
      return {
        stroke: "#f59e0b",
        fillClassName: "bg-amber-50 text-amber-800",
        chipClassName: "bg-amber-100 text-amber-900",
        barClassName: "bg-[linear-gradient(90deg,#d97706_0%,#f59e0b_100%)]",
      };
    case "rose":
      return {
        stroke: "#f43f5e",
        fillClassName: "bg-rose-50 text-rose-800",
        chipClassName: "bg-rose-100 text-rose-900",
        barClassName: "bg-[linear-gradient(90deg,#e11d48_0%,#fb7185_100%)]",
      };
    case "slate":
    default:
      return {
        stroke: "#64748b",
        fillClassName: "bg-slate-100 text-slate-700",
        chipClassName: "bg-slate-200 text-slate-800",
        barClassName: "bg-[linear-gradient(90deg,#334155_0%,#64748b_100%)]",
      };
  }
}

function ComparisonBar({
  label,
  value,
  maxValue,
  barClassName,
  delay,
}: {
  label: string;
  value: number;
  maxValue: number;
  barClassName: string;
  delay: number;
}) {
  const width = value > 0 ? Math.max((value / maxValue) * 100, 8) : 0;

  return (
    <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-2">
      <span className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </span>
      <div className="rounded-full bg-stone-100 p-1">
        <div
          className={joinClassNames(
            "dashboard-bar-grow h-2.5 rounded-full shadow-[0_10px_18px_-14px_rgba(15,23,42,0.45)]",
            barClassName,
          )}
          style={{
            width: width > 0 ? `${width}%` : "0%",
            animationDelay: `${delay}ms`,
          }}
        />
      </div>
      <span className="text-[0.7rem] font-semibold text-slate-500">{formatWon(value)}</span>
    </div>
  );
}

function CountComparisonBar({
  label,
  value,
  maxValue,
  barClassName,
  delay,
}: {
  label: string;
  value: number;
  maxValue: number;
  barClassName: string;
  delay: number;
}) {
  const width = value > 0 ? Math.max((value / maxValue) * 100, 8) : 0;

  return (
    <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-2">
      <span className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </span>
      <div className="rounded-full bg-stone-100 p-1">
        <div
          className={joinClassNames(
            "dashboard-bar-grow h-2.5 rounded-full shadow-[0_10px_18px_-14px_rgba(15,23,42,0.45)]",
            barClassName,
          )}
          style={{
            width: width > 0 ? `${width}%` : "0%",
            animationDelay: `${delay}ms`,
          }}
        />
      </div>
      <span className="text-[0.7rem] font-semibold text-slate-500">
        {Math.max(0, Math.round(value))}건
      </span>
    </div>
  );
}

function InteractiveLineChart({
  dates,
  series,
}: {
  dates: string[];
  series: LineSeriesConfig[];
}) {
  const [activeSeriesId, setActiveSeriesId] = useState<string | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState(Math.max(dates.length - 1, 0));
  const width = 560;
  const height = 192;
  const visibleSeries = activeSeriesId
    ? series.filter((item) => item.id === activeSeriesId)
    : series;
  const maxValue = Math.max(
    ...visibleSeries.flatMap((item) => item.values),
    1,
  );

  if (dates.length === 0 || series.length === 0) {
    return null;
  }

  return (
    <div className={chartFrameClassName}>
      <div className="mb-3 flex flex-wrap gap-2">
        {series.map((item) => {
          const palette = chartPalette[item.color];
          const active = activeSeriesId === null || activeSeriesId === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() =>
                setActiveSeriesId((current) => (current === item.id ? null : item.id))
              }
              className={joinClassNames(
                "inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-[0.74rem] font-semibold transition duration-150 hover:-translate-y-px",
                active
                  ? `${palette.badge} border-transparent shadow-[0_16px_28px_-24px_rgba(15,23,42,0.3)]`
                  : "border-stone-200 bg-white text-slate-500 hover:border-blue-200 hover:text-slate-900",
              )}
            >
              <span className="h-2.5 w-2.5 rounded-full bg-current" />
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="mb-3 rounded-[0.9rem] border border-stone-200 bg-stone-50/80 px-3 py-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[0.76rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
            {dates[hoveredIndex]}
          </p>
          <div className="flex flex-wrap gap-2">
            {visibleSeries.map((item) => {
              const palette = chartPalette[item.color];

              return (
                <span
                  key={item.id}
                  className={joinClassNames(
                    "rounded-full px-2.5 py-1 text-[0.72rem] font-semibold",
                    palette.soft,
                  )}
                >
                  {item.label} {item.formatValue(item.values[hoveredIndex] ?? 0)}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <div className="relative min-h-[10.5rem] flex-1">
        <svg
          aria-hidden="true"
          className="h-full w-full overflow-visible"
          viewBox={`0 0 ${width} ${height}`}
        >
          {[0.25, 0.5, 0.75].map((ratio) => {
            const y = height - 18 - (height - 36) * ratio;

            return (
              <line
                key={ratio}
                x1="26"
                x2={width - 26}
                y1={y}
                y2={y}
                stroke="rgba(148,163,184,0.18)"
                strokeDasharray="4 8"
              />
            );
          })}

          {dates.length > 1 ? (
            <line
              x1={getChartPoints(new Array(dates.length).fill(maxValue), width, height)[
                hoveredIndex
              ]?.x}
              x2={getChartPoints(new Array(dates.length).fill(maxValue), width, height)[
                hoveredIndex
              ]?.x}
              y1="18"
              y2={height - 18}
              stroke="rgba(37,99,235,0.18)"
              strokeDasharray="4 6"
            />
          ) : null}

          {visibleSeries.map((item) => {
            const palette = chartPalette[item.color];
            const points = getChartPoints(item.values, width, height).map((point) => ({
              ...point,
              y: height - 18 - (point.value / maxValue) * (height - 36),
            }));

            return (
              <g key={item.id}>
                <path d={buildAreaPath(points, height)} fill={palette.fill} />
                <path
                  d={buildLinePath(points)}
                  fill="none"
                  stroke={palette.line}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                />
                {points.map((point, index) => (
                  <circle
                    key={`${item.id}-${dates[index]}`}
                    cx={point.x}
                    cy={point.y}
                    fill={palette.line}
                    r={index === hoveredIndex ? "5.4" : "4"}
                    className="transition duration-150"
                  />
                ))}
              </g>
            );
          })}

          {dates.map((date, index) => {
            const points = getChartPoints(new Array(dates.length).fill(maxValue), width, height);
            const center = points[index];
            const previous = points[index - 1];
            const next = points[index + 1];
            const left = previous ? (previous.x + center.x) / 2 : 0;
            const right = next ? (next.x + center.x) / 2 : width;

            return (
              <rect
                key={date}
                x={left}
                y="0"
                width={right - left}
                height={height}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(index)}
              />
            );
          })}
        </svg>
      </div>

      <div className="mt-3 grid grid-cols-5 gap-2 text-[0.72rem] font-semibold text-slate-500 sm:grid-cols-10">
        {dates.map((date, index) => (
          <button
            key={date}
            type="button"
            onMouseEnter={() => setHoveredIndex(index)}
            onFocus={() => setHoveredIndex(index)}
            className={joinClassNames(
              "cursor-pointer rounded-full px-2.5 py-1 transition duration-150",
              index === hoveredIndex
                ? "bg-slate-900 text-white shadow-[0_14px_24px_-22px_rgba(15,23,42,0.5)]"
                : "bg-stone-100 hover:bg-stone-200",
            )}
          >
            {formatDateTick(date)}
          </button>
        ))}
      </div>
    </div>
  );
}

export function StaffSummaryBarChart({ rows }: { rows: DashboardStaffSummary[] }) {
  if (rows.length === 0) {
    return null;
  }

  const visibleRows = rows.slice(0, 5);
  const [activeStaffId, setActiveStaffId] = useState<string>(visibleRows[0]?.staffId ?? "");
  const activeRow =
    visibleRows.find((row) => row.staffId === activeStaffId) ?? visibleRows[0];
  const maxAmount = Math.max(
    ...visibleRows.flatMap((row) => [
      row.salesAmount,
      row.collectedAmount,
      row.profitAmount,
    ]),
    1,
  );
  const totalProfitAmount = visibleRows.reduce((total, row) => total + row.profitAmount, 0);
  const axisLabels = [0.25, 0.5, 0.75, 1].map((ratio) =>
    formatCompactWonTick(Math.round(maxAmount * ratio)),
  );

  return (
    <div className={joinClassNames(chartFrameClassName, "gap-3")}>
      <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[minmax(0,1fr)_14.5rem]">
        <div className="rounded-[0.95rem] border border-stone-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(245,243,240,0.96)_100%)] p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[0.68rem] font-semibold text-white">
                판매
              </span>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[0.68rem] font-semibold text-blue-800">
                수금
              </span>
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[0.68rem] font-semibold text-amber-800">
                이익
              </span>
            </div>
            <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[0.68rem] font-semibold text-slate-600">
              상위 {visibleRows.length}명
            </span>
          </div>

          <div className="mt-3 space-y-2.5">
            {visibleRows.map((row, index) => {
              const active = row.staffId === activeRow.staffId;

              return (
                <button
                  key={row.staffId}
                  type="button"
                  onMouseEnter={() => setActiveStaffId(row.staffId)}
                  onFocus={() => setActiveStaffId(row.staffId)}
                  onClick={() => setActiveStaffId(row.staffId)}
                  className={joinClassNames(
                    "w-full rounded-[0.95rem] border px-3 py-2.5 text-left transition duration-200",
                    active
                      ? "border-blue-300 bg-white shadow-[0_20px_34px_-30px_rgba(37,99,235,0.3)]"
                      : "border-stone-200 bg-stone-50/80 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white",
                  )}
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{row.staffName}</p>
                      <p className="mt-0.5 text-[0.72rem] text-slate-500">
                        판매 {row.salesCount}건 · 추가 수납 {formatWon(row.additionalPaymentAmount)}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[0.68rem] font-semibold text-slate-700">
                      이익 {formatShare(row.profitAmount, totalProfitAmount)}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <ComparisonBar
                      label="판매"
                      value={row.salesAmount}
                      maxValue={maxAmount}
                      barClassName="bg-[linear-gradient(90deg,#111827_0%,#2563eb_100%)]"
                      delay={80 + index * 50}
                    />
                    <ComparisonBar
                      label="수금"
                      value={row.collectedAmount}
                      maxValue={maxAmount}
                      barClassName="bg-[linear-gradient(90deg,#2563eb_0%,#38bdf8_100%)]"
                      delay={120 + index * 50}
                    />
                    <ComparisonBar
                      label="이익"
                      value={row.profitAmount}
                      maxValue={maxAmount}
                      barClassName="bg-[linear-gradient(90deg,#f59e0b_0%,#f97316_100%)]"
                      delay={160 + index * 50}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-3 grid grid-cols-4 gap-2 pl-[4.25rem] text-[0.66rem] font-semibold text-slate-400">
            {axisLabels.map((label, index) => (
              <span key={`${label}-${index}`} className="text-right">
                {label}
              </span>
            ))}
          </div>
        </div>

        <aside className="rounded-[0.95rem] border border-stone-200 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.12),transparent_58%),linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(241,245,249,0.96)_100%)] p-4">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
            선택 직원
          </p>
          <h3 className="mt-2 text-[1.2rem] font-semibold tracking-[-0.05em] text-slate-950">
            {activeRow.staffName}
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            현재 필터 기준으로 직원의 판매, 수금, 이익 흐름을 빠르게 비교합니다.
          </p>

          <div className="mt-4 grid gap-2">
            <div className="rounded-[0.9rem] bg-white/90 px-3 py-2">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
                판매 실적
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-950">
                {formatWon(activeRow.salesAmount)}
              </p>
            </div>
            <div className="rounded-[0.9rem] bg-blue-50/90 px-3 py-2">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-blue-700">
                수금 실적
              </p>
              <p className="mt-1 text-lg font-semibold text-blue-950">
                {formatWon(activeRow.collectedAmount)}
              </p>
            </div>
            <div className="rounded-[0.9rem] bg-amber-50/90 px-3 py-2">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-amber-700">
                이익 기여
              </p>
              <p className="mt-1 text-lg font-semibold text-amber-950">
                {formatWon(activeRow.profitAmount)}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-[0.95rem] border border-stone-200 bg-white/90 px-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[0.72rem] font-semibold text-slate-500">
                추가 수납
              </span>
              <span className="text-sm font-semibold text-slate-900">
                {formatWon(activeRow.additionalPaymentAmount)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-[0.72rem] font-semibold text-slate-500">
                판매 건수
              </span>
              <span className="text-sm font-semibold text-slate-900">
                {activeRow.salesCount}건
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export function StaffActivityChart({ rows }: { rows: DashboardStaffSummary[] }) {
  if (rows.length === 0) {
    return null;
  }

  const visibleRows = rows.slice(0, 5);
  const [activeStaffId, setActiveStaffId] = useState<string>(visibleRows[0]?.staffId ?? "");
  const activeRow =
    visibleRows.find((row) => row.staffId === activeStaffId) ?? visibleRows[0];
  const maxCount = Math.max(
    ...visibleRows.flatMap((row) => [row.salesCount, row.paymentCount]),
    1,
  );
  const totalActivityCount = visibleRows.reduce(
    (total, row) => total + row.salesCount + row.paymentCount,
    0,
  );

  return (
    <div className={joinClassNames(chartFrameClassName, "gap-3")}>
      <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[minmax(0,1fr)_13.5rem]">
        <div className="rounded-[0.95rem] border border-stone-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(245,243,240,0.96)_100%)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[0.68rem] font-semibold text-white">
                판매
              </span>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[0.68rem] font-semibold text-blue-800">
                추가 수납
              </span>
            </div>
            <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[0.68rem] font-semibold text-slate-600">
              상위 {visibleRows.length}명
            </span>
          </div>

          <div className="mt-3 space-y-2.5">
            {visibleRows.map((row, index) => {
              const active = row.staffId === activeRow.staffId;
              const activityCount = row.salesCount + row.paymentCount;

              return (
                <button
                  key={row.staffId}
                  type="button"
                  onMouseEnter={() => setActiveStaffId(row.staffId)}
                  onFocus={() => setActiveStaffId(row.staffId)}
                  onClick={() => setActiveStaffId(row.staffId)}
                  className={joinClassNames(
                    "w-full rounded-[0.95rem] border px-3 py-2.5 text-left transition duration-200",
                    active
                      ? "border-blue-300 bg-white shadow-[0_18px_30px_-28px_rgba(37,99,235,0.28)]"
                      : "border-stone-200 bg-stone-50/80 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white",
                  )}
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{row.staffName}</p>
                      <p className="mt-0.5 text-[0.72rem] text-slate-500">
                        처리 합계 {activityCount}건
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[0.68rem] font-semibold text-slate-700">
                      {totalActivityCount > 0
                        ? `${Math.round((activityCount / totalActivityCount) * 100)}%`
                        : "0%"}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <CountComparisonBar
                      label="판매"
                      value={row.salesCount}
                      maxValue={maxCount}
                      barClassName="bg-[linear-gradient(90deg,#111827_0%,#2563eb_100%)]"
                      delay={80 + index * 50}
                    />
                    <CountComparisonBar
                      label="수납"
                      value={row.paymentCount}
                      maxValue={maxCount}
                      barClassName="bg-[linear-gradient(90deg,#2563eb_0%,#38bdf8_100%)]"
                      delay={120 + index * 50}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <aside className="rounded-[0.95rem] border border-stone-200 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.12),transparent_58%),linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(241,245,249,0.96)_100%)] p-4">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
            직원 활동
          </p>
          <h3 className="mt-2 text-[1.2rem] font-semibold tracking-[-0.05em] text-slate-950">
            {activeRow.staffName}
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            기간 내 판매 처리와 추가 수납 처리 건수를 함께 비교합니다.
          </p>

          <div className="mt-4 grid gap-2">
            <div className="rounded-[0.9rem] bg-white/90 px-3 py-2">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
                판매 건수
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-950">
                {activeRow.salesCount}건
              </p>
            </div>
            <div className="rounded-[0.9rem] bg-blue-50/90 px-3 py-2">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-blue-700">
                추가 수납 건수
              </p>
              <p className="mt-1 text-lg font-semibold text-blue-950">
                {activeRow.paymentCount}건
              </p>
            </div>
            <div className="rounded-[0.9rem] bg-amber-50/90 px-3 py-2">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-amber-700">
                수납 금액
              </p>
              <p className="mt-1 text-lg font-semibold text-amber-950">
                {formatWon(activeRow.additionalPaymentAmount)}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export function CarrierSalesCountChart({
  series,
}: {
  series: DashboardCarrierTrendSeries[];
}) {
  if (series.length === 0) {
    return null;
  }

  const visibleSeries = series.slice(0, 5);
  const [activeCarrierName, setActiveCarrierName] = useState<string>(
    visibleSeries[0]?.carrierName ?? "",
  );
  const activeSeries =
    visibleSeries.find((item) => item.carrierName === activeCarrierName) ??
    visibleSeries[0];
  const maxCount = Math.max(...visibleSeries.map((item) => item.totalCount), 1);
  const axisLabels = [0.25, 0.5, 0.75, 1].map((ratio) =>
    formatCountTick(Math.round(maxCount * ratio)),
  );
  const totalCount = visibleSeries.reduce((total, item) => total + item.totalCount, 0);
  const activePoints = activeSeries?.points ?? [];
  const peakPoint = activePoints.reduce<{ date: string; count: number } | null>(
    (highest, point) => {
      if (!highest || point.count > highest.count) {
        return point;
      }

      return highest;
    },
    null,
  );
  const activeStyle = getCarrierChartStyle(
    Math.max(
      visibleSeries.findIndex((item) => item.carrierName === activeSeries?.carrierName),
      0,
    ),
  );
  const sparklineWidth = 230;
  const sparklineHeight = 88;
  const sparklinePoints = getChartPoints(
    activePoints.map((point) => point.count),
    sparklineWidth,
    sparklineHeight,
  );

  return (
    <div className={joinClassNames(chartFrameClassName, "gap-3")}>
      <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[minmax(0,1fr)_13rem]">
        <div className="rounded-[0.95rem] border border-stone-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(245,243,240,0.96)_100%)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              {visibleSeries.map((item, index) => {
                const style = getCarrierChartStyle(index);
                const active = item.carrierName === activeSeries?.carrierName;

                return (
                  <button
                    key={item.carrierName}
                    type="button"
                    onMouseEnter={() => setActiveCarrierName(item.carrierName)}
                    onFocus={() => setActiveCarrierName(item.carrierName)}
                    onClick={() => setActiveCarrierName(item.carrierName)}
                    className={joinClassNames(
                      "rounded-full px-2.5 py-1 text-[0.68rem] font-semibold transition duration-150",
                      active
                        ? style.badgeClassName
                        : "bg-stone-100 text-slate-600 hover:bg-stone-200",
                    )}
                  >
                    {item.carrierName}
                  </button>
                );
              })}
            </div>
            <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[0.68rem] font-semibold text-slate-600">
              조회 통신사 {visibleSeries.length}개
            </span>
          </div>

          <div className="mt-3 grid grid-cols-4 gap-2 pl-[4.25rem] text-[0.66rem] font-semibold text-slate-400">
            {axisLabels.map((label, index) => (
              <span key={`${label}-${index}`} className="text-right">
                {label}
              </span>
            ))}
          </div>

          <div className="mt-3 space-y-2.5">
            {visibleSeries.map((item, index) => {
              const active = item.carrierName === activeSeries?.carrierName;
              const width =
                maxCount > 0
                  ? Math.max((item.totalCount / maxCount) * 100, item.totalCount > 0 ? 12 : 0)
                  : 0;
              const style = getCarrierChartStyle(index);
              const activeDays = item.points.filter((point) => point.count > 0).length;

              return (
                <button
                  key={item.carrierName}
                  type="button"
                  onMouseEnter={() => setActiveCarrierName(item.carrierName)}
                  onFocus={() => setActiveCarrierName(item.carrierName)}
                  onClick={() => setActiveCarrierName(item.carrierName)}
                  className={joinClassNames(
                    "w-full rounded-[0.95rem] border px-3 py-2.5 text-left transition duration-200",
                    active
                      ? "border-blue-300 bg-white shadow-[0_18px_30px_-28px_rgba(37,99,235,0.28)]"
                      : "border-stone-200 bg-stone-50/80 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white",
                  )}
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{item.carrierName}</p>
                      <p className="mt-0.5 text-[0.72rem] text-slate-500">
                        판매일 {activeDays}일 · 필터 기간 누적 {item.totalCount}건
                      </p>
                    </div>
                    <span
                      className={joinClassNames(
                        "rounded-full px-2.5 py-1 text-[0.68rem] font-semibold",
                        active ? style.softClassName : "bg-stone-100 text-slate-600",
                      )}
                    >
                      {formatShare(item.totalCount, totalCount)}
                    </span>
                  </div>

                  <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-2">
                    <span className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      건수
                    </span>
                    <div className="rounded-full bg-stone-100 p-1">
                      <div
                        className={joinClassNames(
                          "dashboard-bar-grow h-2.5 rounded-full shadow-[0_10px_18px_-14px_rgba(15,23,42,0.45)]",
                          style.barClassName,
                        )}
                        style={{
                          width: width > 0 ? `${width}%` : "0%",
                          animationDelay: `${80 + index * 50}ms`,
                        }}
                      />
                    </div>
                    <span className="text-[0.7rem] font-semibold text-slate-500">
                      {item.totalCount}건
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <aside className="rounded-[0.95rem] border border-stone-200 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.12),transparent_58%),linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(241,245,249,0.96)_100%)] p-4">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
            선택 통신사
          </p>
          <h3 className="mt-2 text-[1.2rem] font-semibold tracking-[-0.05em] text-slate-950">
            {activeSeries?.carrierName ?? "-"}
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            필터 기간 판매 {activeSeries?.totalCount ?? 0}건 · 비중{" "}
            {formatShare(activeSeries?.totalCount ?? 0, totalCount)}
          </p>

          <div className="mt-4 rounded-[0.95rem] border border-stone-200 bg-white/90 px-3 py-3">
            <svg
              aria-hidden="true"
              className="h-[5.5rem] w-full overflow-visible"
              viewBox={`0 0 ${sparklineWidth} ${sparklineHeight}`}
            >
              {[0.25, 0.5, 0.75].map((ratio) => {
                const y = sparklineHeight - 18 - (sparklineHeight - 36) * ratio;

                return (
                  <line
                    key={ratio}
                    x1="26"
                    x2={sparklineWidth - 26}
                    y1={y}
                    y2={y}
                    stroke="rgba(148,163,184,0.18)"
                    strokeDasharray="4 8"
                  />
                );
              })}
              <path d={buildAreaPath(sparklinePoints, sparklineHeight)} fill={activeStyle.fill} />
              <path
                d={buildLinePath(sparklinePoints)}
                fill="none"
                stroke={activeStyle.stroke}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
              />
              {sparklinePoints.map((point, index) => (
                <circle
                  key={`${activeSeries?.carrierName ?? "carrier"}-${index}`}
                  cx={point.x}
                  cy={point.y}
                  fill={activeStyle.stroke}
                  r="3.6"
                />
              ))}
            </svg>
          </div>

          <div className="mt-3 grid gap-2">
            <div className="rounded-[0.9rem] bg-white/90 px-3 py-2">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
                최고 판매일
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-950">
                {peakPoint ? `${peakPoint.date} · ${peakPoint.count}건` : "데이터 없음"}
              </p>
            </div>
            <div className="rounded-[0.9rem] bg-white/90 px-3 py-2">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
                판매 발생일
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-950">
                {activePoints.filter((point) => point.count > 0).length}일
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export function StorePerformanceChart({ rows }: { rows: DashboardStoreSummary[] }) {
  if (rows.length === 0) {
    return null;
  }

  const maxAmount = Math.max(
    ...rows.flatMap((row) => [row.salesAmount, row.collectedAmount, row.profitAmount]),
    1,
  );
  const axisLabels = [0.25, 0.5, 0.75, 1].map((ratio) =>
    formatCompactWonTick(Math.round(maxAmount * ratio)),
  );
  const chartHeight = Math.max(280, rows.length * 112 + 48);

  return (
    <div
      className={joinClassNames(chartFrameClassName, "gap-3")}
      style={{ minHeight: `${chartHeight}px` }}
    >
      <div className="rounded-[0.95rem] border border-stone-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(245,243,240,0.96)_100%)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[0.68rem] font-semibold text-white">
              매출
            </span>
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[0.68rem] font-semibold text-blue-800">
              수금
            </span>
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[0.68rem] font-semibold text-amber-800">
              이익
            </span>
          </div>
          <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[0.68rem] font-semibold text-slate-600">
            조회 매장 {rows.length}곳
          </span>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-2 pl-[4.25rem] text-[0.66rem] font-semibold text-slate-400">
          {axisLabels.map((label, index) => (
            <span key={`${label}-${index}`} className="text-right">
              {label}
            </span>
          ))}
        </div>

        <div className="mt-3 space-y-3">
          {rows.map((row, index) => (
            <div
              key={row.storeId}
              className="rounded-[0.95rem] border border-stone-200 bg-white/90 px-3 py-3 transition duration-200 hover:-translate-y-0.5 hover:border-blue-200"
            >
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">{row.storeName}</p>
                  <p className="mt-0.5 text-[0.72rem] text-slate-500">
                    판매 {row.salesCount}건 · 추가 수납 {formatWon(row.additionalPaymentAmount)}
                  </p>
                </div>
                <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[0.68rem] font-semibold text-slate-700">
                  총매출 {formatWon(row.salesAmount)}
                </span>
              </div>

              <div className="space-y-1.5">
                <ComparisonBar
                  label="매출"
                  value={row.salesAmount}
                  maxValue={maxAmount}
                  barClassName="bg-[linear-gradient(90deg,#111827_0%,#2563eb_100%)]"
                  delay={80 + index * 60}
                />
                <ComparisonBar
                  label="수금"
                  value={row.collectedAmount}
                  maxValue={maxAmount}
                  barClassName="bg-[linear-gradient(90deg,#2563eb_0%,#38bdf8_100%)]"
                  delay={120 + index * 60}
                />
                <ComparisonBar
                  label="이익"
                  value={row.profitAmount}
                  maxValue={maxAmount}
                  barClassName="bg-[linear-gradient(90deg,#d97706_0%,#f59e0b_100%)]"
                  delay={160 + index * 60}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PeriodFlowChart({ rows }: { rows: DashboardDailySummary[] }) {
  const visibleRows = rows.slice(-10);

  if (visibleRows.length === 0) {
    return null;
  }

  return (
    <InteractiveLineChart
      dates={visibleRows.map((row) => row.date)}
      series={[
        {
          id: "sales",
          label: "판매 금액",
          color: "slate",
          values: visibleRows.map((row) => row.salesAmount),
          formatValue: formatWon,
        },
        {
          id: "collected",
          label: "수납 금액",
          color: "blue",
          values: visibleRows.map((row) => row.collectedAmount),
          formatValue: formatWon,
        },
        {
          id: "profit",
          label: "총이익",
          color: "amber",
          values: visibleRows.map((row) => row.profitAmount),
          formatValue: formatWon,
        },
      ]}
    />
  );
}

export function ReceivableHealthChart({
  buckets,
}: {
  buckets: DashboardReceivableHealthBucket[];
}) {
  if (buckets.length === 0) {
    return null;
  }

  const visibleBuckets = buckets.filter((bucket) => bucket.balanceAmount > 0);

  if (visibleBuckets.length === 0) {
    return null;
  }

  const totalBalanceAmount = visibleBuckets.reduce(
    (total, bucket) => total + bucket.balanceAmount,
    0,
  );
  const [activeBucketId, setActiveBucketId] = useState<string>(
    visibleBuckets[0]?.id ?? buckets[0]?.id ?? "",
  );
  const activeBucket =
    buckets.find((bucket) => bucket.id === activeBucketId) ?? visibleBuckets[0];
  const radius = 66;
  const circumference = 2 * Math.PI * radius;
  let consumedLength = 0;

  return (
    <div className={joinClassNames(chartFrameClassName, "gap-3")}>
      <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[16rem_minmax(0,13.5rem)] xl:items-center xl:justify-between">
        <div className="relative mx-auto flex h-[15rem] w-[15rem] items-center justify-center">
          <svg
            aria-hidden="true"
            className="h-full w-full"
            viewBox="0 0 180 180"
          >
            <circle
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke="rgba(226,232,240,0.95)"
              strokeWidth="18"
            />
            {visibleBuckets.map((bucket) => {
              const styles = getReceivableToneStyles(bucket.tone);
              const segmentLength =
                totalBalanceAmount > 0
                  ? (bucket.balanceAmount / totalBalanceAmount) * circumference
                  : 0;
              const dashArray = `${segmentLength} ${Math.max(
                circumference - segmentLength,
                0,
              )}`;
              const dashOffset = -consumedLength;
              const active = activeBucket.id === bucket.id;

              consumedLength += segmentLength;

              return (
                <circle
                  key={bucket.id}
                  cx="90"
                  cy="90"
                  r={radius}
                  fill="none"
                  stroke={styles.stroke}
                  strokeWidth={active ? "24" : "18"}
                  strokeLinecap="round"
                  strokeDasharray={dashArray}
                  strokeDashoffset={dashOffset}
                  transform="rotate(-90 90 90)"
                  className="cursor-pointer transition-all duration-200"
                  opacity={active ? 1 : 0.7}
                  onMouseEnter={() => setActiveBucketId(bucket.id)}
                  onFocus={() => setActiveBucketId(bucket.id)}
                  onClick={() => setActiveBucketId(bucket.id)}
                />
              );
            })}
          </svg>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
              현재 미수 총액
            </span>
            <span className="mt-2 text-[1.15rem] font-semibold tracking-[-0.05em] text-slate-950">
              {formatWon(totalBalanceAmount)}
            </span>
            <span className="mt-2 rounded-full bg-stone-100 px-2.5 py-1 text-[0.7rem] font-semibold text-slate-600">
              {activeBucket.label} {formatShare(activeBucket.balanceAmount, totalBalanceAmount)}
            </span>
          </div>
        </div>

        <div className="min-h-0 space-y-2">
          <div className="rounded-[0.95rem] border border-stone-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(245,243,240,0.96)_100%)] px-3.5 py-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  선택 구간
                </p>
                <p className="mt-1 text-[1.05rem] font-semibold text-slate-950">
                  {activeBucket.label}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {activeBucket.count}건 · {formatWon(activeBucket.balanceAmount)}
                </p>
              </div>
              <span
                className={joinClassNames(
                  "rounded-full px-2.5 py-1 text-[0.72rem] font-semibold",
                  getReceivableToneStyles(activeBucket.tone).chipClassName,
                )}
              >
                {formatShare(activeBucket.balanceAmount, totalBalanceAmount)}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            {buckets.map((bucket, index) => {
              const styles = getReceivableToneStyles(bucket.tone);
              const active = bucket.id === activeBucket.id;
              const width =
                totalBalanceAmount > 0
                  ? Math.max(
                      (bucket.balanceAmount / totalBalanceAmount) * 100,
                      bucket.balanceAmount > 0 ? 10 : 0,
                    )
                  : 0;

              return (
                <button
                  key={bucket.id}
                  type="button"
                  onMouseEnter={() => setActiveBucketId(bucket.id)}
                  onFocus={() => setActiveBucketId(bucket.id)}
                  onClick={() => setActiveBucketId(bucket.id)}
                  className={joinClassNames(
                    "w-full rounded-[0.95rem] border px-3 py-2 text-left transition duration-200",
                    active
                      ? "border-blue-300 bg-white shadow-[0_18px_30px_-28px_rgba(37,99,235,0.28)]"
                      : "border-stone-200 bg-stone-50/80 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white",
                  )}
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{bucket.label}</p>
                      <p className="mt-0.5 text-[0.72rem] text-slate-500">
                        {bucket.count}건 · {formatWon(bucket.balanceAmount)}
                      </p>
                    </div>
                    <span
                      className={joinClassNames(
                        "rounded-full px-2.5 py-1 text-[0.68rem] font-semibold",
                        styles.fillClassName,
                      )}
                    >
                      {formatShare(bucket.balanceAmount, totalBalanceAmount)}
                    </span>
                  </div>

                  <div className="rounded-full bg-stone-100 p-1">
                    <div
                      className={joinClassNames(
                        "dashboard-bar-grow h-2.5 rounded-full",
                        styles.barClassName,
                      )}
                      style={{
                        width: width > 0 ? `${width}%` : "0%",
                        animationDelay: `${80 + index * 60}ms`,
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
