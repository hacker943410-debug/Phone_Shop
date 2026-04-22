import type { ReactNode } from "react";

import { EmptyState, NoticeBanner } from "@/components/workspace/admin-form-controls";
import { SalesFilterBar } from "@/components/workspace/sales-filter-bar";
import { SalesHistoryTable } from "@/components/workspace/sales-history-table";
import { SalesLauncher } from "@/components/workspace/sales-launcher";
import { SalesPaginationControls } from "@/components/workspace/sales-pagination-controls";
import type {
  SalesAvailableInventoryRecord,
  SalesCarrierRecord,
  SalesCustomerRecord,
  SalesDiscountPolicyRecord,
  SalesFilters,
  SalesMetrics,
  SalesNotice,
  SalesPagination,
  SalesRecord,
  SalesAgencyRecord,
  SalesSaleProfitPolicyRecord,
  SalesStaffCommissionPolicyRecord,
  SalesStoreRecord,
} from "@/components/workspace/sales-types";
import {
  ActionChip,
  MetricCard,
  PageIntro,
  Panel,
  TonePill,
} from "@/components/workspace/workspace-primitives";
import { joinClassNames } from "@/components/workspace/ui-classnames";
import { formatWon } from "@/lib/formatters";
import { buildSalesHref } from "@/lib/sales-url-state";

const noticeMessageMap: Record<SalesNotice, string> = {
  "sale-created": "판매가 등록되었습니다. 판매 이력과 재고 상태를 최신 기준으로 반영했습니다.",
  "invalid-sale-form":
    "판매 등록 값이 비어 있거나 올바르지 않습니다. 고객, 재고, 금액 입력값을 다시 확인해 주세요.",
  "sale-customer-not-found":
    "선택한 고객을 찾지 못했습니다. 고객 목록에서 다시 선택하거나 새로고침해 주세요.",
  "sale-inventory-unavailable":
    "선택한 재고는 지금 판매할 수 없습니다. 이미 판매되었거나 출고 처리되었는지 확인해 주세요.",
  "sale-rate-plan-mismatch":
    "선택한 요금제가 현재 재고의 통신사와 맞지 않습니다.",
  "sale-service-mismatch":
    "선택한 부가서비스 중 현재 통신사에서 사용할 수 없는 항목이 있습니다.",
  "sale-overpayment":
    "수납 금액 합계가 최종 판매가를 초과했습니다. 결제 입력값을 다시 확인해 주세요.",
  "sale-discount-rule-missing":
    "할인 적용이 선택됐지만 매핑 정책이나 수동 할인값이 없습니다.",
  "sale-not-found":
    "대상 판매 건을 찾지 못했습니다. 목록에서 다시 확인하거나 새로고침해 주세요.",
  "sale-cancel-blocked":
    "수납 이력이 있는 판매 건은 취소할 수 없습니다.",
};

const editorCardClassName =
  "rounded-[1.35rem] border border-stone-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(245,243,239,0.96)_100%)] p-3 shadow-[0_20px_40px_-34px_rgba(15,23,42,0.24)]";

function getSalesStatusFilterLabel(status: SalesFilters["status"]) {
  switch (status) {
    case "COMPLETED":
      return "완료 판매";
    case "CANCELED":
      return "취소 이력";
    default:
      return "전체 기록";
  }
}

function LegendIcon({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) {
  return (
    <span
      className={joinClassNames(
        "inline-flex h-8 w-8 items-center justify-center rounded-full border",
        className,
      )}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}

function DetailIcon() {
  return (
    <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 20 20">
      <path
        d="M10 4.5c-4 0-6.83 3.15-7.75 5.5.92 2.35 3.75 5.5 7.75 5.5s6.83-3.15 7.75-5.5c-.92-2.35-3.75-5.5-7.75-5.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
      <circle cx="10" cy="10" r="2.25" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function CancelIcon() {
  return (
    <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 20 20">
      <path
        d="M6 6 14 14M14 6l-8 8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function CustomerIcon() {
  return (
    <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 20 20">
      <path
        d="M10 10.5a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5ZM4.75 16c.8-2.3 2.88-3.75 5.25-3.75S14.45 13.7 15.25 16"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function StaffIcon() {
  return (
    <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 20 20">
      <path
        d="M10 3.75 12 7.9l4.6.68-3.3 3.2.78 4.52L10 14.1l-4.08 2.2.78-4.52-3.3-3.2L8 7.9l2-4.15Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export interface SalesOverviewProps {
  currentUserId: string;
  currentUserName: string;
  defaultSaleDate: string;
  notice: SalesNotice | null;
  filters: SalesFilters;
  pagination: SalesPagination;
  metrics: SalesMetrics;
  customers: SalesCustomerRecord[];
  stores: SalesStoreRecord[];
  salesAgencies: SalesAgencyRecord[];
  carriers: SalesCarrierRecord[];
  saleProfitPolicies: SalesSaleProfitPolicyRecord[];
  staffCommissionPolicies: SalesStaffCommissionPolicyRecord[];
  discountPolicies: SalesDiscountPolicyRecord[];
  availableInventory: SalesAvailableInventoryRecord[];
  sales: SalesRecord[];
}

export function SalesOverview({
  currentUserId,
  currentUserName,
  defaultSaleDate,
  notice,
  filters,
  pagination,
  metrics,
  customers,
  stores,
  salesAgencies,
  carriers,
  saleProfitPolicies,
  staffCommissionPolicies,
  discountPolicies,
  availableInventory,
  sales,
}: SalesOverviewProps) {
  const activeRatePlanCount = carriers.reduce(
    (count, carrier) => count + carrier.ratePlans.length,
    0,
  );
  const activeServiceCount = new Set(
    carriers.flatMap((carrier) =>
      carrier.addOnServices.map((service) => service.id),
    ),
  ).size;
  const totalPolicyCount =
    saleProfitPolicies.length + staffCommissionPolicies.length + discountPolicies.length;
  const filterTone =
    filters.status === "all"
      ? "slate"
      : filters.status === "COMPLETED"
        ? "teal"
        : "rose";

  return (
    <div className="flex flex-col gap-3 p-3 sm:p-4 2xl:p-5">
      <PageIntro
        eyebrow="Sales"
        title="판매 관리"
        className="shrink-0"
        actions={
          <>
            <ActionChip label={`담당 ${currentUserName}`} tone="dark" />
            <ActionChip label={`조회 ${pagination.totalCount}건`} />
            <SalesLauncher
              availableInventory={availableInventory}
              carriers={carriers}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              customers={customers}
              defaultSaleDate={defaultSaleDate}
              discountPolicies={discountPolicies}
              salesAgencies={salesAgencies}
              saleProfitPolicies={saleProfitPolicies}
              staffCommissionPolicies={staffCommissionPolicies}
            />
          </>
        }
      />

      <section className="grid shrink-0 gap-3 sm:grid-cols-2 2xl:grid-cols-4">
        <MetricCard
          label="판매 가능 재고"
          value={`${availableInventory.length}대`}
          helper="즉시 판매 가능한 단말 재고"
          accent="amber"
        />
        <MetricCard
          label="요금제 / 부가서비스"
          value={`${activeRatePlanCount} / ${activeServiceCount}`}
          helper="통신사별 판매 매핑 가능 항목"
          accent="teal"
        />
        <MetricCard
          label="완료 매출"
          value={formatWon(metrics.completedRevenue)}
          helper={`완료 ${metrics.completedCount}건`}
          accent="slate"
        />
        <MetricCard
          label="미수 진행"
          value={`${metrics.outstandingCount}건`}
          helper={`정책 ${totalPolicyCount}건 연결`}
          accent="amber"
        />
      </section>

      {notice ? (
        <NoticeBanner
          message={noticeMessageMap[notice]}
          tone={notice === "sale-created" ? "success" : "error"}
        />
      ) : null}

      <Panel
        title="필터"
        className="relative z-20 shrink-0"
        contentClassName="space-y-3"
      >
        <div className={`${editorCardClassName} space-y-3`}>
          <div className="flex flex-wrap gap-2">
            <TonePill
              label={`상태 ${getSalesStatusFilterLabel(filters.status)}`}
              tone={filterTone}
            />
            {filters.storeId ? (
              <TonePill label="매장 필터 적용" tone="teal" />
            ) : null}
            {filters.carrierId ? (
              <TonePill label="통신사 필터 적용" tone="teal" />
            ) : null}
            {filters.dateFrom || filters.dateTo ? (
              <TonePill
                label={`기간 ${filters.dateFrom || "-"} ~ ${filters.dateTo || "-"}`}
                tone="amber"
              />
            ) : null}
          </div>

          <SalesFilterBar
            carriers={carriers.map((carrier) => ({
              id: carrier.id,
              name: carrier.name,
            }))}
            filters={filters}
            stores={stores}
          />
        </div>
      </Panel>

      <Panel
        title="판매 이력"
        contentClassName="space-y-3"
        actions={
          <div className="flex flex-wrap items-center gap-2 rounded-full border border-stone-200 bg-stone-50/90 px-3 py-1.5 text-[0.72rem] font-semibold tracking-[0.02em] text-slate-600">
            <span className="uppercase tracking-[0.18em] text-slate-500">Legend</span>
            <div className="flex items-center gap-1.5">
              <LegendIcon className="border-blue-200 bg-blue-50 text-blue-700">
                <DetailIcon />
              </LegendIcon>
              <span>상세</span>
            </div>
            <div className="flex items-center gap-1.5">
              <LegendIcon className="border-rose-200 bg-rose-50 text-rose-700">
                <CancelIcon />
              </LegendIcon>
              <span>취소</span>
            </div>
            <div className="flex items-center gap-1.5">
              <LegendIcon className="border-teal-200 bg-teal-50 text-teal-700">
                <CustomerIcon />
              </LegendIcon>
              <span>고객</span>
            </div>
            <div className="flex items-center gap-1.5">
              <LegendIcon className="border-amber-200 bg-amber-50 text-amber-700">
                <StaffIcon />
              </LegendIcon>
              <span>담당</span>
            </div>
          </div>
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] border border-stone-200 bg-stone-50/80 px-3.5 py-3">
          <div className="flex flex-wrap gap-2">
            <TonePill label={`현재 페이지 ${pagination.page}`} tone="slate" />
            <TonePill label={`총 ${pagination.totalCount}건`} tone="teal" />
          </div>
          <SalesPaginationControls
            buildHref={(page) => buildSalesHref(filters, { page })}
            itemLabel="건"
            pagination={pagination}
          />
        </div>

        {sales.length > 0 ? (
          <div>
            <SalesHistoryTable
              currentPage={pagination.page}
              filters={filters}
              sales={sales}
            />
          </div>
        ) : (
          <EmptyState message="조건에 맞는 판매 이력이 없습니다." />
        )}
      </Panel>
    </div>
  );
}
