import { EmptyState, FormField, SubmitButton } from "@/components/workspace/admin-form-controls";
import {
  ActionChip,
  MetricCard,
  PageIntro,
  Panel,
  TonePill,
} from "@/components/workspace/workspace-primitives";
import {
  buildDashboardQueryString,
  type DashboardAttentionItem,
  type DashboardDailySummary,
  type DashboardFilters,
  type DashboardMetric,
  type DashboardPreset,
  type DashboardRecentSale,
  type DashboardReportData,
  type DashboardStaffSummary,
  getDashboardPresetLabel,
} from "@/lib/dashboard-reporting";
import { formatWon } from "@/lib/formatters";

const attentionToneClassName = {
  amber: "border-amber-200 bg-amber-50/70",
  teal: "border-teal-200 bg-teal-50/70",
  rose: "border-rose-200 bg-rose-50/70",
  slate: "border-slate-200 bg-slate-50/90",
} as const;

const receivableToneMap = {
  UNPAID: "rose",
  PARTIALLY_PAID: "amber",
  PAID: "teal",
} as const;

type ReceivableStatusValue = keyof typeof receivableToneMap;

function getReceivableStatusLabel(status: ReceivableStatusValue) {
  switch (status) {
    case "UNPAID":
      return "미납";
    case "PARTIALLY_PAID":
      return "부분 수납";
    case "PAID":
      return "완납";
  }
}

function buildPresetHref(preset: Exclude<DashboardPreset, "custom">) {
  const searchParams = new URLSearchParams();
  searchParams.set("preset", preset);
  return `/?${searchParams.toString()}`;
}

function buildReceivableHref(saleId: string) {
  const searchParams = new URLSearchParams();
  searchParams.set("saleId", saleId);
  return `/receivables?${searchParams.toString()}`;
}

function buildReportHref(filters: DashboardFilters) {
  return `/reports/summary?${buildDashboardQueryString(filters)}`;
}

function buildCsvHref(filters: DashboardFilters) {
  return `/api/reports/summary?${buildDashboardQueryString(filters)}`;
}

function MetricSection({ metrics }: { metrics: DashboardMetric[] }) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {metrics.map((metric) => (
        <MetricCard key={metric.label} {...metric} />
      ))}
    </section>
  );
}

function FilterPanel({ filters }: { filters: DashboardFilters }) {
  const presets: Array<Exclude<DashboardPreset, "custom">> = [
    "today",
    "7d",
    "30d",
    "month",
  ];

  return (
    <Panel
      title="조회 기간"
      description="오늘 숫자는 상단 카드에서 고정으로 보여주고, 아래 보고는 선택 기간 기준으로 다시 계산합니다."
    >
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => {
          const active = filters.preset === preset;

          return (
            <a
              key={preset}
              href={buildPresetHref(preset)}
              className={[
                "rounded-full border px-4 py-2 text-sm font-semibold transition",
                active
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-950/10 bg-white text-slate-700 hover:border-amber-400 hover:bg-amber-50",
              ].join(" ")}
            >
              {getDashboardPresetLabel(preset)}
            </a>
          );
        })}
      </div>

      <form className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]" method="get">
        <input name="preset" type="hidden" value="custom" />
        <FormField
          defaultValue={filters.dateFrom}
          label="시작일"
          name="dateFrom"
          type="date"
        />
        <FormField
          defaultValue={filters.dateTo}
          label="종료일"
          name="dateTo"
          type="date"
        />
        <div className="flex items-end">
          <SubmitButton className="w-full justify-center" label="기간 적용" />
        </div>
      </form>
    </Panel>
  );
}

function AttentionList({ items }: { items: DashboardAttentionItem[] }) {
  if (items.length === 0) {
    return <EmptyState message="현재 확인이 필요한 운영 항목이 없습니다." />;
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item.title}
          className={[
            "rounded-[1.35rem] border p-4",
            attentionToneClassName[item.tone],
          ].join(" ")}
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
  );
}

function StaffSummaryTable({ rows }: { rows: DashboardStaffSummary[] }) {
  if (rows.length === 0) {
    return <EmptyState message="선택 기간에 집계할 판매와 수납 데이터가 없습니다." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-[0.2em] text-slate-400">
          <tr>
            <th className="pb-3 font-semibold">담당자</th>
            <th className="pb-3 font-semibold">판매</th>
            <th className="pb-3 font-semibold">판매 금액</th>
            <th className="pb-3 font-semibold">수납 금액</th>
            <th className="pb-3 font-semibold">총이익</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200/80">
          {rows.map((row) => (
            <tr key={row.staffId}>
              <td className="py-4 pr-4 align-top">
                <p className="font-semibold text-slate-950">{row.staffName}</p>
                <p className="mt-1 text-xs text-slate-500">
                  추가 수납 {formatWon(row.additionalPaymentAmount)}
                </p>
              </td>
              <td className="py-4 pr-4 align-top text-slate-700">
                {row.salesCount}건
              </td>
              <td className="py-4 pr-4 align-top font-medium text-slate-800">
                {formatWon(row.salesAmount)}
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
  );
}

function DailySummaryTable({ rows }: { rows: DashboardDailySummary[] }) {
  if (rows.length === 0) {
    return <EmptyState message="선택 기간에 표시할 날짜별 실적이 없습니다." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-[0.2em] text-slate-400">
          <tr>
            <th className="pb-3 font-semibold">일자</th>
            <th className="pb-3 font-semibold">판매</th>
            <th className="pb-3 font-semibold">판매 금액</th>
            <th className="pb-3 font-semibold">수납 금액</th>
            <th className="pb-3 font-semibold">총이익</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200/80">
          {rows.map((row) => (
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
              <td className="py-4 pr-4 align-top font-medium text-slate-800">
                {formatWon(row.salesAmount)}
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
  );
}

function RecentSalesTable({ rows }: { rows: DashboardRecentSale[] }) {
  if (rows.length === 0) {
    return <EmptyState message="선택 기간에 등록된 판매가 없습니다." />;
  }

  return (
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
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="py-4 pr-4 align-top">
                <p className="font-semibold text-slate-950">{row.customerName}</p>
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
                      label={getReceivableStatusLabel(row.receivableStatus)}
                      tone={receivableToneMap[row.receivableStatus]}
                    />
                  ) : (
                    <TonePill label="미수 없음" tone="slate" />
                  )}
                  {row.receivableAmount > 0 ? (
                    <a
                      className="text-xs font-semibold text-teal-700 underline underline-offset-4"
                      href={buildReceivableHref(row.id)}
                    >
                      미수 보기
                    </a>
                  ) : null}
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
  );
}

export interface DashboardOverviewProps {
  report: DashboardReportData;
}

export function DashboardOverview({ report }: DashboardOverviewProps) {
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageIntro
        eyebrow="Dashboard"
        title="오늘 숫자와 기간 보고를 한 화면에서 봅니다."
        description={`${report.periodLabel} 기준으로 판매, 수납, 리베이트, 정책 수익, 총이익을 다시 계산합니다. 상단 카드는 오늘 현황과 현재 미수 잔액을, 하단 패널은 선택 기간 보고와 운영 체크 항목을 보여줍니다.`}
        actions={
          <>
            <ActionChip
              label={`기준 기간 ${report.periodLabel}`}
              tone="dark"
            />
            <ActionChip
              label={`현재 미수 ${report.summary.currentReceivableCount}건`}
            />
            <a
              className="inline-flex rounded-full border border-slate-950/10 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-amber-400 hover:bg-amber-50"
              href={buildReportHref(report.filters)}
            >
              인쇄용 보고서
            </a>
            <a
              className="inline-flex rounded-full border border-slate-950/10 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-amber-400 hover:bg-amber-50"
              href={buildCsvHref(report.filters)}
            >
              CSV 다운로드
            </a>
          </>
        }
      />

      <FilterPanel filters={report.filters} />
      <MetricSection metrics={report.metrics} />

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel
          title="운영 체크"
          description="미수금, 수납 진행, 재고 대기 상태처럼 바로 봐야 하는 운영 신호를 추렸습니다."
        >
          <AttentionList items={report.attentionItems} />
        </Panel>

        <Panel
          title="담당자 요약"
          description="선택 기간 기준 판매 건수, 수납 금액, 총이익을 담당자 단위로 묶었습니다."
        >
          <StaffSummaryTable rows={report.staffSummaries} />
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel
          title="기간 흐름"
          description="하루 단위 판매, 수납, 총이익 변화를 확인합니다."
        >
          <DailySummaryTable rows={report.dailySummaries} />
        </Panel>

        <Panel
          title="최근 판매"
          description="선택 기간의 최신 판매를 미수 상태와 함께 확인합니다."
        >
          <RecentSalesTable rows={report.recentSales} />
        </Panel>
      </section>
    </div>
  );
}
