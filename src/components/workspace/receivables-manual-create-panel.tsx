"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createManualReceivableAction } from "@/app/actions/receivables";
import {
  CurrencyField,
  FormSelect,
  FormTextArea,
  SubmitButton,
} from "@/components/workspace/admin-form-controls";
import {
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/workspace/ui-classnames";
import {
  Panel,
  TonePill,
} from "@/components/workspace/workspace-primitives";
import {
  WorkspaceModalShell,
  useWorkspaceModalClose,
} from "@/components/workspace/workspace-modal-shell";
import type {
  ReceivableCustomerOption,
  ReceivablesFilters,
} from "@/components/workspace/receivables-types";
import type { PaginationState } from "@/lib/pagination";
import { buildReceivablesHref } from "@/lib/receivables-url-state";

const editorCardClassName =
  "rounded-[1.35rem] border border-stone-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(245,243,239,0.96)_100%)] p-4 shadow-[0_20px_40px_-34px_rgba(15,23,42,0.24)]";

function ManualReceivableCreateDialogContent({
  customers,
  filters,
  pagination,
}: {
  customers: ReceivableCustomerOption[];
  filters: ReceivablesFilters;
  pagination: PaginationState;
}) {
  const router = useRouter();
  const requestClose = useWorkspaceModalClose();

  async function handleCreate(formData: FormData) {
    await createManualReceivableAction(formData);
    router.refresh();
    requestClose?.();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="rounded-[1.15rem] border border-stone-200 bg-stone-50/90 px-4 py-3 text-sm leading-6 text-slate-600">
        기존 고객을 선택한 뒤 미수 금액을 바로 등록합니다. 판매 건이 아직 없더라도
        수동 미수금으로 먼저 기록할 수 있습니다.
      </div>

      <form
        action={handleCreate}
        className="grid gap-4 rounded-[1.4rem] border border-stone-200 bg-white/95 p-5 shadow-[0_20px_44px_-34px_rgba(15,23,42,0.24)] md:grid-cols-2"
      >
        <input
          type="hidden"
          name="returnTo"
          value={buildReceivablesHref(filters, { page: pagination.page })}
        />
        <FormSelect
          label="기존 고객"
          name="customerId"
          required
          wrapperClassName="md:col-span-2"
        >
          <option value="">고객을 선택해 주세요</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name} / {customer.phone}
            </option>
          ))}
        </FormSelect>
        <CurrencyField
          label="미수 금액"
          name="amount"
          placeholder="예: 350000"
          required
        />
        <div className="rounded-[1rem] border border-stone-200 bg-stone-50 px-4 py-3">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
            등록 기준
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            기존 고객 선택 후 금액 직접 입력
          </p>
        </div>
        <FormTextArea
          label="메모"
          name="memo"
          placeholder="입금 약속, 내부 전달 사항"
          rows={4}
          wrapperClassName="md:col-span-2"
        />
        <div className="md:col-span-2 flex justify-end gap-2">
          <button
            className={`${secondaryButtonClassName} h-10 px-4`}
            onClick={requestClose ?? undefined}
            type="button"
          >
            닫기
          </button>
          <SubmitButton label="수동 등록" />
        </div>
      </form>
    </div>
  );
}

export function ReceivablesManualCreatePanel({
  customers,
  filters,
  pagination,
}: {
  customers: ReceivableCustomerOption[];
  filters: ReceivablesFilters;
  pagination: PaginationState;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const canCreate = customers.length > 0;

  return (
    <>
      <Panel
        title="수동 미수금 등록"
        description="인라인 입력 대신 등록 모달에서 기존 고객 기준으로 미수금을 생성합니다."
        actions={
          <button
            className={`${primaryButtonClassName} h-10 px-4`}
            disabled={!canCreate}
            onClick={() => setIsOpen(true)}
            type="button"
          >
            수동 등록
          </button>
        }
      >
        <div className={`${editorCardClassName} space-y-3`}>
          <div className="flex flex-wrap items-center gap-2">
            <TonePill label={`기존 고객 ${customers.length}명`} tone="teal" />
            <TonePill label="금액 직접 입력" tone="amber" />
            <TonePill label="모달 등록 흐름" tone="charcoal" />
          </div>
          <p className="text-sm leading-6 text-slate-600">
            판매 등록 전에도 고객 기준으로 미수금을 먼저 기록할 수 있습니다. 버튼을
            누르면 별도 등록 모달이 열립니다.
          </p>
        </div>
      </Panel>

      {isOpen ? (
        <WorkspaceModalShell
          contentClassName="sm:px-6"
          maxWidthClassName="max-w-3xl"
          onClose={() => setIsOpen(false)}
          subtitle="Manual Receivable"
          title="수동 미수금 등록"
        >
          <ManualReceivableCreateDialogContent
            customers={customers}
            filters={filters}
            pagination={pagination}
          />
        </WorkspaceModalShell>
      ) : null}
    </>
  );
}
