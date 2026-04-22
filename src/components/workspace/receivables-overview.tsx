import {
  EmptyState,
  NoticeBanner,
} from "@/components/workspace/admin-form-controls";
import { ReceivablesFilterBar } from "@/components/workspace/receivables-filter-bar";
import { ReceivablesHistoryTable } from "@/components/workspace/receivables-history-table";
import { ReceivablesManualCreatePanel } from "@/components/workspace/receivables-manual-create-panel";
import type {
  ReceivableCarrierOption,
  ReceivableCustomerOption,
  ReceivableRecord,
  ReceivablesFilters,
  ReceivablesMetrics,
  ReceivablesNotice,
} from "@/components/workspace/receivables-types";
import {
  ActionChip,
  MetricCard,
  PageIntro,
  Panel,
  TonePill,
} from "@/components/workspace/workspace-primitives";
import { formatWon } from "@/lib/formatters";
import type { PaginationState } from "@/lib/pagination";

const noticeMessageMap: Record<ReceivablesNotice, string> = {
  "invalid-payment-form":
    "수납 입력값이 비어 있거나 올바르지 않습니다. 수납일, 금액, 메모를 다시 확인해 주세요.",
  "invalid-manual-receivable-form":
    "기존 고객과 미수 금액을 확인해 주세요.",
  "manual-receivable-customer-not-found":
    "선택한 고객을 찾지 못했습니다. 고객 목록을 새로고침한 뒤 다시 시도해 주세요.",
  "receivable-not-found":
    "선택한 미수금 건을 찾지 못했습니다. 목록에서 다시 확인하거나 새로고침해 주세요.",
  "payment-not-found":
    "선택한 수납 이력을 찾지 못했습니다. 이미 취소되었는지 확인해 주세요.",
  "payment-cancel-reason-required":
    "수납 취소 사유를 입력해야 합니다.",
  "payment-over-balance":
    "현재 잔액을 초과하는 수납은 등록할 수 없습니다.",
};

const editorCardClassName =
  "rounded-[1.35rem] border border-stone-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(245,243,239,0.96)_100%)] p-3 shadow-[0_20px_40px_-34px_rgba(15,23,42,0.24)]";

function getStatusFilterLabel(status: ReceivablesFilters["status"]) {
  switch (status) {
    case "UNPAID":
      return "미납";
    case "PARTIALLY_PAID":
      return "부분 수납";
    case "PAID":
      return "완납";
    default:
      return "전체";
  }
}

export interface ReceivablesOverviewProps {
  currentUserName: string;
  defaultPaymentDate: string;
  notice: ReceivablesNotice | null;
  carriers: ReceivableCarrierOption[];
  customers: ReceivableCustomerOption[];
  filters: ReceivablesFilters;
  pagination: PaginationState;
  metrics: ReceivablesMetrics;
  records: ReceivableRecord[];
}

export function ReceivablesOverview({
  currentUserName,
  defaultPaymentDate,
  notice,
  carriers,
  customers,
  filters,
  pagination,
  metrics,
  records,
}: ReceivablesOverviewProps) {
  const filterTone =
    filters.status === "all"
      ? "slate"
      : filters.status === "PAID"
        ? "teal"
        : filters.status === "PARTIALLY_PAID"
          ? "amber"
          : "rose";

  return (
    <div className="flex flex-col gap-3 p-3 sm:p-4 2xl:p-5">
      <PageIntro
        eyebrow="Receivables"
        title="미수금 관리"
        className="shrink-0"
        actions={
          <>
            <ActionChip label={`담당 ${currentUserName}`} tone="dark" />
            <ActionChip label={`조회 ${pagination.totalCount}건`} />
            <ActionChip label={`잔액 ${formatWon(metrics.balanceAmount)}`} />
          </>
        }
      />

      <section className="grid shrink-0 gap-3 sm:grid-cols-2 2xl:grid-cols-4">
        <MetricCard
          accent="amber"
          helper={`현재 필터 ${metrics.filteredCount}건`}
          label="전체 미수금"
          value={`${metrics.totalCount}건`}
        />
        <MetricCard
          accent="amber"
          helper={`총 잔액 ${formatWon(metrics.balanceAmount)}`}
          label="잔액 보유 건"
          value={`${metrics.outstandingCount}건`}
        />
        <MetricCard
          accent="teal"
          helper="일부 수납이 진행된 건"
          label="부분 수납"
          value={`${metrics.partiallyPaidCount}건`}
        />
        <MetricCard
          accent="slate"
          helper="잔액이 0원으로 마감된 건"
          label="완납 처리"
          value={`${metrics.paidCount}건`}
        />
      </section>

      {notice ? <NoticeBanner message={noticeMessageMap[notice]} /> : null}

      <ReceivablesManualCreatePanel
        customers={customers}
        filters={filters}
        pagination={pagination}
      />

      <Panel
        title="필터"
        className="relative z-20 shrink-0"
        contentClassName="space-y-3"
      >
        <div className={`${editorCardClassName} space-y-3`}>
          <div className="flex flex-wrap gap-2">
            <TonePill
              label={`상태 ${getStatusFilterLabel(filters.status)}`}
              tone={filterTone}
            />
            {filters.customerId ? (
              <TonePill label="고객 필터 적용" tone="teal" />
            ) : null}
            {filters.carrierId ? (
              <TonePill label="통신사 필터 적용" tone="teal" />
            ) : null}
            {filters.saleId ? (
              <TonePill label="특정 판매건 기준" tone="amber" />
            ) : null}
          </div>

          <ReceivablesFilterBar
            carriers={carriers}
            customers={customers}
            filters={filters}
          />
        </div>
      </Panel>

      <Panel title="미수금 목록" contentClassName="space-y-3">
        {records.length > 0 ? (
          <div>
            <ReceivablesHistoryTable
              defaultPaymentDate={defaultPaymentDate}
              filters={filters}
              pagination={pagination}
              records={records}
            />
          </div>
        ) : (
          <EmptyState message="조건에 맞는 미수금 건이 없습니다." />
        )}
      </Panel>
    </div>
  );
}
