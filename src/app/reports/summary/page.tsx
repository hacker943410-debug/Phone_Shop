import type { Metadata } from "next";

import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import {
  CarrierSalesCountChart,
  PeriodFlowChart,
  ReceivableHealthChart,
  StaffSummaryBarChart,
  StorePerformanceChart,
} from "@/components/dashboard/dashboard-visuals";
import { ReportPrintButton } from "@/components/dashboard/report-print-button";
import { EmptyState } from "@/components/workspace/admin-form-controls";
import { secondaryButtonClassName } from "@/components/workspace/ui-classnames";
import {
  ActionChip,
  MetricCard,
  PageIntro,
  Panel,
  TonePill,
} from "@/components/workspace/workspace-primitives";
import { requireCurrentUser } from "@/lib/auth/dal";
import {
  buildDashboardQueryString,
  getDashboardReportData,
} from "@/lib/dashboard-reporting";
import type { DashboardReportData } from "@/lib/dashboard-reporting-types";
import { formatWon } from "@/lib/formatters";
import { buildSalesHref } from "@/lib/sales-url-state";

export const metadata: Metadata = {
  title: "상세 리포트",
};

function getReceivableTone(status: "UNPAID" | "PARTIALLY_PAID" | "PAID") {
  switch (status) {
    case "UNPAID":
      return "rose";
    case "PARTIALLY_PAID":
      return "amber";
    case "PAID":
      return "teal";
  }
}

function getReceivableLabel(status: "UNPAID" | "PARTIALLY_PAID" | "PAID") {
  switch (status) {
    case "UNPAID":
      return "미납";
    case "PARTIALLY_PAID":
      return "부분수납";
    case "PAID":
      return "완납";
  }
}

function buildSalesListHref(filters: DashboardReportData["filters"]) {
  return buildSalesHref({
    q: "",
    carrierId: "",
    storeId: filters.storeId,
    status: "all",
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
  });
}

function buildSalesDayHref(
  filters: DashboardReportData["filters"],
  dateInput: string,
) {
  return buildSalesHref(
    {
      q: "",
      carrierId: "",
      storeId: filters.storeId,
      status: "all",
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    },
    {
      dateFrom: dateInput,
      dateTo: dateInput,
    },
  );
}

function ReportActionLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <a className={`${secondaryButtonClassName} h-10 px-4`} href={href}>
      {label}
    </a>
  );
}

function AttentionPanel({ report }: { report: DashboardReportData }) {
  return (
    <Panel
      title="운영 체크"
      description="미수금, 부분수납, 개통 가능 고객처럼 당장 확인할 항목을 묶어서 보여줍니다."
      className="min-h-[22rem]"
    >
      <ul className="space-y-3">
        {report.attentionItems.map((item) => (
          <li
            key={item.title}
            className="rounded-[1rem] border border-stone-200 bg-stone-50/80 p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="font-semibold text-slate-950">{item.title}</p>
                <p className="text-sm leading-6 text-slate-600">{item.detail}</p>
              </div>
              <TonePill label={item.badge} tone={item.tone} />
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function ReceivableFocusPanel({ report }: { report: DashboardReportData }) {
  return (
    <Panel
      title="미수금 우선 확인"
      description="현재 열린 미수금 중 잔액이 큰 순서대로 정렬해 후속 수납 대상을 빠르게 확인합니다."
    >
      {report.receivableSnapshots.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-[0.72rem] uppercase tracking-[0.18em] text-slate-400">
              <tr>
                <th className="pb-3 font-semibold">고객</th>
                <th className="pb-3 font-semibold">판매</th>
                <th className="pb-3 text-right font-semibold">잔액</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {report.receivableSnapshots.map((row) => (
                <tr key={`${row.customerName}:${row.deviceModelName}`} className="hover:bg-stone-50/80">
                  <td className="py-3.5 pr-4 align-top font-semibold text-slate-950">
                    {row.customerName}
                  </td>
                  <td className="py-3.5 pr-4 align-top text-slate-700">
                    {row.carrierName} {row.deviceModelName}
                  </td>
                  <td className="py-3.5 align-top text-right font-semibold text-rose-700">
                    {formatWon(row.balanceAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState message="현재 필터 기준으로 추적할 미수금이 없습니다." />
      )}
    </Panel>
  );
}

function DailySummaryPanel({ report }: { report: DashboardReportData }) {
  const visibleDailySummaries = report.dailySummaries.filter((row) => row.salesCount > 0);

  return (
    <Panel
      title="일자별 요약"
      description="일자 단위로 판매, 수금, 이익을 확인하고 바로 해당 일자의 판매 목록으로 내려갈 수 있습니다."
      className="min-h-[24rem]"
    >
      {visibleDailySummaries.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-[0.72rem] uppercase tracking-[0.18em] text-slate-400">
              <tr>
                <th className="pb-3 font-semibold">일자</th>
                <th className="pb-3 font-semibold">판매</th>
                <th className="pb-3 font-semibold">수납 금액</th>
                <th className="pb-3 font-semibold">총이익</th>
                <th className="pb-3 text-right font-semibold">연결</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {visibleDailySummaries.map((row) => (
                <tr key={row.date} className="hover:bg-stone-50/80">
                  <td className="py-3.5 pr-4 align-top">
                    <p className="font-semibold text-slate-950">{row.date}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      리베이트 {formatWon(row.rebateAmount)} / 정책 수익{" "}
                      {formatWon(row.policyRevenueAmount)}
                    </p>
                  </td>
                  <td className="py-3.5 pr-4 align-top text-slate-700">
                    {row.salesCount}건
                  </td>
                  <td className="py-3.5 pr-4 align-top font-medium text-teal-800">
                    {formatWon(row.collectedAmount)}
                  </td>
                  <td className="py-3.5 align-top font-medium text-amber-800">
                    {formatWon(row.profitAmount)}
                  </td>
                  <td className="py-3.5 align-top text-right">
                    <a
                      className={`${secondaryButtonClassName} print:hidden h-8 px-3 text-[0.76rem]`}
                      href={buildSalesDayHref(report.filters, row.date)}
                    >
                      판매 보기
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState message="선택 기간에 표시할 일자별 집계가 없습니다." />
      )}
    </Panel>
  );
}

function RecentSalesPanel({ report }: { report: DashboardReportData }) {
  return (
    <Panel
      title="최근 판매 상세"
      description="선택 기간 내 최근 등록된 판매를 기준으로 수금, 미수, 이익 상태를 한 번에 확인합니다."
      className="min-h-[24rem]"
    >
      {report.recentSales.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-[0.72rem] uppercase tracking-[0.18em] text-slate-400">
              <tr>
                <th className="pb-3 font-semibold">고객</th>
                <th className="pb-3 font-semibold">판매</th>
                <th className="pb-3 font-semibold">수납</th>
                <th className="pb-3 font-semibold">미수</th>
                <th className="pb-3 font-semibold">총이익</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {report.recentSales.map((row) => (
                <tr key={row.id} className="hover:bg-stone-50/80">
                  <td className="py-3.5 pr-4 align-top">
                    <p className="font-semibold text-slate-950">{row.customerName}</p>
                    <p className="mt-1 text-xs text-slate-500">{row.staffName}</p>
                  </td>
                  <td className="py-3.5 pr-4 align-top">
                    <p className="font-medium text-slate-800">
                      {row.carrierName} {row.deviceModelName}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{row.saleDate}</p>
                  </td>
                  <td className="py-3.5 pr-4 align-top font-medium text-teal-800">
                    {formatWon(row.collectedAmount)}
                  </td>
                  <td className="py-3.5 pr-4 align-top">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-slate-700">
                        {formatWon(row.receivableAmount)}
                      </span>
                      {row.receivableStatus ? (
                        <TonePill
                          label={getReceivableLabel(row.receivableStatus)}
                          tone={getReceivableTone(row.receivableStatus)}
                        />
                      ) : (
                        <TonePill label="미수 없음" tone="slate" />
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 align-top font-medium text-amber-800">
                    {formatWon(row.profitAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState message="선택 기간에 등록된 최근 판매가 없습니다." />
      )}
    </Panel>
  );
}

function RetentionTable({ report }: { report: DashboardReportData }) {
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
                    <TonePill
                      label={row.kindLabel}
                      tone={row.kindLabel === "유지 만료" ? "amber" : "slate"}
                    />
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

export default async function SummaryReportPage({
  searchParams,
}: {
  searchParams: Promise<{
    preset?: string | string[];
    dateFrom?: string | string[];
    dateTo?: string | string[];
    storeId?: string | string[];
    staffId?: string | string[];
  }>;
}) {
  const currentUser = await requireCurrentUser();
  const report = await getDashboardReportData(await searchParams);
  const reportQuery = buildDashboardQueryString(report.filters);
  const salesHref = buildSalesListHref(report.filters);
  const hasReceivableHealthChart = report.receivableHealthBuckets.some(
    (bucket) => bucket.balanceAmount > 0,
  );

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,rgba(248,244,236,0.96)_0%,rgba(241,237,229,1)_100%)] px-4 py-4 print:bg-white print:px-0 print:py-0">
      <div className="mx-auto flex w-full max-w-[min(1840px,calc(100vw-2rem))] flex-col gap-4 rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-[0_28px_90px_-50px_rgba(15,23,42,0.28)] print:rounded-none print:border-none print:p-0 print:shadow-none sm:p-6">
        <PageIntro
          title="상세 리포트"
          actions={
            <div className="flex flex-wrap gap-2 print:hidden">
              <ReportActionLink href={`/?${reportQuery}`} label="대시보드" />
              <ReportActionLink href={`/api/reports/summary?${reportQuery}`} label="CSV" />
              <ReportActionLink
                href={`/api/reports/summary/pdf?${reportQuery}`}
                label="PDF"
              />
              <ReportActionLink href={salesHref} label="판매 목록" />
              <ReportPrintButton />
            </div>
          }
        />

        <section className="flex flex-wrap gap-2 border-b border-slate-200 pb-4 print:pb-3">
          <ActionChip label={`작성자 ${currentUser.displayName}`} tone="dark" />
          <ActionChip label={`기준 기간 ${report.periodLabel}`} />
          <ActionChip label={`생성일 ${report.generatedAt}`} />
          <ActionChip label={`현재 미수 ${report.summary.currentReceivableCount}건`} />
          <ActionChip label={`유지 만료 예정 ${report.retentionTopCustomers.length}건`} />
        </section>

        <div className="print:hidden">
          <DashboardFilterBar
            filters={report.filters}
            staffs={report.availableStaffs}
            stores={report.availableStores}
          />
        </div>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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

        <section className="grid gap-3 2xl:grid-cols-12 2xl:items-start">
          <Panel
            title="매장별 매출 실적"
            description="조회된 매장 수에 따라 높이가 조정되며 매출, 수금, 이익을 함께 비교합니다."
            className="2xl:col-span-7 min-h-[24rem]"
            contentClassName="h-auto"
          >
            {report.storeSummaries.length > 0 ? (
              <StorePerformanceChart rows={report.storeSummaries} />
            ) : (
              <EmptyState message="현재 필터 기준으로 매장 실적 데이터가 없습니다." />
            )}
          </Panel>

          <Panel
            title="직원별 실적 비교"
            description="판매, 수금, 이익 관점에서 직원별 실적 기여를 상세 분석용으로 분리해 보여줍니다."
            className="2xl:col-span-5 min-h-[24rem]"
            contentClassName="h-auto"
          >
            {report.staffSummaries.length > 0 ? (
              <StaffSummaryBarChart rows={report.staffSummaries} />
            ) : (
              <EmptyState message="현재 필터 기준으로 직원 실적 데이터가 없습니다." />
            )}
          </Panel>

          <Panel
            title="기간별 흐름"
            description="선택 기간 동안 매출, 수금, 순이익 흐름을 동시에 비교합니다."
            className="2xl:col-span-7 min-h-[22rem]"
            contentClassName="h-[17rem]"
          >
            {report.dailySummaries.length > 0 ? (
              <PeriodFlowChart rows={report.dailySummaries} />
            ) : (
              <EmptyState message="현재 필터 기준으로 기간 흐름 데이터가 없습니다." />
            )}
          </Panel>

          <Panel
            title="통신사별 판매 건수"
            description="필터 기간 동안 어떤 통신사 판매가 집중됐는지 판매 건수 기준으로 빠르게 확인합니다."
            className="2xl:col-span-5 min-h-[22rem]"
            contentClassName="h-[17rem]"
          >
            {report.carrierTrendSeries.length > 0 ? (
              <CarrierSalesCountChart series={report.carrierTrendSeries} />
            ) : (
              <EmptyState message="현재 필터 기준으로 통신사 판매 데이터가 없습니다." />
            )}
          </Panel>

          <Panel
            title="미수금 건전성"
            description="미수금 생성 후 경과 일수 기준으로 현재 잔액 분포를 차트 중심으로 확인합니다."
            className="2xl:col-span-6 min-h-[24rem]"
            contentClassName="h-[20rem]"
          >
            {hasReceivableHealthChart ? (
              <ReceivableHealthChart buckets={report.receivableHealthBuckets} />
            ) : (
              <div className="flex h-full items-center justify-center rounded-[1rem] border border-dashed border-stone-200 bg-stone-50/70">
                <div className="text-center">
                  <p className="text-[1.6rem] font-semibold tracking-[-0.05em] text-slate-950">
                    {formatWon(report.summary.currentReceivableBalance)}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    현재 열린 미수금이 없습니다.
                  </p>
                </div>
              </div>
            )}
          </Panel>

          <AttentionPanel report={report} />
        </section>

        <section className="grid gap-3 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <DailySummaryPanel report={report} />
          <ReceivableFocusPanel report={report} />
        </section>

        <RecentSalesPanel report={report} />

        <section className="grid gap-3 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <RetentionTable report={report} />
          <UpcomingScheduleTable report={report} />
        </section>
      </div>
    </main>
  );
}
