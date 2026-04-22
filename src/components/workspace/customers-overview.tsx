import Link from "next/link";
import type { ReactNode } from "react";

import {
  EmptyState,
  NoticeBanner,
} from "@/components/workspace/admin-form-controls";
import { CustomerEditorLauncher } from "@/components/workspace/customer-editor-launcher";
import { CustomersFilterBar } from "@/components/workspace/customers-filter-bar";
import { ListPaginationControls } from "@/components/workspace/list-pagination-controls";
import { QueryModalShell } from "@/components/workspace/query-modal-shell";
import { secondaryButtonClassName } from "@/components/workspace/ui-classnames";
import {
  ActionChip,
  CarrierInlineLabel,
  CarrierTonePill,
  MetricCard,
  PageIntro,
  Panel,
  TonePill,
} from "@/components/workspace/workspace-primitives";
import {
  buildCustomersHref,
  type CustomerModalView,
  type CustomerReceivableFilter,
} from "@/lib/customers-url-state";
import { formatKstDate } from "@/lib/date-utils";
import { formatWon } from "@/lib/formatters";
import type { PaginationState } from "@/lib/pagination";

const surfaceClassName =
  "rounded-[1.25rem] border border-stone-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(245,243,239,0.96)_100%)] p-4 shadow-[0_18px_38px_-34px_rgba(15,23,42,0.24)]";

const noticeMessageMap = {
  "duplicate-phone":
    "같은 연락처의 고객이 이미 존재합니다. 기존 고객을 선택해서 이어서 관리해 주세요.",
  "invalid-customer-form":
    "고객명과 연락처는 필수입니다. 입력값을 다시 확인해 주세요.",
} as const;

const receivableToneMap = {
  UNPAID: "rose",
  PARTIALLY_PAID: "amber",
  PAID: "teal",
} as const;

const receivableStatusLabelMap = {
  UNPAID: "미납",
  PARTIALLY_PAID: "부분 수납",
  PAID: "완납",
} as const;

export interface CustomerCarrierOption {
  id: string;
  name: string;
  isActive: boolean;
}

export interface CustomerListRecord {
  id: string;
  name: string;
  phone: string;
  currentCarrierId: string | null;
  currentCarrierName: string | null;
  salesCount: number;
  receivableBalance: number;
  lastVisitAt: Date | null;
}

export interface CustomerSaleRecord {
  id: string;
  saleDate: Date;
  carrierName: string;
  deviceModelName: string;
  ratePlanName: string | null;
  ratePlanMonthlyFee: number | null;
  finalSalePrice: number;
  receivableAmount: number;
  staffName: string;
  deviceInstallmentPrincipal: number;
  installmentMonths: number | null;
  monthlyInstallmentAmount: number | null;
  remainingInstallmentAmount: number | null;
  remainingInstallmentMonths: number | null;
}

export interface CustomerActiveContractRecord {
  saleDate: Date;
  deviceModelName: string;
  ratePlanName: string | null;
  ratePlanMonthlyFee: number | null;
  deviceInstallmentPrincipal: number;
  installmentMonths: number | null;
  monthlyInstallmentAmount: number | null;
  remainingInstallmentAmount: number | null;
  remainingInstallmentMonths: number | null;
}

export interface CustomerReceivableRecord {
  id: string;
  createdAt: Date;
  originalAmount: number;
  balanceAmount: number;
  status: "UNPAID" | "PARTIALLY_PAID" | "PAID";
  memo: string | null;
  saleDate: Date;
  saleSummary: string;
}

export interface SelectedCustomerRecord {
  id: string;
  name: string;
  phone: string;
  currentCarrierId: string | null;
  currentCarrierName: string | null;
  birthDate: Date | null;
  address: string | null;
  memo: string | null;
  createdAt: Date;
  activeContract: CustomerActiveContractRecord | null;
  sales: CustomerSaleRecord[];
  receivables: CustomerReceivableRecord[];
}

export interface CustomerFilters {
  q: string;
  carrierId: string;
  receivable: CustomerReceivableFilter;
}

export interface CustomerMetrics {
  totalCount: number;
  filteredCount: number;
  outstandingCount: number;
  repeatCustomerCount: number;
  receivableBalance: number;
}

export interface CustomersOverviewProps {
  carriers: CustomerCarrierOption[];
  customers: CustomerListRecord[];
  selectedCustomer: SelectedCustomerRecord | null;
  selectedView: CustomerModalView | null;
  filters: CustomerFilters;
  returnTo: string | null;
  pagination: PaginationState;
  metrics: CustomerMetrics;
  notice: keyof typeof noticeMessageMap | null;
}

function getReceivableStatusLabel(status: CustomerReceivableRecord["status"]) {
  return receivableStatusLabelMap[status];
}

function isSalesRegistrationReturnPath(returnTo: string) {
  return returnTo.startsWith("/sales/new");
}

function getReceivableSummaryTone(balanceAmount: number) {
  return balanceAmount > 0 ? "amber" : "slate";
}

function LegendIcon({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={[
        "inline-flex h-8 w-8 items-center justify-center rounded-full border",
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

function DetailIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 20 20">
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

function SalesIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 20 20">
      <path
        d="M5.5 5.75h9M5.5 10h9M5.5 14.25h5.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
      <circle cx="14.25" cy="14.25" r="2.25" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function ReceivableIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 20 20">
      <path
        d="M4.25 7.25h11.5a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 1-1.5 1.5H4.25a1.5 1.5 0 0 1-1.5-1.5v-5a1.5 1.5 0 0 1 1.5-1.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M6.5 10h7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function ActionIconLink({
  href,
  icon,
  label,
  tone,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  tone: "amber" | "slate" | "teal";
}) {
  const toneClassName =
    tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300 hover:bg-amber-100"
      : tone === "teal"
        ? "border-teal-200 bg-teal-50 text-teal-700 hover:border-teal-300 hover:bg-teal-100"
        : "border-stone-200 bg-stone-100 text-stone-700 hover:border-stone-300 hover:bg-stone-200";

  return (
    <Link
      aria-label={label}
      className={[
        "inline-flex h-8 w-8 items-center justify-center rounded-full border transition duration-150 hover:-translate-y-px",
        toneClassName,
      ].join(" ")}
      href={href}
      prefetch={false}
      title={label}
    >
      {icon}
      <span className="sr-only">{label}</span>
    </Link>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1rem] border border-stone-200 bg-white/90 px-4 py-3">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-stone-100 py-2 last:border-b-0 last:pb-0 first:pt-0">
      <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </span>
      <span className="max-w-[70%] text-right text-sm leading-6 text-slate-700">
        {value}
      </span>
    </div>
  );
}

function CustomerDetailModal({
  closeHref,
  customer,
}: {
  closeHref: string;
  customer: SelectedCustomerRecord;
}) {
  const customerBalance = customer.receivables.reduce(
    (total, receivable) => total + receivable.balanceAmount,
    0,
  );
  const activeContract = customer.activeContract;

  return (
    <QueryModalShell
      closeHref={closeHref}
      maxWidthClassName="max-w-4xl"
      subtitle="Customer Detail"
      title={`${customer.name} 고객 상세`}
    >
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-6">
          <SummaryCard
            label="월 요금제"
            value={
              activeContract?.ratePlanMonthlyFee !== null &&
              activeContract?.ratePlanMonthlyFee !== undefined
                ? formatWon(activeContract.ratePlanMonthlyFee)
                : "미정"
            }
          />
          <SummaryCard
            label="잔여 할부금"
            value={
              activeContract?.remainingInstallmentAmount !== null &&
              activeContract?.remainingInstallmentAmount !== undefined
                ? formatWon(activeContract.remainingInstallmentAmount)
                : "계산 불가"
            }
          />
          <SummaryCard label="통신사" value={customer.currentCarrierName ?? "미정"} />
          <SummaryCard label="최근 판매" value={`${customer.sales.length}건`} />
          <SummaryCard
            label="미수 잔액"
            value={formatWon(customerBalance)}
          />
          <SummaryCard
            label="등록일"
            value={formatKstDate(customer.createdAt)}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-[1rem] border border-stone-200 bg-white/90 p-4">
            <h4 className="text-sm font-semibold text-slate-950">기본 정보</h4>
            <div className="mt-3">
              <InfoRow label="고객명" value={customer.name} />
              <InfoRow label="연락처" value={customer.phone} />
              <InfoRow
                label="생년월일"
                value={customer.birthDate ? formatKstDate(customer.birthDate) : "미입력"}
              />
              <InfoRow label="통신사" value={customer.currentCarrierName ?? "미정"} />
              <InfoRow
                label="주소"
                value={customer.address ?? "미입력"}
              />
            </div>
          </section>

          <section className="rounded-[1rem] border border-stone-200 bg-white/90 p-4">
            <h4 className="text-sm font-semibold text-slate-950">관리 메모</h4>
            <div className="mt-3">
              <InfoRow
                label="반복 고객"
                value={customer.sales.length > 1 ? "예" : "아니오"}
              />
              <InfoRow
                label="미수 건수"
                value={`${customer.receivables.length}건`}
              />
              <InfoRow
                label="메모"
                value={customer.memo ?? "없음"}
              />
            </div>
          </section>
        </div>
      </div>
    </QueryModalShell>
  );
}

function CustomerSalesModal({
  closeHref,
  customer,
}: {
  closeHref: string;
  customer: SelectedCustomerRecord;
}) {
  return (
    <QueryModalShell
      closeHref={closeHref}
      maxWidthClassName="max-w-5xl"
      subtitle="Customer Sales"
      title={`${customer.name} 판매 이력`}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {customer.currentCarrierName ? (
            <CarrierTonePill label={customer.currentCarrierName} fallbackTone="teal" />
          ) : (
            <TonePill label="통신사 미정" tone="teal" />
          )}
          <TonePill label={`판매 ${customer.sales.length}건`} tone="amber" />
        </div>

        {customer.sales.length > 0 ? (
          <div className="space-y-3">
            {customer.sales.map((sale) => (
              <article key={sale.id} className={surfaceClassName}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <CarrierInlineLabel className="shrink-0" label={sale.carrierName} />
                    <p className="min-w-0 truncate font-semibold text-slate-950">
                      {sale.deviceModelName}
                    </p>
                  </div>
                  <span className="text-sm text-slate-500">
                    {formatKstDate(sale.saleDate)}
                  </span>
                </div>
                <div className="mt-3 grid gap-3 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-6">
                  <p>
                    월 요금제{" "}
                    {sale.ratePlanMonthlyFee !== null
                      ? formatWon(sale.ratePlanMonthlyFee)
                      : "미정"}
                  </p>
                  <p>
                    잔여 할부금{" "}
                    {sale.remainingInstallmentAmount !== null
                      ? formatWon(sale.remainingInstallmentAmount)
                      : "계산 불가"}
                  </p>
                  <p>요금제 {sale.ratePlanName ?? "미정"}</p>
                  <p>판매가 {formatWon(sale.finalSalePrice)}</p>
                  <p>미수금 {formatWon(sale.receivableAmount)}</p>
                  <p>담당자 {sale.staffName}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState message="판매 이력이 아직 없습니다." />
        )}
      </div>
    </QueryModalShell>
  );
}

function CustomerReceivablesModal({
  closeHref,
  customer,
}: {
  closeHref: string;
  customer: SelectedCustomerRecord;
}) {
  return (
    <QueryModalShell
      closeHref={closeHref}
      maxWidthClassName="max-w-5xl"
      subtitle="Customer Receivables"
      title={`${customer.name} 미수금 이력`}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {customer.currentCarrierName ? (
            <CarrierTonePill label={customer.currentCarrierName} fallbackTone="teal" />
          ) : (
            <TonePill label="통신사 미정" tone="teal" />
          )}
          <TonePill label={`미수 ${customer.receivables.length}건`} tone="slate" />
        </div>

        {customer.receivables.length > 0 ? (
          <div className="space-y-3">
            {customer.receivables.map((receivable) => (
              <article key={receivable.id} className={surfaceClassName}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold text-slate-950">
                    {receivable.saleSummary}
                  </p>
                  <TonePill
                    label={getReceivableStatusLabel(receivable.status)}
                    tone={receivableToneMap[receivable.status]}
                  />
                </div>
                <div className="mt-3 grid gap-3 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-4">
                  <p>판매일 {formatKstDate(receivable.saleDate)}</p>
                  <p>원금 {formatWon(receivable.originalAmount)}</p>
                  <p>잔액 {formatWon(receivable.balanceAmount)}</p>
                  <p>등록일 {formatKstDate(receivable.createdAt)}</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  메모 {receivable.memo ?? "없음"}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState message="미수금 이력이 없습니다." />
        )}
      </div>
    </QueryModalShell>
  );
}

export function CustomersOverview({
  carriers,
  customers,
  selectedCustomer,
  selectedView,
  filters,
  returnTo,
  pagination,
  metrics,
  notice,
}: CustomersOverviewProps) {
  const customerEditorBaseHref = buildCustomersHref(filters, {
    page: pagination.page,
    returnTo,
  });

  const customerEditorSeed = selectedCustomer
    ? {
        id: selectedCustomer.id,
        name: selectedCustomer.name,
        phone: selectedCustomer.phone,
        currentCarrierId: selectedCustomer.currentCarrierId,
        birthDate: selectedCustomer.birthDate
          ? formatKstDate(selectedCustomer.birthDate)
          : null,
        address: selectedCustomer.address,
        memo: selectedCustomer.memo,
      }
    : null;

  const modalCloseHref = buildCustomersHref(filters, {
    customerId: selectedCustomer?.id ?? null,
    page: pagination.page,
    returnTo,
  });

  return (
    <div className="flex flex-col gap-4 p-3 sm:p-4 2xl:p-5">
      <PageIntro
        eyebrow="Customers"
        title="고객 관리"
        className="shrink-0"
        actions={
          <>
            <ActionChip label={`등록 ${metrics.totalCount}명`} tone="dark" />
            <ActionChip label={`미수 고객 ${metrics.outstandingCount}명`} />
            <CustomerEditorLauncher
              carriers={carriers}
              selectedCustomer={customerEditorSeed}
              successBaseHref={customerEditorBaseHref}
            />
            {returnTo && !isSalesRegistrationReturnPath(returnTo) ? (
              <a
                href={returnTo}
                className={`${secondaryButtonClassName} h-10 px-4`}
              >
                이전 화면
              </a>
            ) : null}
          </>
        }
      />

      <section className="grid shrink-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="등록 고객"
          value={`${metrics.totalCount}명`}
          helper={`현재 조건 ${metrics.filteredCount}명`}
          accent="amber"
        />
        <MetricCard
          label="반복 고객"
          value={`${metrics.repeatCustomerCount}명`}
          helper="판매 이력 2건 이상 고객"
          accent="teal"
        />
        <MetricCard
          label="미수 고객"
          value={`${metrics.outstandingCount}명`}
          helper={`총 잔액 ${formatWon(metrics.receivableBalance)}`}
          accent="slate"
        />
        <MetricCard
          label="선택 고객"
          value={selectedCustomer ? selectedCustomer.name : "-"}
          helper={selectedCustomer?.phone ?? "행 아이콘으로 상세 확인"}
          accent="amber"
        />
      </section>

      {notice ? <NoticeBanner message={noticeMessageMap[notice]} /> : null}

      <Panel title="필터" className="relative z-20 shrink-0">
        <div className={`${surfaceClassName} space-y-3`}>
          <div className="flex flex-wrap gap-2">
            {filters.q ? <TonePill label={`검색 ${filters.q}`} tone="slate" /> : null}
            {filters.carrierId ? <TonePill label="통신사 적용" tone="teal" /> : null}
            {filters.receivable !== "all" ? (
              <TonePill
                label={filters.receivable === "outstanding" ? "미수 보유" : "미수 없음"}
                tone="amber"
              />
            ) : null}
          </div>

          <CustomersFilterBar
            carriers={carriers}
            filters={filters}
            returnTo={returnTo}
          />
        </div>
      </Panel>

      <Panel
        actions={
          <div className="flex flex-wrap items-center gap-2.5 rounded-[0.95rem] border border-stone-200 bg-stone-50/90 px-3 py-1.5">
            <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
              아이콘 안내
            </span>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <LegendIcon className="border-amber-200 bg-amber-50 text-amber-700">
                <DetailIcon />
              </LegendIcon>
              <span>고객 상세</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <LegendIcon className="border-teal-200 bg-teal-50 text-teal-700">
                <SalesIcon />
              </LegendIcon>
              <span>판매 이력</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <LegendIcon className="border-stone-200 bg-stone-100 text-stone-700">
                <ReceivableIcon />
              </LegendIcon>
              <span>미수금 이력</span>
            </div>
          </div>
        }
        contentClassName="space-y-3"
        title="고객 목록"
      >
        <ListPaginationControls
          pagination={pagination}
          itemLabel="명"
          buildHref={(page) =>
            buildCustomersHref(filters, {
              page,
              returnTo,
            })
          }
        />

        {customers.length > 0 ? (
          <div className="overflow-x-auto rounded-[1.25rem] border border-stone-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(245,243,239,0.98)_100%)] p-1.5 shadow-[0_24px_50px_-38px_rgba(15,23,42,0.22)]">
            <table className="min-w-full border-separate border-spacing-y-1.5 text-left text-sm">
              <thead className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="px-3 pb-1 font-semibold">고객</th>
                  <th className="px-3 pb-1 font-semibold">통신사</th>
                  <th className="px-3 pb-1 font-semibold">판매</th>
                  <th className="px-3 pb-1 font-semibold">미수</th>
                  <th className="px-3 pb-1 font-semibold">최근 방문</th>
                  <th className="px-3 pb-1 text-right font-semibold">액션</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => {
                  const isSelected = selectedCustomer?.id === customer.id;

                  return (
                    <tr
                      key={customer.id}
                      className={[
                        "group rounded-[1rem] bg-white shadow-[0_14px_28px_-28px_rgba(15,23,42,0.3)] transition duration-150 hover:-translate-y-px hover:shadow-[0_20px_34px_-28px_rgba(180,83,9,0.22)]",
                        isSelected ? "ring-1 ring-amber-200" : "",
                      ].join(" ")}
                    >
                      <td className="rounded-l-[0.95rem] border-y border-l border-stone-200 px-3 py-2.5 align-middle">
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-950">{customer.name}</p>
                          <p className="text-xs text-slate-500">{customer.phone}</p>
                        </div>
                      </td>
                      <td className="border-y border-stone-200 px-3 py-2.5 align-middle text-slate-600">
                        {customer.currentCarrierName ? (
                          <CarrierTonePill
                            label={customer.currentCarrierName}
                            fallbackTone="teal"
                          />
                        ) : (
                          "미정"
                        )}
                      </td>
                      <td className="border-y border-stone-200 px-3 py-2.5 align-middle text-slate-600">
                        {customer.salesCount}건
                      </td>
                      <td className="border-y border-stone-200 px-3 py-2.5 align-middle">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium text-slate-900 [font-variant-numeric:tabular-nums]">
                            {formatWon(customer.receivableBalance)}
                          </span>
                          <TonePill
                            label={customer.receivableBalance > 0 ? "미수 있음" : "정상"}
                            tone={getReceivableSummaryTone(customer.receivableBalance)}
                          />
                        </div>
                      </td>
                      <td className="border-y border-stone-200 px-3 py-2.5 align-middle text-slate-600">
                        {customer.lastVisitAt ? formatKstDate(customer.lastVisitAt) : "없음"}
                      </td>
                      <td className="rounded-r-[0.95rem] border-y border-r border-stone-200 px-3 py-2.5 align-middle">
                        <div className="flex items-center justify-end gap-2">
                          <ActionIconLink
                            href={buildCustomersHref(filters, {
                              customerId: customer.id,
                              page: pagination.page,
                              returnTo,
                              view: "detail",
                            })}
                            icon={<DetailIcon />}
                            label={`${customer.name} 고객 상세`}
                            tone="amber"
                          />
                          <ActionIconLink
                            href={buildCustomersHref(filters, {
                              customerId: customer.id,
                              page: pagination.page,
                              returnTo,
                              view: "sales",
                            })}
                            icon={<SalesIcon />}
                            label={`${customer.name} 판매 이력`}
                            tone="teal"
                          />
                          <ActionIconLink
                            href={buildCustomersHref(filters, {
                              customerId: customer.id,
                              page: pagination.page,
                              returnTo,
                              view: "receivables",
                            })}
                            icon={<ReceivableIcon />}
                            label={`${customer.name} 미수금 이력`}
                            tone="slate"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="현재 조건에 맞는 고객이 없습니다." />
        )}
      </Panel>

      {selectedCustomer && selectedView === "detail" ? (
        <CustomerDetailModal closeHref={modalCloseHref} customer={selectedCustomer} />
      ) : null}

      {selectedCustomer && selectedView === "sales" ? (
        <CustomerSalesModal closeHref={modalCloseHref} customer={selectedCustomer} />
      ) : null}

      {selectedCustomer && selectedView === "receivables" ? (
        <CustomerReceivablesModal closeHref={modalCloseHref} customer={selectedCustomer} />
      ) : null}
    </div>
  );
}
