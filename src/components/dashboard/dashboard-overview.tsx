"use client";

import { useState, type ReactNode } from "react";

import { DashboardDetailDialog } from "@/components/dashboard/dashboard-detail-dialog";
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import {
  CarrierActivationTrendChart,
  PeriodFlowChart,
  RecentSalesChart,
  StaffSummaryBarChart,
  StorePerformanceChart,
} from "@/components/dashboard/dashboard-visuals";
import { EmptyState } from "@/components/workspace/admin-form-controls";
import {
  joinClassNames,
  secondaryButtonClassName,
} from "@/components/workspace/ui-classnames";
import { TonePill } from "@/components/workspace/workspace-primitives";
import type {
  DashboardFilters,
  DashboardMetric,
  DashboardReportData,
} from "@/lib/dashboard-reporting-types";
import { formatWon } from "@/lib/formatters";

const metricAccentStyles = {
  amber: {
    frame:
      "border-amber-200 bg-[linear-gradient(180deg,rgba(255,251,235,0.98)_0%,rgba(255,255,255,1)_100%)]",
    marker: "bg-amber-400",
    badge: "bg-amber-100 text-amber-900",
  },
  teal: {
    frame:
      "border-blue-200 bg-[linear-gradient(180deg,rgba(239,246,255,0.98)_0%,rgba(255,255,255,1)_100%)]",
    marker: "bg-blue-400",
    badge: "bg-blue-100 text-blue-900",
  },
  slate: {
    frame:
      "border-stone-200 bg-[linear-gradient(180deg,rgba(250,250,249,1)_0%,rgba(255,255,255,1)_100%)]",
    marker: "bg-stone-300",
    badge: "bg-stone-200 text-stone-700",
  },
} as const;

const chartPanelClassName =
  "flex min-h-0 flex-col overflow-hidden rounded-[1.18rem] border border-stone-200 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.1),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(246,243,238,0.98)_100%)] p-3.5 shadow-[0_24px_40px_-36px_rgba(15,23,42,0.26)]";

function buildDashboardQueryString(filters: DashboardFilters) {
  const searchParams = new URLSearchParams();
  searchParams.set("preset", filters.preset);
  searchParams.set("dateFrom", filters.dateFrom);
  searchParams.set("dateTo", filters.dateTo);
  if (filters.storeId) {
    searchParams.set("storeId", filters.storeId);
  }
  return searchParams.toString();
}

function buildReportHref(filters: DashboardFilters) {
  return `/reports/summary?${buildDashboardQueryString(filters)}`;
}

function buildCsvHref(filters: DashboardFilters) {
  return `/api/reports/summary?${buildDashboardQueryString(filters)}`;
}

function buildSalesHref(filters: DashboardFilters) {
  const searchParams = new URLSearchParams();
  searchParams.set("dateFrom", filters.dateFrom);
  searchParams.set("dateTo", filters.dateTo);
  if (filters.storeId) {
    searchParams.set("storeId", filters.storeId);
  }
  return `/sales?${searchParams.toString()}`;
}

function PrintIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 20 20">
      <path
        d="M6 6V3.75h8V6M5.25 14.75H4.5a1.75 1.75 0 0 1-1.75-1.75V8.5A1.75 1.75 0 0 1 4.5 6.75h11A1.75 1.75 0 0 1 17.25 8.5V13a1.75 1.75 0 0 1-1.75 1.75H14.75M6 11.25h8v5H6v-5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
      <circle cx="14.1" cy="9.6" r=".8" fill="currentColor" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 20 20">
      <path
        d="M10 3.5v8m0 0 3-3m-3 3-3-3M4 13.75v1.25A1.5 1.5 0 0 0 5.5 16.5h9A1.5 1.5 0 0 0 16 15v-1.25"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function HeaderActionLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: ReactNode;
}) {
  return (
    <a
      className={joinClassNames(
        `${secondaryButtonClassName} h-9 w-9 px-0`,
        "rounded-full border-stone-200 bg-white text-slate-700",
      )}
      href={href}
      title={label}
    >
      {icon}
      <span className="sr-only">{label}</span>
    </a>
  );
}

function SectionActionLink({
  href,
  label = "상세보기",
}: {
  href: string;
  label?: string;
}) {
  return (
    <a
      href={href}
      className={`${secondaryButtonClassName} h-8 px-3 text-[0.76rem]`}
    >
      {label}
    </a>
  );
}

type LeftAnalysisTab = "staff" | "period";
type RightAnalysisTab = "sales" | "carrier";

function AnalysisTabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={joinClassNames(
        `${secondaryButtonClassName} h-8 px-3 text-[0.74rem]`,
        active &&
          "!border-slate-950 !bg-slate-950 !text-white hover:!border-slate-900 hover:!bg-slate-900 hover:!text-white",
      )}
    >
      {label}
    </button>
  );
}

function DashboardHeader({ report }: { report: DashboardReportData }) {
  const selectedStoreLabel =
    report.availableStores.find((store) => store.id === report.filters.storeId)?.name ??
    "전체 매장";

  return (
    <header className="flex flex-col gap-1.5 xl:flex-row xl:items-start xl:justify-between">
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-blue-700">
          <span>Dashboard</span>
          <span aria-hidden="true" className="h-px w-8 bg-blue-200" />
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-800">
            {report.periodLabel}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-[1.24rem] font-semibold tracking-[-0.05em] text-slate-950 sm:text-[1.42rem]">
            대시보드
          </h1>
          <TonePill
            label={`현재 미수 ${report.summary.currentReceivableCount}건`}
            tone="slate"
          />
          <TonePill label={selectedStoreLabel} tone="teal" />
          <TonePill
            label={`개통 가능 ${report.summary.activationEligibleCount}건`}
            tone="amber"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 xl:pt-1">
        <HeaderActionLink
          href={buildReportHref(report.filters)}
          icon={<PrintIcon />}
          label="인쇄용 보고서"
        />
        <HeaderActionLink
          href={buildCsvHref(report.filters)}
          icon={<DownloadIcon />}
          label="CSV 다운로드"
        />
      </div>
    </header>
  );
}

function MetricSection({ metrics }: { metrics: DashboardMetric[] }) {
  return (
    <section className="grid auto-rows-fr gap-3 md:grid-cols-2 xl:grid-cols-6">
      {metrics.map((metric) => {
        const accent = metricAccentStyles[metric.accent];

        return (
          <article
            key={metric.label}
            className={joinClassNames(
              "relative flex h-full min-h-[4.9rem] flex-col justify-between overflow-hidden rounded-[1.05rem] border px-3.5 py-2.5 shadow-[0_18px_34px_-34px_rgba(15,23,42,0.22)]",
              accent.frame,
            )}
          >
            <div
              aria-hidden="true"
              className={joinClassNames("absolute inset-x-0 top-0 h-1", accent.marker)}
            />

            <div className="space-y-1">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {metric.label}
                </p>
                <span
                  className={joinClassNames(
                    "rounded-full px-2 py-1 text-[0.64rem] font-semibold",
                    accent.badge,
                  )}
                >
                  실시간
                </span>
              </div>
              <p className="text-[1.3rem] font-semibold leading-none tracking-[-0.06em] text-slate-950 [font-variant-numeric:tabular-nums]">
                {metric.value}
              </p>
            </div>

            <p className="mt-1 line-clamp-2 text-[0.71rem] leading-4.5 text-slate-600">
              {metric.helper}
            </p>
          </article>
        );
      })}
    </section>
  );
}

function ChartPanel({
  title,
  action,
  className,
  contentClassName,
  children,
}: {
  title: string;
  action?: ReactNode;
  className?: string;
  contentClassName?: string;
  children: ReactNode;
}) {
  return (
    <section className={joinClassNames(chartPanelClassName, className)}>
      <header className="mb-2.5 flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-[0.96rem] font-semibold tracking-[-0.03em] text-slate-950">
          {title}
        </h2>
        {action}
      </header>
      <div className={joinClassNames("min-h-0 flex-1", contentClassName)}>{children}</div>
    </section>
  );
}

function OperationSpotlightCard({
  title,
  value,
  helper,
  toneClassName,
  action,
  children,
}: {
  title: string;
  value: string;
  helper: string;
  toneClassName: string;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <article
      className={joinClassNames(
        chartPanelClassName,
        "min-h-[12.5rem] space-y-3 text-slate-900 xl:min-h-0 xl:flex-1",
        toneClassName,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
            {title}
          </p>
          <p className="mt-1 text-[1.54rem] font-semibold tracking-[-0.05em] text-slate-950">
            {value}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {action}
          <span className="dashboard-pulse h-3 w-3 rounded-full bg-current opacity-70" />
        </div>
      </div>
      <p className="text-[0.8rem] leading-5 text-slate-600">{helper}</p>
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </article>
  );
}

function OperationsOverview({
  report,
  className,
}: {
  report: DashboardReportData;
  className?: string;
}) {
  const receivableRows = report.receivableSnapshots.slice(0, 2);
  const activationRows = report.activationEligibleCustomers.slice(0, 2);

  return (
    <section className={joinClassNames("flex min-h-0 flex-col gap-3", className)}>
      <header className="flex items-center justify-between gap-3">
        <h2 className="text-[1rem] font-semibold tracking-[-0.03em] text-slate-950">
          운영 체크
        </h2>
      </header>

      <div className="grid min-h-0 items-stretch gap-3 xl:flex-1 xl:grid-cols-1">
        <OperationSpotlightCard
          title="미수금 잔액"
          value={formatWon(report.summary.currentReceivableBalance)}
          helper={`현재 미수 ${report.summary.currentReceivableCount}건 중 상위 2건만 먼저 보여줍니다.`}
          toneClassName="text-rose-600"
          action={
            <div className="flex flex-wrap items-center justify-end gap-2">
              <SectionActionLink href="/receivables" />
              <DashboardDetailDialog
                description={`현재 잔액 기준 상위 ${report.receivableSnapshots.length}건을 모달에서 확인합니다.`}
                title="미수금 잔액 상세"
              >
                {report.receivableSnapshots.length > 0 ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {report.receivableSnapshots.map((row) => (
                      <article
                        key={`${row.customerName}-${row.deviceModelName}`}
                        className="rounded-[1rem] border border-rose-100 bg-white/90 px-4 py-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-950">
                              {row.customerName}
                            </p>
                            <p className="mt-1 text-[0.76rem] text-slate-500">
                              {row.carrierName} / {row.deviceModelName}
                            </p>
                          </div>
                          <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[0.74rem] font-semibold text-rose-700">
                            {formatWon(row.balanceAmount)}
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">표시할 미수금 데이터가 없습니다.</p>
                )}
              </DashboardDetailDialog>
            </div>
          }
        >
          {receivableRows.length > 0 ? (
            <div className="grid gap-2">
              {receivableRows.map((row) => (
                <div
                  key={`${row.customerName}-${row.deviceModelName}`}
                  className="rounded-[0.95rem] border border-rose-100 bg-white/85 px-3 py-2.5 text-slate-700"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-950">{row.customerName}</p>
                    <span className="text-[0.78rem] font-semibold text-rose-700">
                      {formatWon(row.balanceAmount)}
                    </span>
                  </div>
                  <p className="mt-1 text-[0.76rem] text-slate-500">
                    {row.carrierName} / {row.deviceModelName}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[0.78rem] text-slate-500">현재 표시할 미수 고객이 없습니다.</p>
          )}
        </OperationSpotlightCard>

        <OperationSpotlightCard
          title="개통 가능 고객"
          value={`${report.summary.activationEligibleCount}건`}
          helper="현재 규칙 기준으로 즉시 개통 가능한 고객 중 상위 2건만 먼저 보여줍니다."
          toneClassName="text-amber-600"
          action={
            <DashboardDetailDialog
              description={`현재 규칙 기준으로 개통 가능한 고객 ${report.activationEligibleCustomers.length}건을 모달에서 확인합니다.`}
              title="개통 가능 고객 상세"
            >
              {report.activationEligibleCustomers.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {report.activationEligibleCustomers.map((row) => (
                    <article
                      key={row.customerId}
                      className="rounded-[1rem] border border-amber-100 bg-white/90 px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-950">
                            {row.customerName}
                          </p>
                          <p className="mt-1 text-[0.76rem] text-slate-500">
                            마지막 판매 {row.lastSaleDate} / 가능일 {row.eligibleDate}
                          </p>
                        </div>
                        <TonePill label={row.carrierName} tone="amber" />
                      </div>
                      <p className="mt-2 text-[0.74rem] font-medium text-amber-700">
                        {row.ruleLabel}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">표시할 개통 가능 고객이 없습니다.</p>
              )}
            </DashboardDetailDialog>
          }
        >
          {activationRows.length > 0 ? (
            <div className="grid gap-2">
              {activationRows.map((row) => (
                <div
                  key={row.customerId}
                  className="rounded-[0.95rem] border border-amber-100 bg-white/85 px-3 py-2.5 text-slate-700"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-950">
                      {row.customerName}
                    </p>
                    <TonePill label={row.carrierName} tone="amber" />
                  </div>
                  <p className="mt-1 text-[0.76rem] text-slate-500">
                    마지막 판매 {row.lastSaleDate} / 가능일 {row.eligibleDate}
                  </p>
                  <p className="mt-1 text-[0.72rem] font-medium text-amber-700">
                    {row.ruleLabel}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[0.78rem] text-slate-500">
              현재 규칙 기준으로 즉시 개통 가능한 고객이 없습니다.
            </p>
          )}
        </OperationSpotlightCard>
      </div>
    </section>
  );
}

function DashboardAnalyticsDeck({ report }: { report: DashboardReportData }) {
  const [leftTab, setLeftTab] = useState<LeftAnalysisTab>("staff");
  const [rightTab, setRightTab] = useState<RightAnalysisTab>("sales");
  const isStaffTab = leftTab === "staff";
  const isSalesTab = rightTab === "sales";

  const leftTitle = isStaffTab ? "담당자 요약" : "기간 흐름";
  const rightTitle = isSalesTab ? "최근 판매" : "통신사별 개통 추이";

  const leftAction =
    isStaffTab ? (
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <AnalysisTabButton
            active={isStaffTab}
            label="담당자"
            onClick={() => setLeftTab("staff")}
          />
          <AnalysisTabButton
            active={!isStaffTab}
            label="기간"
            onClick={() => setLeftTab("period")}
          />
        </div>
        <DashboardDetailDialog
          description={`${report.periodLabel} 기준 전체 담당자 ${report.staffSummaries.length}명의 실적입니다.`}
          title="담당자 요약 상세"
        >
          {report.staffSummaries.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {report.staffSummaries.map((row) => (
                <article
                  key={row.staffId}
                  className="rounded-[1rem] border border-stone-200 bg-white/90 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{row.staffName}</p>
                      <p className="mt-1 text-[0.76rem] text-slate-500">
                        판매 {row.salesCount}건 / 추가 수납 {formatWon(row.additionalPaymentAmount)}
                      </p>
                    </div>
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[0.74rem] font-semibold text-amber-800">
                      총이익 {formatWon(row.profitAmount)}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 text-[0.76rem] font-medium text-slate-600 sm:grid-cols-2">
                    <span className="rounded-[0.85rem] bg-stone-100 px-3 py-2">
                      판매금액 {formatWon(row.salesAmount)}
                    </span>
                    <span className="rounded-[0.85rem] bg-blue-50 px-3 py-2 text-blue-800">
                      총수납 {formatWon(row.collectedAmount)}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">표시할 담당자 실적이 없습니다.</p>
          )}
        </DashboardDetailDialog>
      </div>
    ) : (
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <AnalysisTabButton
            active={isStaffTab}
            label="담당자"
            onClick={() => setLeftTab("staff")}
          />
          <AnalysisTabButton
            active={!isStaffTab}
            label="기간"
            onClick={() => setLeftTab("period")}
          />
        </div>
        <SectionActionLink href={buildReportHref(report.filters)} label="보고서" />
      </div>
    );

  const rightAction =
    isSalesTab ? (
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <AnalysisTabButton
            active={isSalesTab}
            label="판매"
            onClick={() => setRightTab("sales")}
          />
          <AnalysisTabButton
            active={!isSalesTab}
            label="개통"
            onClick={() => setRightTab("carrier")}
          />
        </div>
        <SectionActionLink href={buildSalesHref(report.filters)} label="목록" />
        <DashboardDetailDialog
          description={`${report.periodLabel} 기준 최근 판매 ${report.recentSales.length}건입니다.`}
          title="최근 판매 상세"
        >
          {report.recentSales.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {report.recentSales.map((row) => (
                <article
                  key={row.id}
                  className="rounded-[1rem] border border-stone-200 bg-white/90 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-950">
                        {row.customerName}
                      </p>
                      <p className="mt-1 truncate text-[0.76rem] text-slate-500">
                        {row.carrierName} {row.deviceModelName} / {row.saleDate}
                      </p>
                      <p className="mt-1 text-[0.74rem] text-slate-500">
                        담당자 {row.staffName}
                      </p>
                    </div>
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[0.74rem] font-semibold text-amber-800">
                      {formatWon(row.profitAmount)}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 text-[0.76rem] font-medium text-slate-600 sm:grid-cols-2">
                    <span className="rounded-[0.85rem] bg-blue-50 px-3 py-2 text-blue-800">
                      수납 {formatWon(row.collectedAmount)}
                    </span>
                    <span className="rounded-[0.85rem] bg-rose-50 px-3 py-2 text-rose-700">
                      미수 {formatWon(row.receivableAmount)}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">선택 기간에 등록된 최근 판매가 없습니다.</p>
          )}
        </DashboardDetailDialog>
      </div>
    ) : (
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <AnalysisTabButton
            active={isSalesTab}
            label="판매"
            onClick={() => setRightTab("sales")}
          />
          <AnalysisTabButton
            active={!isSalesTab}
            label="개통"
            onClick={() => setRightTab("carrier")}
          />
        </div>
        <SectionActionLink href={buildReportHref(report.filters)} label="보고서" />
      </div>
    );

  return (
    <section className="grid gap-3 xl:grid-cols-2 xl:items-start">
      <ChartPanel title={leftTitle} action={leftAction} className="min-h-[16rem]">
        {isStaffTab ? (
          report.staffSummaries.length > 0 ? (
            <StaffSummaryBarChart rows={report.staffSummaries} />
          ) : (
            <EmptyState message="선택 기간 집계에 포함된 담당자 실적이 없습니다." />
          )
        ) : report.dailySummaries.length > 0 ? (
          <PeriodFlowChart rows={report.dailySummaries} />
        ) : (
          <EmptyState message="선택 기간에 표시할 일자별 흐름 데이터가 없습니다." />
        )}
      </ChartPanel>

      <ChartPanel title={rightTitle} action={rightAction} className="min-h-[16rem]">
        {isSalesTab ? (
          report.recentSales.length > 0 ? (
            <RecentSalesChart rows={report.recentSales} />
          ) : (
            <EmptyState message="선택 기간에 등록된 최근 판매가 없습니다." />
          )
        ) : report.carrierTrendSeries.length > 0 ? (
          <CarrierActivationTrendChart series={report.carrierTrendSeries} />
        ) : (
          <EmptyState message="선택 기간에 통신사별 개통 추이 데이터가 없습니다." />
        )}
      </ChartPanel>
    </section>
  );
}

export interface DashboardOverviewProps {
  report: DashboardReportData;
}

export function DashboardOverview({ report }: DashboardOverviewProps) {
  return (
    <div className="flex flex-col gap-3 p-3 sm:p-4 2xl:p-5">
      <section className="space-y-3">
        <DashboardHeader report={report} />
        <DashboardFilterBar filters={report.filters} stores={report.availableStores} />
      </section>

      <MetricSection metrics={report.metrics} />

      <section className="grid gap-3 xl:grid-cols-[minmax(0,1.18fr)_minmax(420px,0.82fr)] xl:items-start">

      <ChartPanel title="매장별 매출 실적" className="min-h-[20rem]">
        {report.storeSummaries.length > 0 ? (
          <StorePerformanceChart rows={report.storeSummaries} />
        ) : (
          <EmptyState message="선택 기간에 집계된 매장별 실적 데이터가 없습니다." />
        )}
      </ChartPanel>
        <OperationsOverview report={report} className="min-h-[18rem]" />
      </section>

      <DashboardAnalyticsDeck report={report} />

      {false ? (
      <section className="grid min-h-0 gap-3 xl:grid-cols-2">
        <ChartPanel
          title="담당자 요약"
          action={
            <DashboardDetailDialog
              description={`${report.periodLabel} 기준 전체 담당자 ${report.staffSummaries.length}명의 실적입니다.`}
              title="담당자 요약 상세"
            >
              {report.staffSummaries.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {report.staffSummaries.map((row) => (
                    <article
                      key={row.staffId}
                      className="rounded-[1rem] border border-stone-200 bg-white/90 px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-950">{row.staffName}</p>
                          <p className="mt-1 text-[0.76rem] text-slate-500">
                            판매 {row.salesCount}건 / 추가 수납 {formatWon(row.additionalPaymentAmount)}
                          </p>
                        </div>
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[0.74rem] font-semibold text-amber-800">
                          총이익 {formatWon(row.profitAmount)}
                        </span>
                      </div>
                      <div className="mt-3 grid gap-2 text-[0.76rem] font-medium text-slate-600 sm:grid-cols-2">
                        <span className="rounded-[0.85rem] bg-stone-100 px-3 py-2">
                          판매금액 {formatWon(row.salesAmount)}
                        </span>
                        <span className="rounded-[0.85rem] bg-blue-50 px-3 py-2 text-blue-800">
                          총수납 {formatWon(row.collectedAmount)}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">표시할 담당자 실적이 없습니다.</p>
              )}
            </DashboardDetailDialog>
          }
          className="min-h-[18rem] xl:h-full"
        >
          {report.staffSummaries.length > 0 ? (
            <StaffSummaryBarChart rows={report.staffSummaries} />
          ) : (
            <EmptyState message="선택 기간 집계에 포함된 판매 또는 수납 데이터가 없습니다." />
          )}
        </ChartPanel>

        <ChartPanel
          title="기간 흐름"
          action={<SectionActionLink href={buildReportHref(report.filters)} />}
          className="min-h-[18rem] xl:h-full"
        >
          {report.dailySummaries.length > 0 ? (
            <PeriodFlowChart rows={report.dailySummaries} />
          ) : (
            <EmptyState message="선택 기간에 표시할 일자별 집계가 없습니다." />
          )}
        </ChartPanel>

        <ChartPanel
          title="최근 판매"
          action={
            <div className="flex flex-wrap items-center gap-2">
              <SectionActionLink href={buildSalesHref(report.filters)} />
              <DashboardDetailDialog
                description={`${report.periodLabel} 기준 최근 판매 ${report.recentSales.length}건입니다.`}
                title="최근 판매 상세"
              >
                {report.recentSales.length > 0 ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {report.recentSales.map((row) => (
                      <article
                        key={row.id}
                        className="rounded-[1rem] border border-stone-200 bg-white/90 px-4 py-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-950">
                              {row.customerName}
                            </p>
                            <p className="mt-1 truncate text-[0.76rem] text-slate-500">
                              {row.carrierName} {row.deviceModelName} / {row.saleDate}
                            </p>
                            <p className="mt-1 text-[0.74rem] text-slate-500">
                              담당자 {row.staffName}
                            </p>
                          </div>
                          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[0.74rem] font-semibold text-amber-800">
                            {formatWon(row.profitAmount)}
                          </span>
                        </div>
                        <div className="mt-3 grid gap-2 text-[0.76rem] font-medium text-slate-600 sm:grid-cols-2">
                          <span className="rounded-[0.85rem] bg-blue-50 px-3 py-2 text-blue-800">
                            수납 {formatWon(row.collectedAmount)}
                          </span>
                          <span className="rounded-[0.85rem] bg-rose-50 px-3 py-2 text-rose-700">
                            미수 {formatWon(row.receivableAmount)}
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">선택 기간에 등록된 최근 판매가 없습니다.</p>
                )}
              </DashboardDetailDialog>
            </div>
          }
          className="min-h-[18rem] xl:h-full"
        >
          {report.recentSales.length > 0 ? (
            <RecentSalesChart rows={report.recentSales} />
          ) : (
            <EmptyState message="선택 기간에 등록된 최근 판매가 없습니다." />
          )}
        </ChartPanel>

        <ChartPanel title="통신사별 개통 추이" className="h-[30rem]">
          {report.carrierTrendSeries.length > 0 ? (
            <CarrierActivationTrendChart series={report.carrierTrendSeries} />
          ) : (
            <EmptyState message="선택 기간에 통신사별 개통 흐름 데이터가 없습니다." />
          )}
        </ChartPanel>
      </section>
      ) : null}
    </div>
  );
}
