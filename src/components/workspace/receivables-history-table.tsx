"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import {
  cancelPaymentAction,
  recordPaymentAction,
} from "@/app/actions/receivables";
import {
  CurrencyField,
  EmptyState,
  FormField,
  FormSelect,
  FormTextArea,
  SubmitButton,
} from "@/components/workspace/admin-form-controls";
import { ConfirmSubmitButton } from "@/components/workspace/confirm-submit-button";
import { ListPaginationControls } from "@/components/workspace/list-pagination-controls";
import type {
  PaymentMethodValue,
  ReceivablePaymentRecord,
  ReceivableRecord,
  ReceivablesFilters,
} from "@/components/workspace/receivables-types";
import { WorkspaceModalShell } from "@/components/workspace/workspace-modal-shell";
import { TonePill } from "@/components/workspace/workspace-primitives";
import {
  dangerButtonClassName,
  joinClassNames,
  secondaryButtonClassName,
} from "@/components/workspace/ui-classnames";
import { formatKstDate } from "@/lib/date-utils";
import { formatWon } from "@/lib/formatters";
import type { PaginationState } from "@/lib/pagination";
import { buildReceivablesHref } from "@/lib/receivables-url-state";

type ReceivableModalMode = "detail" | "history" | "register";

const receivableToneMap = {
  UNPAID: "rose",
  PARTIALLY_PAID: "amber",
  PAID: "teal",
} as const;

const paymentToneMap = {
  COMPLETED: "teal",
  CANCELED: "slate",
} as const;

const paymentMethodLabelMap: Record<PaymentMethodValue, string> = {
  CASH: "현금",
  CARD: "카드",
  BANK_TRANSFER: "계좌이체",
};

function getReceivableStatusLabel(status: ReceivableRecord["status"]) {
  switch (status) {
    case "UNPAID":
      return "미납";
    case "PARTIALLY_PAID":
      return "부분 수납";
    case "PAID":
      return "완납";
  }
}

function getPaymentStatusLabel(status: ReceivablePaymentRecord["status"]) {
  return status === "COMPLETED" ? "완료" : "취소";
}

function getPaymentAuditSummary(payment: ReceivablePaymentRecord) {
  return `수납 ${formatKstDate(payment.paymentDate)} / 등록 ${formatKstDate(
    payment.createdAt,
  )} / 담당 ${payment.staffName}`;
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
      className={joinClassNames(
        "inline-flex h-8 w-8 items-center justify-center rounded-full border",
        className,
      )}
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

function HistoryIcon() {
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

function RegisterIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 20 20">
      <path
        d="M4.25 7.25h11.5a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 1-1.5 1.5H4.25a1.5 1.5 0 0 1-1.5-1.5v-5a1.5 1.5 0 0 1 1.5-1.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M10 5v4M8 7h4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function ActionIconButton({
  disabled = false,
  icon,
  label,
  onClick,
  tone,
}: {
  disabled?: boolean;
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  tone: "amber" | "slate" | "teal";
}) {
  const toneClassName =
    tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300 hover:bg-amber-100"
      : tone === "teal"
        ? "border-teal-200 bg-teal-50 text-teal-700 hover:border-teal-300 hover:bg-teal-100"
        : "border-stone-200 bg-stone-100 text-stone-700 hover:border-stone-300 hover:bg-stone-200";

  return (
    <button
      aria-label={label}
      className={joinClassNames(
        "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border transition duration-150 hover:-translate-y-px",
        toneClassName,
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

export interface ReceivablesHistoryTableProps {
  defaultPaymentDate: string;
  filters: ReceivablesFilters;
  pagination: PaginationState;
  records: ReceivableRecord[];
}

export function ReceivablesHistoryTable({
  defaultPaymentDate,
  filters,
  pagination,
  records,
}: ReceivablesHistoryTableProps) {
  const router = useRouter();
  const [activeModal, setActiveModal] = useState<{
    mode: ReceivableModalMode;
    recordId: string;
  } | null>(null);

  const activeRecord = useMemo(
    () =>
      activeModal
        ? records.find((record) => record.id === activeModal.recordId) ?? null
        : null,
    [activeModal, records],
  );

  useEffect(() => {
    if (!activeModal) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveModal(null);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeModal]);

  function openModal(recordId: string, mode: ReceivableModalMode) {
    setActiveModal({ mode, recordId });
  }

  function closeModal() {
    setActiveModal(null);
  }

  async function handlePaymentCreate(formData: FormData) {
    await recordPaymentAction(formData);
    closeModal();
    router.refresh();
  }

  async function handlePaymentCancel(formData: FormData) {
    await cancelPaymentAction(formData);
    router.refresh();
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-end gap-3">
          <div className="hidden">
            <p className="text-sm font-semibold text-slate-950">
              상세, 수납 이력, 수납 등록을 각각 아이콘 모달로 분리했습니다.
            </p>
            <p className="text-sm text-slate-500">
              목록은 요약만 보여주고 실제 처리는 모달 안에서 바로 이어집니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 rounded-[0.95rem] border border-stone-200 bg-stone-50/90 px-3 py-1.5">
            <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
              아이콘 안내
            </span>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <LegendIcon className="border-amber-200 bg-amber-50 text-amber-700">
                <DetailIcon />
              </LegendIcon>
              <span>미수금 상세</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <LegendIcon className="border-stone-200 bg-stone-100 text-stone-700">
                <HistoryIcon />
              </LegendIcon>
              <span>수납 이력</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <LegendIcon className="border-teal-200 bg-teal-50 text-teal-700">
                <RegisterIcon />
              </LegendIcon>
              <span>수납 등록</span>
            </div>
          </div>
        </div>

        <ListPaginationControls
          buildHref={(page) => buildReceivablesHref(filters, { page })}
          itemLabel="건"
          pagination={pagination}
        />

        {records.length > 0 ? (
          <div className="overflow-x-auto rounded-[1.25rem] border border-stone-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(245,243,239,0.98)_100%)] p-1.5 shadow-[0_24px_50px_-38px_rgba(15,23,42,0.22)]">
            <table className="min-w-full border-separate border-spacing-y-1.5 text-left text-sm">
              <thead className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="px-3 pb-1 font-semibold">고객</th>
                  <th className="px-3 pb-1 font-semibold">판매건</th>
                  <th className="px-3 pb-1 font-semibold">상태</th>
                  <th className="px-3 pb-1 font-semibold">잔액</th>
                  <th className="px-3 pb-1 font-semibold">수납</th>
                  <th className="px-3 pb-1 text-right font-semibold">액션</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr
                    key={record.id}
                    className="group rounded-[1rem] bg-white shadow-[0_14px_28px_-28px_rgba(15,23,42,0.3)] transition duration-150 hover:-translate-y-px hover:shadow-[0_20px_34px_-28px_rgba(180,83,9,0.22)]"
                  >
                    <td className="rounded-l-[0.95rem] border-y border-l border-stone-200 px-3 py-2.5 align-middle">
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-950">{record.customerName}</p>
                        <p className="text-xs text-slate-500">{record.customerPhone}</p>
                      </div>
                    </td>
                    <td className="border-y border-stone-200 px-3 py-2.5 align-middle text-slate-700">
                      <div className="space-y-1">
                        <p className="font-medium">{record.saleSummary}</p>
                        <p className="text-xs text-slate-500">
                          {formatKstDate(record.saleDate)}
                          {record.storeName ? ` / ${record.storeName}` : ""}
                          {` / 담당 ${record.staffName}`}
                        </p>
                      </div>
                    </td>
                    <td className="border-y border-stone-200 px-3 py-2.5 align-middle">
                      <TonePill
                        label={getReceivableStatusLabel(record.status)}
                        tone={receivableToneMap[record.status]}
                      />
                    </td>
                    <td className="border-y border-stone-200 px-3 py-2.5 align-middle">
                      <div className="space-y-1">
                        <p className="font-semibold text-slate-950">
                          {formatWon(record.balanceAmount)}
                        </p>
                        <p className="text-xs text-slate-500">
                          원금 {formatWon(record.originalAmount)}
                        </p>
                      </div>
                    </td>
                    <td className="border-y border-stone-200 px-3 py-2.5 align-middle text-slate-600">
                      {record.payments.length}건
                    </td>
                    <td className="rounded-r-[0.95rem] border-y border-r border-stone-200 px-3 py-2.5 align-middle">
                      <div className="flex items-center justify-end gap-2">
                        <ActionIconButton
                          icon={<DetailIcon />}
                          label={`${record.customerName} 미수금 상세`}
                          onClick={() => openModal(record.id, "detail")}
                          tone="amber"
                        />
                        <ActionIconButton
                          icon={<HistoryIcon />}
                          label={`${record.customerName} 수납 이력`}
                          onClick={() => openModal(record.id, "history")}
                          tone="slate"
                        />
                        <ActionIconButton
                          disabled={record.balanceAmount <= 0}
                          icon={<RegisterIcon />}
                          label={
                            record.balanceAmount > 0
                              ? `${record.customerName} 수납 등록`
                              : `${record.customerName} 완납`
                          }
                          onClick={() => openModal(record.id, "register")}
                          tone="teal"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="조건에 맞는 미수금 내역이 없습니다." />
        )}
      </div>

      {activeRecord && activeModal?.mode === "detail" ? (
        <WorkspaceModalShell
          maxWidthClassName="max-w-4xl"
          onClose={closeModal}
          subtitle="Receivable Detail"
          title={`${activeRecord.customerName} 미수금 상세`}
        >
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
              <SummaryCard
                label="판매일"
                value={formatKstDate(activeRecord.saleDate)}
              />
              <SummaryCard
                label="현재 상태"
                value={getReceivableStatusLabel(activeRecord.status)}
              />
              <SummaryCard
                label="누적 수납"
                value={formatWon(activeRecord.paidAmount)}
              />
              <SummaryCard
                label="잔액"
                value={formatWon(activeRecord.balanceAmount)}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <section className="rounded-[1rem] border border-stone-200 bg-white/90 p-4">
                <h4 className="text-sm font-semibold text-slate-950">고객 / 판매 정보</h4>
                <div className="mt-3">
                  <InfoRow label="고객명" value={activeRecord.customerName} />
                  <InfoRow label="연락처" value={activeRecord.customerPhone} />
                  <InfoRow label="통신사" value={activeRecord.carrierName} />
                  <InfoRow label="기종" value={activeRecord.deviceModelName} />
                  <InfoRow
                    label="판매 요약"
                    value={activeRecord.saleSummary}
                  />
                  <InfoRow
                    label="매장"
                    value={activeRecord.storeName ?? "미지정"}
                  />
                  <InfoRow label="담당자" value={activeRecord.staffName} />
                </div>
              </section>

              <section className="rounded-[1rem] border border-stone-200 bg-white/90 p-4">
                <h4 className="text-sm font-semibold text-slate-950">금액 요약</h4>
                <div className="mt-3">
                  <InfoRow
                    label="원금"
                    value={formatWon(activeRecord.originalAmount)}
                  />
                  <InfoRow
                    label="누적 수납"
                    value={formatWon(activeRecord.paidAmount)}
                  />
                  <InfoRow
                    label="잔액"
                    value={formatWon(activeRecord.balanceAmount)}
                  />
                  <InfoRow
                    label="등록일"
                    value={formatKstDate(activeRecord.createdAt)}
                  />
                  <InfoRow
                    label="메모"
                    value={activeRecord.memo ?? "메모 없음"}
                  />
                </div>
              </section>
            </div>
          </div>
        </WorkspaceModalShell>
      ) : null}

      {activeRecord && activeModal?.mode === "history" ? (
        <WorkspaceModalShell
          maxWidthClassName="max-w-4xl"
          onClose={closeModal}
          subtitle="Payment History"
          title={`${activeRecord.customerName} 수납 이력`}
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <TonePill
                label={getReceivableStatusLabel(activeRecord.status)}
                tone={receivableToneMap[activeRecord.status]}
              />
              <TonePill
                label={`수납 ${activeRecord.payments.length}건`}
                tone="slate"
              />
              <TonePill
                label={`잔액 ${formatWon(activeRecord.balanceAmount)}`}
                tone={activeRecord.balanceAmount > 0 ? "amber" : "teal"}
              />
            </div>

            {activeRecord.payments.length > 0 ? (
              <div className="space-y-3">
                {activeRecord.payments.map((payment) => (
                  <article
                    key={payment.id}
                    className="rounded-[1rem] border border-stone-200 bg-white/90 px-4 py-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-950">
                            {formatWon(payment.amount)}
                          </p>
                          <TonePill
                            label={getPaymentStatusLabel(payment.status)}
                            tone={paymentToneMap[payment.status]}
                          />
                        </div>
                        <p className="text-sm text-slate-500">
                          {paymentMethodLabelMap[payment.method]} /{" "}
                          {getPaymentAuditSummary(payment)}
                        </p>
                        <p className="text-sm leading-6 text-slate-600">
                          {payment.memo ?? "메모 없음"}
                        </p>
                        {payment.status === "CANCELED" ? (
                          <div className="rounded-[1rem] border border-stone-200 bg-stone-50 px-3 py-3 text-sm leading-6 text-slate-600">
                            <p>
                              취소일{" "}
                              {payment.canceledAt
                                ? formatKstDate(payment.canceledAt)
                                : "-"}
                            </p>
                            <p>취소 담당 {payment.canceledByName ?? "확인 불가"}</p>
                            <p>취소 사유 {payment.cancellationReason ?? "사유 없음"}</p>
                          </div>
                        ) : null}
                      </div>

                      {payment.status === "COMPLETED" ? (
                        <form action={handlePaymentCancel} className="w-full max-w-xs space-y-2">
                          <input type="hidden" name="paymentId" value={payment.id} />
                          <input
                            className="min-h-11 w-full rounded-[1rem] border border-stone-300 bg-[linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(248,246,242,0.98)_100%)] px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-[border-color,box-shadow,background-color,transform] duration-150 ease-out hover:border-amber-300 hover:bg-white focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-100"
                            name="cancellationReason"
                            placeholder="취소 사유(필수)"
                            required
                            type="text"
                          />
                          <ConfirmSubmitButton
                            className={`${dangerButtonClassName} h-10 px-4`}
                            confirmMessage="이 수납 이력을 취소하시겠습니까?"
                          >
                            수납 취소
                          </ConfirmSubmitButton>
                        </form>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState message="아직 등록된 수납 이력이 없습니다." />
            )}
          </div>
        </WorkspaceModalShell>
      ) : null}

      {activeRecord && activeModal?.mode === "register" ? (
        <WorkspaceModalShell
          maxWidthClassName="max-w-3xl"
          onClose={closeModal}
          subtitle="Record Payment"
          title={`${activeRecord.customerName} 수납 등록`}
        >
          {activeRecord.balanceAmount > 0 ? (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <SummaryCard
                  label="판매 요약"
                  value={activeRecord.saleSummary}
                />
                <SummaryCard
                  label="누적 수납"
                  value={formatWon(activeRecord.paidAmount)}
                />
                <SummaryCard
                  label="잔액"
                  value={formatWon(activeRecord.balanceAmount)}
                />
              </div>

              <form
                action={handlePaymentCreate}
                className="grid gap-3 rounded-[1rem] border border-stone-200 bg-white/90 px-4 py-4 md:grid-cols-2"
              >
                <input type="hidden" name="receivableId" value={activeRecord.id} />
                <FormField
                  defaultValue={defaultPaymentDate}
                  label="수납일"
                  name="paymentDate"
                  required
                  type="date"
                />
                <FormSelect
                  defaultValue="BANK_TRANSFER"
                  label="수납 수단"
                  name="method"
                >
                  <option value="BANK_TRANSFER">계좌이체</option>
                  <option value="CARD">카드</option>
                  <option value="CASH">현금</option>
                </FormSelect>
                <CurrencyField
                  label="수납 금액"
                  max={activeRecord.balanceAmount}
                  name="amount"
                  placeholder={String(activeRecord.balanceAmount)}
                  required
                />
                <div className="rounded-[1rem] border border-stone-200 bg-stone-50 px-4 py-3">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    입력 한도
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {formatWon(activeRecord.balanceAmount)}
                  </p>
                </div>
                <FormTextArea
                  label="메모"
                  name="memo"
                  placeholder="분할 수납 약속, 계좌 확인 메모"
                  rows={3}
                  wrapperClassName="md:col-span-2"
                />
                <div className="md:col-span-2 flex justify-end gap-2">
                  <button
                    className={`${secondaryButtonClassName} h-10 px-4`}
                    onClick={closeModal}
                    type="button"
                  >
                    닫기
                  </button>
                  <SubmitButton label="수납 등록" />
                </div>
              </form>
            </div>
          ) : (
            <div className="rounded-[1rem] border border-teal-200 bg-teal-50 px-4 py-4 text-sm leading-6 text-teal-900">
              이 건은 이미 완납 처리되었습니다. 수납 취소가 필요하면 수납 이력 모달에서
              완료된 수납 내역을 취소해 주세요.
            </div>
          )}
        </WorkspaceModalShell>
      ) : null}
    </>
  );
}
