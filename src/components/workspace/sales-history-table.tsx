"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { cancelSaleAction } from "@/app/actions/sales";
import { ConfirmSubmitButton } from "@/components/workspace/confirm-submit-button";
import type { SalesRecord } from "@/components/workspace/sales-types";
import { TonePill } from "@/components/workspace/workspace-primitives";
import {
  dangerButtonClassName,
  joinClassNames,
  secondaryButtonClassName,
} from "@/components/workspace/ui-classnames";
import { formatKstDate } from "@/lib/date-utils";
import { formatWon } from "@/lib/formatters";
import type { SalesUrlFilters } from "@/lib/sales-url-state";
import { buildSalesHref } from "@/lib/sales-url-state";

type DetailMode = "overview" | "cancel";

function getSaleStatusTone(status: SalesRecord["status"]) {
  return status === "COMPLETED" ? "teal" : "rose";
}

function getSaleStatusLabel(status: SalesRecord["status"]) {
  return status === "COMPLETED" ? "판매 완료" : "취소 이력";
}

function getReceivableTone(status: SalesRecord["receivableStatus"]) {
  switch (status) {
    case "UNPAID":
      return "rose";
    case "PARTIALLY_PAID":
      return "amber";
    case "PAID":
      return "teal";
    default:
      return "slate";
  }
}

function getReceivableLabel(status: SalesRecord["receivableStatus"]) {
  switch (status) {
    case "UNPAID":
      return "미수 진행";
    case "PARTIALLY_PAID":
      return "부분 수납";
    case "PAID":
      return "완납";
    default:
      return "미수 없음";
  }
}

function getDiscountLabel(sale: SalesRecord) {
  if (!sale.discountApplied) {
    return "미적용";
  }

  if (sale.discountMethod === "PERCENTAGE") {
    return `${sale.discountValue ?? 0}%`;
  }

  return formatWon(sale.discountValue ?? 0);
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

function CancelIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 20 20">
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
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 20 20">
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
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 20 20">
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

function CloseIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 20 20">
      <path
        d="m5.5 5.5 9 9m0-9-9 9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ActionIconButton({
  label,
  icon,
  tone,
  onClick,
  disabled = false,
}: {
  label: string;
  icon: ReactNode;
  tone: "blue" | "rose";
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      aria-label={label}
      className={joinClassNames(
        "relative z-10 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border transition duration-150",
        tone === "blue"
          ? "border-blue-200 bg-blue-50 text-blue-700 hover:-translate-y-px hover:border-blue-300 hover:bg-blue-100"
          : "border-rose-200 bg-rose-50 text-rose-700 hover:-translate-y-px hover:border-rose-300 hover:bg-rose-100",
        disabled &&
          "cursor-not-allowed border-stone-200 bg-stone-100 text-slate-300 hover:translate-y-0 hover:border-stone-200 hover:bg-stone-100",
      )}
      disabled={disabled}
      onClick={onClick}
      title={label}
      type="button"
    >
      {icon}
      <span className="sr-only">{label}</span>
    </button>
  );
}

function ActionIconLink({
  href,
  label,
  icon,
  tone,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  tone: "amber" | "teal";
}) {
  return (
    <Link
      aria-label={label}
      className={joinClassNames(
        "relative z-10 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border transition duration-150 hover:-translate-y-px",
        tone === "amber"
          ? "border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300 hover:bg-amber-100"
          : "border-teal-200 bg-teal-50 text-teal-700 hover:border-teal-300 hover:bg-teal-100",
      )}
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
  toneClassName = "text-slate-950",
}: {
  label: string;
  value: string;
  toneClassName?: string;
}) {
  return (
    <div className="rounded-[1rem] border border-stone-200 bg-white/90 px-4 py-3">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className={joinClassNames("mt-1 text-sm font-semibold", toneClassName)}>
        {value}
      </p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-stone-100 py-2 last:border-b-0 last:pb-0 first:pt-0">
      <span className="text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </span>
      <span className="max-w-[70%] text-right text-sm leading-6 text-slate-700">
        {value}
      </span>
    </div>
  );
}

function buildCustomerSearchHref(phone: string, returnTo: string) {
  const searchParams = new URLSearchParams();
  searchParams.set("q", phone);
  searchParams.set("returnTo", returnTo);
  return `/customers?${searchParams.toString()}`;
}

export function SalesHistoryTable({
  currentPage,
  filters,
  sales,
}: {
  currentPage: number;
  filters: SalesUrlFilters;
  sales: SalesRecord[];
}) {
  const [activeSaleId, setActiveSaleId] = useState<string | null>(null);
  const [detailMode, setDetailMode] = useState<DetailMode>("overview");
  const cancelInputRef = useRef<HTMLInputElement | null>(null);

  const activeSale = useMemo(
    () => sales.find((sale) => sale.id === activeSaleId) ?? null,
    [activeSaleId, sales],
  );

  useEffect(() => {
    if (!activeSale) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveSaleId(null);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeSale]);

  useEffect(() => {
    if (activeSale && detailMode === "cancel") {
      cancelInputRef.current?.focus();
    }
  }, [activeSale, detailMode]);

  function openSaleDetail(saleId: string, mode: DetailMode) {
    setActiveSaleId(saleId);
    setDetailMode(mode);
  }

  return (
    <>
      <div className="overflow-x-auto rounded-[1.25rem] border border-stone-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(245,243,239,0.98)_100%)] p-1.5 shadow-[0_24px_50px_-38px_rgba(15,23,42,0.22)]">
        <table className="min-w-full border-separate border-spacing-y-1.5 text-left text-sm">
          <thead className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
            <tr>
              <th className="px-3 pb-1 font-semibold">판매일</th>
              <th className="px-3 pb-1 font-semibold">상태</th>
              <th className="px-3 pb-1 font-semibold">고객</th>
              <th className="px-3 pb-1 font-semibold">판매 요약</th>
              <th className="px-3 pb-1 font-semibold">정산</th>
              <th className="px-3 pb-1 text-right font-semibold">액션</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => {
              const returnTo = buildSalesHref(filters, { page: currentPage });
              const customerHref = buildCustomerSearchHref(sale.customerPhone, returnTo);
              const staffHref = buildSalesHref(filters, {
                page: 1,
                q: sale.staffName,
              });
              const saleSummary = `${sale.carrierName} ${sale.deviceModelName}${
                sale.ratePlanName ? ` · ${sale.ratePlanName}` : ""
              }`;

              return (
                <tr
                  key={sale.id}
                  className="group rounded-[1rem] bg-white shadow-[0_14px_28px_-28px_rgba(15,23,42,0.3)] transition duration-150 hover:-translate-y-px hover:shadow-[0_20px_34px_-28px_rgba(37,99,235,0.24)]"
                >
                  <td className="rounded-l-[0.95rem] border-y border-l border-stone-200 px-3 py-2.5 align-middle text-slate-600">
                    <div className="space-y-1">
                      <span className="whitespace-nowrap font-medium">
                        {formatKstDate(new Date(sale.saleDate))}
                      </span>
                      <p className="text-xs text-slate-400">
                        {sale.storeName ?? "미지정 매장"}
                      </p>
                    </div>
                  </td>
                  <td className="border-y border-stone-200 px-3 py-2.5 align-middle">
                    <TonePill
                      label={getSaleStatusLabel(sale.status)}
                      tone={getSaleStatusTone(sale.status)}
                    />
                  </td>
                  <td className="border-y border-stone-200 px-3 py-2.5 align-middle">
                    <span
                      className="block max-w-[15rem] truncate font-semibold text-slate-950"
                      title={`${sale.customerName} · ${sale.customerPhone}`}
                    >
                      {sale.customerName}
                    </span>
                    <span className="mt-1 block max-w-[15rem] truncate text-xs text-slate-500">
                      {sale.customerPhone}
                    </span>
                  </td>
                  <td className="border-y border-stone-200 px-3 py-2.5 align-middle">
                    <span
                      className="block max-w-[21rem] truncate font-medium text-slate-700"
                      title={saleSummary}
                    >
                      {saleSummary}
                    </span>
                  </td>
                  <td className="border-y border-stone-200 px-3 py-2.5 align-middle">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-950">
                        {formatWon(sale.finalSalePrice)}
                      </span>
                      <TonePill
                        label={`${getReceivableLabel(sale.receivableStatus)} ${formatWon(
                          sale.receivableBalance,
                        )}`}
                        tone={getReceivableTone(sale.receivableStatus)}
                      />
                    </div>
                  </td>
                  <td className="relative z-10 rounded-r-[0.95rem] border-y border-r border-stone-200 px-3 py-2.5 align-middle">
                    <div className="flex items-center justify-end gap-2">
                      <ActionIconButton
                        label={`상세 보기 ${sale.customerName}`}
                        icon={<DetailIcon />}
                        onClick={() => openSaleDetail(sale.id, "overview")}
                        tone="blue"
                      />
                      <ActionIconButton
                        label={
                          sale.canCancel
                            ? `판매 취소 ${sale.customerName}`
                            : `취소 불가 ${sale.customerName}`
                        }
                        icon={<CancelIcon />}
                        onClick={() => openSaleDetail(sale.id, "cancel")}
                        tone="rose"
                        disabled={sale.status !== "COMPLETED"}
                      />
                      <ActionIconLink
                        href={customerHref}
                        icon={<CustomerIcon />}
                        label={`고객 정보 보기 ${sale.customerName}`}
                        tone="teal"
                      />
                      <ActionIconLink
                        href={staffHref}
                        icon={<StaffIcon />}
                        label={`담당자 보기 ${sale.staffName}`}
                        tone="amber"
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {activeSale ? (
        <div
          className="dashboard-dialog-backdrop fixed inset-0 z-[70] flex items-end justify-center bg-[rgba(15,23,42,0.42)] px-4 py-6 sm:items-center"
          onClick={() => setActiveSaleId(null)}
        >
          <div
            aria-labelledby="sales-history-detail-title"
            aria-modal="true"
            className="dashboard-dialog-panel flex max-h-[min(84vh,52rem)] w-full max-w-5xl flex-col overflow-hidden rounded-[1.6rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(245,243,239,0.98)_100%)] shadow-[0_42px_90px_-34px_rgba(15,23,42,0.5)] backdrop-blur"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="flex items-start justify-between gap-4 border-b border-stone-200/90 px-5 py-4 sm:px-6">
              <div className="space-y-1.5">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-blue-700">
                  Sale Detail
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <h3
                    className="text-xl font-semibold tracking-[-0.04em] text-slate-950"
                    id="sales-history-detail-title"
                  >
                    {activeSale.customerName} 판매 상세
                  </h3>
                  <TonePill
                    label={getSaleStatusLabel(activeSale.status)}
                    tone={getSaleStatusTone(activeSale.status)}
                  />
                  <TonePill
                    label={getReceivableLabel(activeSale.receivableStatus)}
                    tone={getReceivableTone(activeSale.receivableStatus)}
                  />
                </div>
                <p className="text-sm leading-6 text-slate-600">
                  기본 화면은 한 줄 요약만 유지하고, 세부 정보와 취소 저장은 이 모달에서
                  처리합니다.
                </p>
              </div>

              <button
                aria-label="상세 모달 닫기"
                className={joinClassNames(
                  `${secondaryButtonClassName} h-9 w-9 px-0`,
                  "rounded-full border-stone-200 bg-white text-slate-700",
                )}
                onClick={() => setActiveSaleId(null)}
                type="button"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
              <div className="grid gap-3 md:grid-cols-4">
                <SummaryCard
                  label="판매일"
                  value={formatKstDate(new Date(activeSale.saleDate))}
                />
                <SummaryCard label="매장" value={activeSale.storeName ?? "미지정"} />
                <SummaryCard
                  label="최종 판매가"
                  value={formatWon(activeSale.finalSalePrice)}
                />
                <SummaryCard
                  label="미수 잔액"
                  toneClassName="text-rose-700"
                  value={formatWon(activeSale.receivableBalance)}
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  className={joinClassNames(
                    `${secondaryButtonClassName} h-10 px-4`,
                    detailMode === "overview" &&
                      "border-blue-300 bg-blue-50 text-blue-800",
                  )}
                  onClick={() => setDetailMode("overview")}
                  type="button"
                >
                  상세 정보
                </button>
                <button
                  className={joinClassNames(
                    `${secondaryButtonClassName} h-10 px-4`,
                    detailMode === "cancel" &&
                      "border-rose-300 bg-rose-50 text-rose-800",
                  )}
                  onClick={() => setDetailMode("cancel")}
                  type="button"
                >
                  취소 처리
                </button>
              </div>

              {detailMode === "overview" ? (
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <section className="rounded-[1rem] border border-stone-200 bg-white/90 p-4">
                    <h4 className="text-sm font-semibold text-slate-950">고객 정보</h4>
                    <div className="mt-3">
                      <InfoRow label="고객명" value={activeSale.customerName} />
                      <InfoRow label="연락처" value={activeSale.customerPhone} />
                      <InfoRow label="담당자" value={activeSale.staffName} />
                    </div>
                  </section>

                  <section className="rounded-[1rem] border border-stone-200 bg-white/90 p-4">
                    <h4 className="text-sm font-semibold text-slate-950">판매 상품</h4>
                    <div className="mt-3">
                      <InfoRow
                        label="기기"
                        value={`${activeSale.carrierName} ${activeSale.deviceModelName}`}
                      />
                      <InfoRow
                        label="요금제"
                        value={activeSale.ratePlanName ?? "미선택"}
                      />
                      <InfoRow label="IMEI" value={activeSale.inventoryImei} />
                      <InfoRow
                        label="부가서비스"
                        value={
                          activeSale.selectedServices.length > 0
                            ? activeSale.selectedServices.join(", ")
                            : "없음"
                        }
                      />
                    </div>
                  </section>

                  <section className="rounded-[1rem] border border-stone-200 bg-white/90 p-4">
                    <h4 className="text-sm font-semibold text-slate-950">정산 요약</h4>
                    <div className="mt-3">
                      <InfoRow
                        label="지원금"
                        value={formatWon(activeSale.subsidyAmount)}
                      />
                      <InfoRow label="할인" value={getDiscountLabel(activeSale)} />
                      <InfoRow
                        label="리베이트"
                        value={formatWon(activeSale.rebateAmount)}
                      />
                      <InfoRow
                        label="정책 수익"
                        value={formatWon(activeSale.policyRevenueAmount)}
                      />
                      <InfoRow
                        label="최초 미수"
                        value={formatWon(activeSale.receivableAmount)}
                      />
                    </div>
                  </section>

                  <section className="rounded-[1rem] border border-stone-200 bg-white/90 p-4">
                    <h4 className="text-sm font-semibold text-slate-950">정책 적용 내역</h4>
                    <div className="mt-3">
                      <InfoRow
                        label="할인 정책"
                        value={activeSale.appliedDiscountPolicyName ?? "미적용"}
                      />
                      <InfoRow
                        label="리베이트 정책"
                        value={activeSale.appliedRebatePolicyName ?? "없음"}
                      />
                      <InfoRow
                        label="수익 정책"
                        value={activeSale.appliedSaleProfitPolicyName ?? "없음"}
                      />
                    </div>
                  </section>
                </div>
              ) : (
                <section className="mt-4 rounded-[1rem] border border-rose-200 bg-rose-50/80 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-950">취소 처리</h4>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        취소 사유 입력과 저장은 이 상세 모달 안에서만 처리합니다.
                      </p>
                    </div>
                    {activeSale.status === "CANCELED" ? (
                      <TonePill label="취소 완료" tone="rose" />
                    ) : null}
                  </div>

                  {activeSale.status === "COMPLETED" ? (
                    activeSale.canCancel ? (
                      <form action={cancelSaleAction} className="mt-4 space-y-3">
                        <input type="hidden" name="saleId" value={activeSale.id} />
                        <label className="block space-y-2 text-sm font-medium text-slate-700">
                          <span>취소 사유</span>
                          <input
                            ref={cancelInputRef}
                            className="min-h-11 w-full rounded-[1rem] border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition duration-150 focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                            name="cancellationReason"
                            placeholder="예: 고객 요청 취소, 재고 변경, 입력 오류"
                            type="text"
                          />
                        </label>
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            className={`${secondaryButtonClassName} h-10 px-4`}
                            onClick={() => setActiveSaleId(null)}
                          >
                            닫기
                          </button>
                          <ConfirmSubmitButton
                            confirmMessage="이 판매 건을 취소하시겠습니까?"
                            className={`${dangerButtonClassName} h-10 px-4`}
                          >
                            취소 저장
                          </ConfirmSubmitButton>
                        </div>
                      </form>
                    ) : (
                      <p className="mt-4 text-sm leading-6 text-slate-500">
                        수납 이력이 있는 판매 건은 취소할 수 없습니다.
                      </p>
                    )
                  ) : (
                    <div className="mt-4 space-y-2 text-sm text-slate-600">
                      <p>
                        취소일{" "}
                        {activeSale.canceledAt
                          ? formatKstDate(new Date(activeSale.canceledAt))
                          : "-"}
                      </p>
                      <p>취소 사유 {activeSale.cancellationReason ?? "사유 없음"}</p>
                    </div>
                  )}
                </section>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
