"use client";

import type { ReactNode } from "react";

import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import {
  CarrierSalesCountChart,
  PeriodFlowChart,
  ReceivableHealthChart,
  StaffActivityChart,
  StorePerformanceChart,
} from "@/components/dashboard/dashboard-visuals";
import { EmptyState } from "@/components/workspace/admin-form-controls";
import {
  joinClassNames,
  secondaryButtonClassName,
} from "@/components/workspace/ui-classnames";
import {
  ActionChip,
  MetricCard,
  Panel,
  TonePill,
} from "@/components/workspace/workspace-primitives";
import type { DashboardReportData } from "@/lib/dashboard-reporting-types";
import { formatWon } from "@/lib/formatters";

function buildDashboardQueryString(filters: DashboardReportData["filters"]) {
  const searchParams = new URLSearchParams();
  searchParams.set("preset", filters.preset);
  searchParams.set("dateFrom", filters.dateFrom);
  searchParams.set("dateTo", filters.dateTo);

  if (filters.storeId) {
    searchParams.set("storeId", filters.storeId);
  }

  if (filters.staffId) {
    searchParams.set("staffId", filters.staffId);
  }

  return searchParams.toString();
}

function buildReportHref(filters: DashboardReportData["filters"]) {
  return `/reports/summary?${buildDashboardQueryString(filters)}`;
}

function buildCsvHref(filters: DashboardReportData["filters"]) {
  return `/api/reports/summary?${buildDashboardQueryString(filters)}`;
}

function buildPdfHref(filters: DashboardReportData["filters"]) {
  return `/api/reports/summary/pdf?${buildDashboardQueryString(filters)}`;
}

function ReportIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 20 20">
      <path
        d="M6 3.75h5.8l2.45 2.45V15.5A1.75 1.75 0 0 1 12.5 17.25h-6A1.75 1.75 0 0 1 4.75 15.5v-10A1.75 1.75 0 0 1 6.5 3.75Zm5.25.4V6.5h2.35"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
      <path
        d="M7.25 9h5.5M7.25 11.5h5.5M7.25 14h3.2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.6"
      />
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

function PdfIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 20 20">
      <path
        d="M6.5 3.75h5.75l2.5 2.5v9.25A1.75 1.75 0 0 1 13 17.25H6.5A1.75 1.75 0 0 1 4.75 15.5v-10A1.75 1.75 0 0 1 6.5 3.75Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.55"
      />
      <path
        d="M7.4 13.4V9.1h1.35c.92 0 1.5.57 1.5 1.35 0 .8-.58 1.37-1.5 1.37h-.53v1.57M11.05 13.4V9.1h1.05c1.28 0 2.1.81 2.1 2.14 0 1.35-.82 2.16-2.1 2.16h-1.05ZM8.22 11h.45c.38 0 .62-.24.62-.55s-.24-.53-.62-.53h-.45m3.2 2.58h.48c.72 0 1.14-.47 1.14-1.26s-.42-1.24-1.14-1.24h-.48"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.3"
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
      href={href}
      className={joinClassNames(
        `${secondaryButtonClassName} h-10 gap-2 px-4`,
        "border-stone-200 bg-white text-slate-700",
      )}
    >
      {icon}
      <span>{label}</span>
    </a>
  );
}

function DashboardHero({ report }: { report: DashboardReportData }) {
  const selectedStoreLabel =
    report.availableStores.find((store) => store.id === report.filters.storeId)?.name ??
    "전체 매장";
  const selectedStaffLabel =
    report.availableStaffs.find((staff) => staff.id === report.filters.staffId)?.name ??
    "전체 직원";

  return (
    <section className="dashboard-reveal rounded-[1.3rem] border border-stone-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(245,243,238,0.98)_100%)] px-4 py-3 shadow-[0_24px_48px_-38px_rgba(15,23,42,0.22)] sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <ActionChip label={`조회 기간 ${report.periodLabel}`} tone="dark" />
          <TonePill label={selectedStoreLabel} tone="teal" />
          {report.filters.staffId ? (
            <TonePill label={selectedStaffLabel} tone="slate" />
          ) : null}
          <TonePill
            label={`현재 미수 ${report.summary.currentReceivableCount}건`}
            tone="rose"
          />
          <TonePill
            label={`유지 만료 예정 ${report.retentionTopCustomers.length}건`}
            tone="amber"
          />
          <TonePill
            label={`예정 일정 ${report.upcomingScheduleRows.length}건`}
            tone="slate"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <HeaderActionLink
            href={buildReportHref(report.filters)}
            icon={<ReportIcon />}
            label="상세 리포트"
          />
          <HeaderActionLink
            href={buildCsvHref(report.filters)}
            icon={<DownloadIcon />}
            label="CSV"
          />
          <HeaderActionLink
            href={buildPdfHref(report.filters)}
            icon={<PdfIcon />}
            label="PDF"
          />
        </div>
      </div>
    </section>
  );
}

function MetricGrid({ report }: { report: DashboardReportData }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {report.metrics.map((metric) => (
        <MetricCard
          key={metric.label}
          accent={metric.accent}
          helper={metric.helper}
          label={metric.label}
          value={metric.value}
        />
      ))}
    </section>
  );
}

function ChartPanel({
  title,
  description,
  children,
  className,
  contentClassName,
}: {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <Panel
      title={title}
      description={description}
      className={joinClassNames("min-h-[22rem]", className)}
      contentClassName={joinClassNames("h-[17.5rem]", contentClassName)}
    >
      {children}
    </Panel>
  );
}

function RetentionTopTable({ report }: { report: DashboardReportData }) {
  return (
    <Panel
      title="유지만료예정고객 Top 10"
      description="유지 규칙 기준으로 예정일이 가까운 고객 순으로 정렬합니다."
    >
      {report.retentionTopCustomers.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-[0.72rem] uppercase tracking-[0.18em] text-slate-400">
              <tr>
                <th className="pb-3 font-semibold">고객</th>
                <th className="pb-3 font-semibold">통신사</th>
                <th className="pb-3 font-semibold">마지막 판매</th>
                <th className="pb-3 font-semibold">예정일</th>
                <th className="pb-3 text-right font-semibold">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {report.retentionTopCustomers.map((row) => (
                <tr key={`${row.customerId}:${row.eligibleDate}`} className="hover:bg-stone-50/80">
                  <td className="py-3.5 pr-4 align-top">
                    <p className="font-semibold text-slate-950">{row.customerName}</p>
                    <p className="mt-1 text-xs text-slate-500">{row.ruleLabel}</p>
                  </td>
                  <td className="py-3.5 pr-4 align-top text-slate-700">{row.carrierName}</td>
                  <td className="py-3.5 pr-4 align-top text-slate-600">{row.lastSaleDate}</td>
                  <td className="py-3.5 pr-4 align-top font-medium text-slate-800">
                    {row.eligibleDate}
                  </td>
                  <td className="py-3.5 align-top text-right">
                    <TonePill
                      label={row.daysUntil === 0 ? "D-day" : `D-${row.daysUntil}`}
                      tone={row.daysUntil <= 3 ? "rose" : "amber"}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState message="현재 필터 기준으로 예정된 유지만료 고객이 없습니다." />
      )}
    </Panel>
  );
}

function UpcomingScheduleTable({ report }: { report: DashboardReportData }) {
  return (
    <Panel
      title="예정된 일정 Top 10"
      description="공휴일을 제외한 업무 일정만 표시하며, 수동 일정과 유지 만료 추적이 함께 노출됩니다."
    >
      {report.upcomingScheduleRows.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-[0.72rem] uppercase tracking-[0.18em] text-slate-400">
              <tr>
                <th className="pb-3 font-semibold">일정일</th>
                <th className="pb-3 font-semibold">구분</th>
                <th className="pb-3 font-semibold">고객</th>
                <th className="pb-3 font-semibold">일정 내용</th>
                <th className="pb-3 text-right font-semibold">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {report.upcomingScheduleRows.map((row) => (
                <tr key={row.id} className="hover:bg-stone-50/80">
                  <td className="py-3.5 pr-4 align-top font-medium text-slate-800">
                    {row.dateInput}
                  </td>
                  <td className="py-3.5 pr-4 align-top">
                    <TonePill label={row.kindLabel} tone={row.kindLabel === "유지 만료" ? "amber" : "slate"} />
                  </td>
                  <td className="py-3.5 pr-4 align-top text-slate-700">
                    {row.customerName ?? "-"}
                  </td>
                  <td className="py-3.5 pr-4 align-top">
                    <p className="font-semibold text-slate-950">{row.title}</p>
                    {row.subtitle ? (
                      <p className="mt-1 text-xs leading-5 text-slate-500">{row.subtitle}</p>
                    ) : null}
                  </td>
                  <td className="py-3.5 align-top text-right">
                    <TonePill
                      label={row.statusLabel}
                      tone={row.statusLabel === "D-day" ? "rose" : "teal"}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState message="현재 필터 기준으로 예정된 업무 일정이 없습니다." />
      )}
    </Panel>
  );
}

export interface DashboardOverviewProps {
  report: DashboardReportData;
}

export function DashboardOverview({ report }: DashboardOverviewProps) {
  return (
    <div className="flex flex-col gap-3 p-3 sm:gap-4 sm:p-4 2xl:p-5">
      <DashboardHero report={report} />

      <DashboardFilterBar
        filters={report.filters}
        staffs={report.availableStaffs}
        stores={report.availableStores}
      />

      <MetricGrid report={report} />

      <section>
        <ChartPanel
          title="직원별 업무 처리 건수"
          description="선택 기간 동안 직원별 판매 처리 건수와 추가 수납 처리 건수를 함께 비교합니다."
          className="min-h-[20rem]"
          contentClassName="h-[15.5rem]"
        >
          {report.staffSummaries.length > 0 ? (
            <StaffActivityChart rows={report.staffSummaries} />
          ) : (
            <EmptyState message="현재 필터 기준으로 직원 활동 데이터가 없습니다." />
          )}
        </ChartPanel>
      </section>

      <section className="grid gap-3 xl:grid-cols-12">
        <ChartPanel
          title="매장별 매출 실적"
          description="조회된 매장 수에 맞춰 그래프 높이가 조정되며 매출, 수금, 이익을 한 번에 비교합니다."
          className="xl:col-span-7 min-h-[24rem]"
          contentClassName="h-auto"
        >
          {report.storeSummaries.length > 0 ? (
            <StorePerformanceChart rows={report.storeSummaries} />
          ) : (
            <EmptyState message="현재 필터 기준으로 매장 실적 데이터가 없습니다." />
          )}
        </ChartPanel>

        <ChartPanel
          title="통신사별 판매 건수"
          description="필터 기간 동안 어떤 통신사 판매가 집중됐는지 판매 건수 기준으로 빠르게 확인합니다."
          className="xl:col-span-5"
        >
          {report.carrierTrendSeries.length > 0 ? (
            <CarrierSalesCountChart series={report.carrierTrendSeries} />
          ) : (
            <EmptyState message="현재 필터 기준으로 통신사 판매 데이터가 없습니다." />
          )}
        </ChartPanel>

        <ChartPanel
          title="기간별 흐름"
          description="선택 기간 동안 매출, 수금, 순이익 흐름을 동시에 보여줍니다."
          className="xl:col-span-5"
        >
          {report.dailySummaries.length > 0 ? (
            <PeriodFlowChart rows={report.dailySummaries} />
          ) : (
            <EmptyState message="현재 필터 기준으로 기간 흐름 데이터가 없습니다." />
          )}
        </ChartPanel>

        <ChartPanel
          title="미수금 건전성"
          description="미수금 생성 후 경과 일수 기준으로 현재 잔액을 차트 중심으로 확인합니다."
          className="xl:col-span-7 min-h-[24.5rem]"
          contentClassName="h-[20.5rem]"
        >
          {report.receivableHealthBuckets.some((bucket) => bucket.balanceAmount > 0) ? (
            <ReceivableHealthChart buckets={report.receivableHealthBuckets} />
          ) : (
            <div className="flex h-full items-center justify-center rounded-[1rem] border border-dashed border-stone-200 bg-stone-50/70">
              <div className="text-center">
                <p className="text-[1.6rem] font-semibold tracking-[-0.05em] text-slate-950">
                  {formatWon(report.summary.currentReceivableBalance)}
                </p>
                <p className="mt-2 text-sm text-slate-500">현재 열린 미수금이 없습니다.</p>
              </div>
            </div>
          )}
        </ChartPanel>
      </section>

      <section className="grid gap-3 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <RetentionTopTable report={report} />
        <UpcomingScheduleTable report={report} />
      </section>
    </div>
  );
}
