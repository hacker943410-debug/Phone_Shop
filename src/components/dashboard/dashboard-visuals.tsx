"use client";

import { useState } from "react";

import { joinClassNames } from "@/components/workspace/ui-classnames";
import {
  type DashboardCarrierTrendSeries,
  type DashboardDailySummary,
  type DashboardRecentSale,
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

  const visibleRows = rows.slice(0, 4);
  const maxSalesAmount = Math.max(...visibleRows.map((row) => row.salesAmount), 1);

  return (
    <div className={joinClassNames(chartFrameClassName, "gap-3")}>
      <div className="flex items-center justify-between gap-3 rounded-[0.95rem] border border-stone-200 bg-stone-50/90 px-3.5 py-2.5">
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
            상위 담당자
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-950">
            수익 기준 상위 {visibleRows.length}명만 기본 노출
          </p>
        </div>
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[0.72rem] font-semibold text-blue-800">
          전체 {rows.length}명
        </span>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {visibleRows.map((row, index) => {
          const salesRate = Math.max((row.salesAmount / maxSalesAmount) * 100, 12);
          const profitRate = Math.max((row.profitAmount / maxSalesAmount) * 100, 6);

          return (
            <article
              key={row.staffId}
              className="group rounded-[0.95rem] border border-stone-200 bg-stone-50/80 px-3.5 py-2.5 transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white"
            >
              <div className="mb-2 flex items-end justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">{row.staffName}</p>
                  <p className="mt-0.5 text-[0.74rem] text-slate-500">
                    판매 {row.salesCount}건 / 추가 수납 {formatWon(row.additionalPaymentAmount)}
                  </p>
                </div>
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[0.72rem] font-semibold text-amber-800">
                  총이익 {formatWon(row.profitAmount)}
                </span>
              </div>

              <div className="space-y-2">
                <div className="rounded-full bg-stone-100 p-1">
                  <div
                    className="dashboard-bar-grow flex h-7 items-center rounded-full bg-[linear-gradient(90deg,#111827_0%,#2563eb_100%)] px-3 text-[0.78rem] font-semibold text-white"
                    style={{
                      width: `${salesRate}%`,
                      animationDelay: `${80 + index * 60}ms`,
                    }}
                  >
                    {formatWon(row.salesAmount)}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-[0.74rem] font-medium text-slate-500">
                  <span
                    className="dashboard-bar-grow h-2.5 rounded-full bg-[linear-gradient(90deg,#f59e0b_0%,#f97316_100%)]"
                    style={{
                      width: `${profitRate}%`,
                      minWidth: "2.5rem",
                      animationDelay: `${140 + index * 60}ms`,
                    }}
                  />
                  <span>수납 {formatWon(row.collectedAmount)}</span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

export function StorePerformanceChart({ rows }: { rows: DashboardStoreSummary[] }) {
  if (rows.length === 0) {
    return null;
  }

  const visibleRows = rows.slice(0, 3);
  const maxSalesAmount = Math.max(...visibleRows.map((row) => row.salesAmount), 1);

  return (
    <div className={joinClassNames(chartFrameClassName, "gap-3")}>
      <div className="grid gap-3 lg:grid-cols-2">
        {visibleRows.map((row, index) => {
          const salesRate = Math.max((row.salesAmount / maxSalesAmount) * 100, 18);
          const profitRate = Math.max((row.profitAmount / maxSalesAmount) * 100, 8);

          return (
            <article
              key={row.storeId}
              className="group rounded-[1rem] border border-stone-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(245,243,240,0.96)_100%)] p-4 transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_24px_34px_-30px_rgba(37,99,235,0.22)]"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {row.storeName}
                  </p>
                  <p className="mt-1 text-[1.22rem] font-semibold tracking-[-0.05em] text-slate-950">
                    {formatWon(row.salesAmount)}
                  </p>
                </div>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[0.72rem] font-semibold text-blue-800">
                  판매 {row.salesCount}건
                </span>
              </div>

              <div className="space-y-2">
                <div>
                  <div className="mb-1 flex items-center justify-between text-[0.72rem] font-medium text-slate-500">
                    <span>판매 금액</span>
                    <span>{formatWon(row.salesAmount)}</span>
                  </div>
                  <div className="rounded-full bg-stone-100 p-1">
                    <div
                      className="dashboard-bar-grow flex h-8 items-center rounded-full bg-[linear-gradient(90deg,#0f172a_0%,#2563eb_100%)] px-3 text-sm font-semibold text-white"
                      style={{
                        width: `${salesRate}%`,
                        animationDelay: `${70 + index * 70}ms`,
                      }}
                    >
                      {row.storeName}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[0.74rem] font-medium text-slate-600">
                  <span className="rounded-[0.85rem] bg-white px-3 py-2">
                    수납 {formatWon(row.collectedAmount)}
                  </span>
                  <span className="rounded-[0.85rem] bg-amber-50 px-3 py-2 text-amber-800">
                    총이익 {formatWon(row.profitAmount)}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[0.74rem] font-medium text-slate-500">
                  <span
                    className="dashboard-bar-grow h-2.5 rounded-full bg-[linear-gradient(90deg,#f59e0b_0%,#f97316_100%)]"
                    style={{
                      width: `${profitRate}%`,
                      minWidth: "2.8rem",
                      animationDelay: `${130 + index * 70}ms`,
                    }}
                  />
                  <span>추가 수납 {formatWon(row.additionalPaymentAmount)}</span>
                </div>
              </div>
            </article>
          );
        })}
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

export function RecentSalesChart({ rows }: { rows: DashboardRecentSale[] }) {
  const visibleRows = rows.slice(0, 4);

  if (visibleRows.length === 0) {
    return null;
  }

  const maxTotalAmount = Math.max(
    ...visibleRows.map((row) => row.collectedAmount + row.receivableAmount),
    1,
  );

  return (
    <div className={joinClassNames(chartFrameClassName, "gap-3")}>
      <div className="flex items-center justify-between gap-3 rounded-[0.95rem] border border-stone-200 bg-stone-50/90 px-3.5 py-2.5">
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
            최근 등록
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-950">
            최신 5건만 기본 노출
          </p>
        </div>
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[0.72rem] font-semibold text-blue-800">
          전체 {rows.length}건
        </span>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {visibleRows.map((row, index) => {
        const totalAmount = row.collectedAmount + row.receivableAmount;
        const totalRate = Math.max((totalAmount / maxTotalAmount) * 100, 16);
        const collectedRate =
          totalAmount > 0 ? (row.collectedAmount / totalAmount) * 100 : 100;

        return (
          <article
            key={row.id}
            className="rounded-[0.95rem] border border-stone-200 bg-stone-50/80 px-3.5 py-2.5 transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white"
          >
            <div className="mb-2 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-950">
                  {row.customerName}
                </p>
                <p className="mt-0.5 truncate text-[0.74rem] text-slate-500">
                  {row.carrierName} {row.deviceModelName} / {row.saleDate}
                </p>
              </div>
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[0.72rem] font-semibold text-amber-800">
                {formatWon(row.profitAmount)}
              </span>
            </div>

            <div className="mb-2 h-3 overflow-hidden rounded-full bg-stone-100">
              <div
                className="dashboard-bar-grow flex h-full overflow-hidden rounded-full"
                style={{
                  width: `${totalRate}%`,
                  animationDelay: `${90 + index * 55}ms`,
                }}
              >
                <span
                  className="h-full bg-[linear-gradient(90deg,#2563eb_0%,#38bdf8_100%)]"
                  style={{ width: `${collectedRate}%` }}
                />
                <span
                  className="h-full bg-[linear-gradient(90deg,#f59e0b_0%,#ef4444_100%)]"
                  style={{ width: `${100 - collectedRate}%` }}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-[0.74rem] font-medium text-slate-600">
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-800">
                수납 {formatWon(row.collectedAmount)}
              </span>
              <span className="rounded-full bg-rose-50 px-2.5 py-1 text-rose-700">
                미수 {formatWon(row.receivableAmount)}
              </span>
            </div>
          </article>
        );
      })}
      </div>
    </div>
  );
}

export function CarrierActivationTrendChart({
  series,
}: {
  series: DashboardCarrierTrendSeries[];
}) {
  const visibleSeries = series.map((item, index) => ({
    ...item,
    color: (["blue", "amber", "teal"] as const)[index % 3],
    points: item.points.slice(-10),
  }));

  if (visibleSeries.length === 0) {
    return null;
  }

  return (
    <InteractiveLineChart
      dates={visibleSeries[0]?.points.map((point) => point.date) ?? []}
      series={visibleSeries.map((item) => ({
        id: item.carrierName,
        label: `${item.carrierName} ${item.totalCount}건`,
        color: item.color,
        values: item.points.map((point) => point.count),
        formatValue: (value) => `${value}건`,
      }))}
    />
  );
}
