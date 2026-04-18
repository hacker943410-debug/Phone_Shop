import type { Metadata } from "next";

import { ReportPrintButton } from "@/components/dashboard/report-print-button";
import { EmptyState } from "@/components/workspace/admin-form-controls";
import { secondaryButtonClassName } from "@/components/workspace/ui-classnames";
import {
  ActionChip,
  Panel,
  TonePill,
} from "@/components/workspace/workspace-primitives";
import { requireCurrentUser } from "@/lib/auth/dal";
import {
  buildDashboardQueryString,
  getDashboardReportData,
} from "@/lib/dashboard-reporting";
import { formatWon } from "@/lib/formatters";
import { buildSalesHref } from "@/lib/sales-url-state";

export const metadata: Metadata = {
  title: "기간 보고서",
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

export default async function SummaryReportPage({
  searchParams,
}: {
  searchParams: Promise<{
    preset?: string | string[];
    dateFrom?: string | string[];
    dateTo?: string | string[];
    storeId?: string | string[];
  }>;
}) {
  const currentUser = await requireCurrentUser();
  const report = await getDashboardReportData(await searchParams);
  const visibleDailySummaries = report.dailySummaries.filter(
    (row) => row.salesCount > 0,
  );
  const reportQuery = buildDashboardQueryString(report.filters);
  const salesHref = buildSalesHref({
    q: "",
    carrierId: "",
    storeId: report.filters.storeId,
    status: "all",
    dateFrom: report.filters.dateFrom,
    dateTo: report.filters.dateTo,
  });

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,rgba(248,244,236,0.96)_0%,rgba(241,237,229,1)_100%)] px-4 py-4 print:bg-white print:px-0 print:py-0">
      <div className="mx-auto flex w-full max-w-[min(1840px,calc(100vw-2rem))] flex-col gap-4 rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-[0_28px_90px_-50px_rgba(15,23,42,0.28)] print:rounded-none print:border-none print:p-0 print:shadow-none sm:p-6">
        <header className="space-y-3 border-b border-slate-200 pb-4 print:pb-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.35em] text-blue-700">
                Summary Report
              </p>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-4xl">
                  기간 보고서
                </h1>
              </div>
              <div className="flex flex-wrap gap-2">
                <ActionChip label={`작성자 ${currentUser.displayName}`} tone="dark" />
                <ActionChip label={`생성일 ${report.generatedAt}`} />
                <ActionChip label={`현재 미수 ${report.summary.currentReceivableCount}건`} />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 print:hidden">
              <a
                className={`${secondaryButtonClassName} h-10 px-4`}
                href={`/?${reportQuery}`}
              >
                대시보드로 돌아가기
              </a>
              <a
                className={`${secondaryButtonClassName} h-10 px-4`}
                href={`/api/reports/summary?${reportQuery}`}
              >
                CSV 다운로드
              </a>
              <a className={`${secondaryButtonClassName} h-10 px-4`} href={salesHref}>
                판매 목록 보기
              </a>
              <ReportPrintButton />
            </div>
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-lg border border-stone-200 bg-stone-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
              판매 건수
            </p>
            <p className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-slate-950">
              {report.summary.periodSalesCount}건
            </p>
            <p className="mt-2 text-sm text-slate-600">
              판매 금액 {formatWon(report.summary.periodSalesAmount)}
            </p>
          </article>
          <article className="rounded-lg border border-stone-200 bg-stone-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
              수납 금액
            </p>
            <p className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-slate-950">
              {formatWon(report.summary.periodCollectedAmount)}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              즉시 수납 {formatWon(report.summary.periodInitialReceivedAmount)} / 추가
              수납 {formatWon(report.summary.periodAdditionalPaymentAmount)}
            </p>
          </article>
          <article className="rounded-lg border border-stone-200 bg-stone-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
              리베이트 / 정책 수익
            </p>
            <p className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-slate-950">
              {formatWon(
                report.summary.periodRebateAmount +
                  report.summary.periodPolicyRevenueAmount,
              )}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              리베이트 {formatWon(report.summary.periodRebateAmount)} / 정책 수익{" "}
              {formatWon(report.summary.periodPolicyRevenueAmount)}
            </p>
          </article>
          <article className="rounded-lg border border-stone-200 bg-stone-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
              총이익 / 현재 미수
            </p>
            <p className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-slate-950">
              {formatWon(report.summary.periodProfitAmount)}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              현재 미수 {formatWon(report.summary.currentReceivableBalance)}
            </p>
          </article>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,0.94fr)_minmax(320px,0.72fr)_minmax(0,1.18fr)] xl:items-start">
          <Panel
            title="일자별 요약"
          >
            {visibleDailySummaries.length === 0 ? (
              <EmptyState message="선택 기간에 표시할 일자별 집계가 없습니다." />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    <tr>
                      <th className="pb-3 font-semibold">일자</th>
                      <th className="pb-3 font-semibold">판매</th>
                      <th className="pb-3 font-semibold">수납 금액</th>
                      <th className="pb-3 font-semibold">총이익</th>
                      <th className="pb-3 text-right font-semibold">상세</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80">
                    {visibleDailySummaries.map((row) => (
                      <tr key={row.date}>
                        <td className="py-4 pr-4 align-top">
                          <p className="font-semibold text-slate-950">{row.date}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            리베이트 {formatWon(row.rebateAmount)} / 정책 수익{" "}
                            {formatWon(row.policyRevenueAmount)}
                          </p>
                        </td>
                        <td className="py-4 pr-4 align-top text-slate-700">
                          {row.salesCount}건
                        </td>
                        <td className="py-4 pr-4 align-top font-medium text-teal-800">
                          {formatWon(row.collectedAmount)}
                        </td>
                        <td className="py-4 align-top font-medium text-amber-800">
                          {formatWon(row.profitAmount)}
                        </td>
                        <td className="py-4 align-top text-right">
                          <a
                            className={`${secondaryButtonClassName} h-8 px-3 text-[0.76rem]`}
                            href={buildSalesHref(
                              {
                                q: "",
                                carrierId: "",
                                storeId: report.filters.storeId,
                                status: "all",
                                dateFrom: report.filters.dateFrom,
                                dateTo: report.filters.dateTo,
                              },
                              {
                                dateFrom: row.date,
                                dateTo: row.date,
                              },
                            )}
                          >
                            판매 보기
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          <Panel
            title="운영 체크"
          >
            <ul className="space-y-3">
              {report.attentionItems.map((item) => (
                <li
                  key={item.title}
                  className="rounded-lg border border-stone-200 bg-stone-50 p-4"
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

        <Panel
          title="최근 판매 상세"
        >
          {report.recentSales.length === 0 ? (
            <EmptyState message="선택 기간에 등록된 최근 판매가 없습니다." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-[0.2em] text-slate-400">
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
                    <tr key={row.id}>
                      <td className="py-4 pr-4 align-top">
                        <p className="font-semibold text-slate-950">
                          {row.customerName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">{row.staffName}</p>
                      </td>
                      <td className="py-4 pr-4 align-top">
                        <p className="font-medium text-slate-800">
                          {row.carrierName} {row.deviceModelName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">{row.saleDate}</p>
                      </td>
                      <td className="py-4 pr-4 align-top font-medium text-teal-800">
                        {formatWon(row.collectedAmount)}
                      </td>
                      <td className="py-4 pr-4 align-top">
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
                      <td className="py-4 align-top font-medium text-amber-800">
                        {formatWon(row.profitAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
        </section>
      </div>
    </main>
  );
}
