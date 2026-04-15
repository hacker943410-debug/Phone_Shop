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
  SalesRebatePolicyRecord,
  SalesRecord,
  SalesSaleProfitPolicyRecord,
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

const noticeMessageMap: Record<SalesNotice, string> = {
  "invalid-sale-form":
    "판매 등록 값이 비어 있거나 올바르지 않습니다. 고객, 재고, 금액 입력값을 다시 확인해 주세요.",
  "sale-customer-not-found":
    "선택한 고객을 찾지 못했습니다. 고객 목록에서 다시 선택한 뒤 재시도해 주세요.",
  "sale-inventory-unavailable":
    "선택한 재고는 지금 판매할 수 없습니다. 이미 판매되었거나 출고 처리되었는지 확인해 주세요.",
  "sale-rate-plan-mismatch":
    "선택한 요금제가 현재 재고 통신사와 맞지 않습니다.",
  "sale-service-mismatch":
    "선택한 부가서비스 중 현재 통신사에서 사용할 수 없는 항목이 있습니다.",
  "sale-overpayment":
    "수납 금액 합계가 최종 판매가를 초과했습니다. 결제 입력값을 다시 확인해 주세요.",
  "sale-discount-rule-missing":
    "할인 적용을 선택했지만 매칭 정책이나 수동 할인값이 없습니다.",
  "sale-not-found":
    "대상 판매 건을 찾지 못했습니다. 목록에서 다시 확인한 뒤 재시도해 주세요.",
  "sale-cancel-blocked":
    "수납 이력이 있는 판매 건은 취소할 수 없습니다.",
};

const editorCardClassName =
  "rounded-[1.4rem] border border-stone-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(245,243,239,0.96)_100%)] p-4 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.24)]";

function appendSalesFilterParams(
  searchParams: URLSearchParams,
  filters: SalesFilters,
) {
  if (filters.q) {
    searchParams.set("q", filters.q);
  }

  if (filters.carrierId) {
    searchParams.set("carrierId", filters.carrierId);
  }

  if (filters.storeId) {
    searchParams.set("storeId", filters.storeId);
  }

  if (filters.status !== "all") {
    searchParams.set("status", filters.status);
  }
}

function buildSalesHref(filters: SalesFilters, page: number) {
  const searchParams = new URLSearchParams();

  appendSalesFilterParams(searchParams, filters);

  if (page > 1) {
    searchParams.set("page", String(page));
  }

  const query = searchParams.toString();
  return query ? `/sales?${query}` : "/sales";
}

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
  children: React.ReactNode;
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
  currentUserName: string;
  defaultSaleDate: string;
  notice: SalesNotice | null;
  filters: SalesFilters;
  pagination: SalesPagination;
  metrics: SalesMetrics;
  customers: SalesCustomerRecord[];
  stores: SalesStoreRecord[];
  carriers: SalesCarrierRecord[];
  rebatePolicies: SalesRebatePolicyRecord[];
  saleProfitPolicies: SalesSaleProfitPolicyRecord[];
  discountPolicies: SalesDiscountPolicyRecord[];
  availableInventory: SalesAvailableInventoryRecord[];
  sales: SalesRecord[];
}

export function SalesOverview({
  currentUserName,
  defaultSaleDate,
  notice,
  filters,
  pagination,
  metrics,
  customers,
  stores,
  carriers,
  rebatePolicies,
  saleProfitPolicies,
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
    rebatePolicies.length + saleProfitPolicies.length + discountPolicies.length;
  const filterTone =
    filters.status === "all"
      ? "slate"
      : filters.status === "COMPLETED"
        ? "teal"
        : "rose";

  return (
    <div className="space-y-5 p-4 sm:p-5 lg:p-6">
      <PageIntro
        eyebrow="Sales"
        title="판매 이력과 취소 처리를 빠르게 정리합니다"
        actions={
          <>
            <ActionChip label={`담당 ${currentUserName}`} tone="dark" />
            <ActionChip label={`조회 ${pagination.totalCount}건`} />
            <SalesLauncher
              availableInventory={availableInventory}
              carriers={carriers}
              currentUserName={currentUserName}
              customers={customers}
              defaultSaleDate={defaultSaleDate}
              discountPolicies={discountPolicies}
              rebatePolicies={rebatePolicies}
              saleProfitPolicies={saleProfitPolicies}
            />
          </>
        }
      />

      {notice ? <NoticeBanner message={noticeMessageMap[notice]} /> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="판매 가능 재고"
          value={`${availableInventory.length}대`}
          helper="즉시 판매 가능한 재고"
          accent="amber"
        />
        <MetricCard
          label="활성 요금제 / 서비스"
          value={`${activeRatePlanCount} / ${activeServiceCount}`}
          helper="현재 기준으로 적용 중"
          accent="teal"
        />
        <MetricCard
          label="필터 완료 매출"
          value={formatWon(metrics.completedRevenue)}
          helper={`완료 ${metrics.completedCount}건`}
          accent="slate"
        />
        <MetricCard
          label="미수 진행 건"
          value={`${metrics.outstandingCount}건`}
          helper={`정책 ${totalPolicyCount}건 연결`}
          accent="amber"
        />
      </section>

      <Panel title="판매 조회 필터">
        <div className={`${editorCardClassName} space-y-3`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-950">
                상태는 완료 판매와 취소 이력을 구분합니다.
              </p>
              <p className="text-sm text-slate-500">
                날짜와 적용 버튼은 제거했고, 값이 바뀌면 필터가 자동으로 반영됩니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <TonePill label={`전체 ${pagination.totalCount}건`} tone="slate" />
              <TonePill
                label={`상태 ${getSalesStatusFilterLabel(filters.status)}`}
                tone={filterTone}
              />
              {filters.carrierId ? (
                <TonePill label="통신사 필터 적용" tone="teal" />
              ) : null}
              {filters.storeId ? (
                <TonePill label="매장 필터 적용" tone="teal" />
              ) : null}
            </div>
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

      <Panel title="판매 이력">
        <div className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-950">
                기본 행은 한 줄 요약만 유지하고, 나머지 정보는 상세 모달에서 확인합니다.
              </p>
              <p className="text-sm text-slate-500">
                페이지당 최대 10건씩 표시합니다.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 rounded-[1rem] border border-stone-200 bg-stone-50/90 px-3 py-2">
              <span className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                아이콘 안내
              </span>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                <LegendIcon className="border-blue-200 bg-blue-50 text-blue-700">
                  <DetailIcon />
                </LegendIcon>
                <span>상세 보기</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                <LegendIcon className="border-rose-200 bg-rose-50 text-rose-700">
                  <CancelIcon />
                </LegendIcon>
                <span>판매 취소</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                <LegendIcon className="border-teal-200 bg-teal-50 text-teal-700">
                  <CustomerIcon />
                </LegendIcon>
                <span>고객 정보 보기</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                <LegendIcon className="border-amber-200 bg-amber-50 text-amber-700">
                  <StaffIcon />
                </LegendIcon>
                <span>담당자 보기</span>
              </div>
            </div>
          </div>

          <SalesPaginationControls
            buildHref={(page) => buildSalesHref(filters, page)}
            itemLabel="건"
            pagination={pagination}
          />

          {sales.length > 0 ? (
            <SalesHistoryTable sales={sales} />
          ) : (
            <EmptyState message="조건에 맞는 판매 이력이 없습니다." />
          )}
        </div>
      </Panel>
    </div>
  );
}
