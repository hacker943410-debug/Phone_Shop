import type { Metadata } from "next";

import { ReportPrintButton } from "@/components/dashboard/report-print-button";
import { EmptyState } from "@/components/workspace/admin-form-controls";
import { ActionChip, Panel, TonePill } from "@/components/workspace/workspace-primitives";
import { requireCurrentUser } from "@/lib/auth/dal";
import { getDashboardReportData } from "@/lib/dashboard-reporting";
import { formatWon } from "@/lib/formatters";

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
      return "부분 수납";
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
  }>;
}) {
  const currentUser = await requireCurrentUser();
  const report = await getDashboardReportData(await searchParams);
  const reportQuery = `preset=${report.filters.preset}&dateFrom=${report.filters.dateFrom}&dateTo=${report.filters.dateTo}`;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,rgba(251,245,233,0.96)_0%,rgba(245,238,228,1)_100%)] px-4 py-6 print:bg-white print:px-0 print:py-0">
      <div className="mx-auto max-w-6xl space-y-6 rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-[0_28px_90px_-50px_rgba(15,23,42,0.35)] print:rounded-none print:border-none print:p-0 print:shadow-none sm:p-8">
        <header className="space-y-4 border-b border-slate-200 pb-6 print:pb-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.35em] text-amber-700">
                Summary Report
              </p>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-4xl">
                  PhoneShop 기간 운영 보고서
                </h1>
                <p className="text-sm leading-7 text-slate-600">
                  {report.periodLabel} 기준 판매, 수납, 미수금 현황을 한 번에 인쇄할 수 있는 요약 보고서입니다.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <ActionChip label={`작성자 ${currentUser.displayName}`} tone="dark" />
                <ActionChip label={`생성일 ${report.generatedAt}`} />
                <ActionChip label={`현재 미수 ${report.summary.currentReceivableCount}건`} />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 print:hidden">
              <a
                className="inline-flex rounded-full border border-slate-950/10 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-amber-400 hover:bg-amber-50"
                href={`/?${reportQuery}`}
              >
                대시보드로 돌아가기
              </a>
              <a
                className="inline-flex rounded-full border border-slate-950/10 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-amber-400 hover:bg-amber-50"
                href={`/api/reports/summary?${reportQuery}`}
              >
                CSV 다운로드
              </a>
              <ReportPrintButton />
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-[1.5rem] border border-slate-950/8 bg-stone-50/80 p-4">
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
          <article className="rounded-[1.5rem] border border-slate-950/8 bg-stone-50/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
              수납 금액
            </p>
            <p className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-slate-950">
              {formatWon(report.summary.periodCollectedAmount)}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              즉시 수납 {formatWon(report.summary.periodInitialReceivedAmount)} / 추가 수납{" "}
              {formatWon(report.summary.periodAdditionalPaymentAmount)}
            </p>
          </article>
          <article className="rounded-[1.5rem] border border-slate-950/8 bg-stone-50/80 p-4">
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
          <article className="rounded-[1.5rem] border border-slate-950/8 bg-stone-50/80 p-4">
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

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Panel
            title="날짜별 요약"
            description="선택 기간 동안 일자별 판매와 수납 흐름을 표로 정리했습니다."
          >
            {report.dailySummaries.length === 0 ? (
              <EmptyState message="선택 기간에 표시할 날짜별 실적이 없습니다." />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    <tr>
                      <th className="pb-3 font-semibold">일자</th>
                      <th className="pb-3 font-semibold">판매</th>
                      <th className="pb-3 font-semibold">수납 금액</th>
                      <th className="pb-3 font-semibold">총이익</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80">
                    {report.dailySummaries.map((row) => (
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          <Panel
            title="운영 체크"
            description="보고 시점에 같이 확인해야 할 운영 포인트입니다."
          >
            <ul className="space-y-3">
              {report.attentionItems.map((item) => (
                <li
                  key={item.title}
                  className="rounded-[1.35rem] border border-slate-950/8 bg-stone-50/85 p-4"
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
        </section>

        <Panel
          title="최근 판매 상세"
          description="선택 기간의 최신 판매와 미수 상태를 같이 출력합니다."
        >
          {report.recentSales.length === 0 ? (
            <EmptyState message="선택 기간에 등록된 판매가 없습니다." />
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
      </div>
    </main>
  );
}
