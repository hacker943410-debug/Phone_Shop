"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { upsertManualScheduleDialogAction } from "@/app/actions/schedules";
import {
  FormField,
  FormSelect,
  FormTextArea,
  SubmitButton,
} from "@/components/workspace/admin-form-controls";
import {
  dangerButtonClassName,
  secondaryButtonClassName,
} from "@/components/workspace/ui-classnames";
import { WorkspaceMessageModal } from "@/components/workspace/workspace-alert-dialog";
import { WorkspaceModalShell } from "@/components/workspace/workspace-modal-shell";
import {
  buildScheduleUpsertActionState,
} from "@/lib/schedule-upsert-action-state";
import type { ManualScheduleStatusValue } from "@/lib/schedule";

export interface ScheduleDialogCustomerOption {
  id: string;
  label: string;
}

export interface ScheduleDialogSeed {
  id?: string;
  title: string;
  scheduledDate: string;
  status: ManualScheduleStatusValue;
  customerId: string | null;
  memo: string | null;
  saleId: string | null;
  saleCustomerId: string | null;
  saleLabel: string | null;
}

interface ScheduleUpsertDialogProps {
  customerOptions: ScheduleDialogCustomerOption[];
  defaultDateInput: string;
  initialSchedule?: ScheduleDialogSeed | null;
  onClose: () => void;
}

function buildInitialState(
  defaultDateInput: string,
  initialSchedule?: ScheduleDialogSeed | null,
) {
  return buildScheduleUpsertActionState({
    fields: {
      id: initialSchedule?.id ?? "",
      title: initialSchedule?.title ?? "",
      scheduledDate: initialSchedule?.scheduledDate ?? defaultDateInput,
      status: initialSchedule?.status ?? "OPEN",
      customerId: initialSchedule?.customerId ?? "",
      memo: initialSchedule?.memo ?? "",
      saleId: initialSchedule?.saleId ?? "",
      saleCustomerId: initialSchedule?.saleCustomerId ?? "",
    },
  });
}

function getStatusLabel(status: ManualScheduleStatusValue) {
  switch (status) {
    case "OPEN":
      return "진행중";
    case "DONE":
      return "완료";
    case "CANCELED":
      return "취소";
  }
}

export function ScheduleUpsertDialog({
  customerOptions,
  defaultDateInput,
  initialSchedule,
  onClose,
}: ScheduleUpsertDialogProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    upsertManualScheduleDialogAction,
    buildInitialState(defaultDateInput, initialSchedule),
  );
  const isEditMode = Boolean(initialSchedule?.id);

  useEffect(() => {
    if (state.status !== "success") {
      return;
    }

    router.refresh();
    onClose();
  }, [onClose, router, state.status]);

  return (
    <WorkspaceModalShell
      contentClassName="sm:px-6"
      maxWidthClassName="max-w-3xl"
      onClose={onClose}
      subtitle={isEditMode ? "수동 일정 수정" : "수동 일정 등록"}
      title={isEditMode ? "일정 수정" : "일정 등록"}
    >
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="rounded-[1.15rem] border border-stone-200 bg-stone-50/90 px-4 py-3 text-sm leading-6 text-slate-600">
          날짜 기준으로 약속 연락, 매장 방문, 회수 체크 일정을 등록합니다.
        </div>

        {initialSchedule?.saleLabel ? (
          <div className="rounded-[1.15rem] border border-blue-200 bg-blue-50/85 px-4 py-3 text-sm leading-6 text-blue-900">
            연결된 판매 이력: {initialSchedule.saleLabel}
          </div>
        ) : null}

        <form
          action={formAction}
          className="grid gap-4 rounded-[1.4rem] border border-stone-200 bg-white/95 p-5 shadow-[0_20px_44px_-34px_rgba(15,23,42,0.24)] md:grid-cols-2"
        >
          {state.fields.id ? <input name="id" type="hidden" value={state.fields.id} /> : null}
          {state.fields.saleId ? (
            <input name="saleId" type="hidden" value={state.fields.saleId} />
          ) : null}
          {state.fields.saleCustomerId ? (
            <input
              name="saleCustomerId"
              type="hidden"
              value={state.fields.saleCustomerId}
            />
          ) : null}

          <FormField
            autoComplete="off"
            defaultValue={state.fields.title}
            label="제목"
            name="title"
            placeholder="예: 유지기간 만료 전 약속 연락"
            required
            wrapperClassName="md:col-span-2"
          />
          <FormField
            defaultValue={state.fields.scheduledDate}
            label="일정일"
            name="scheduledDate"
            required
            type="date"
          />
          <FormSelect
            defaultValue={state.fields.status}
            label="상태"
            name="status"
          >
            <option value="OPEN">{getStatusLabel("OPEN")}</option>
            <option value="DONE">{getStatusLabel("DONE")}</option>
            <option value="CANCELED">{getStatusLabel("CANCELED")}</option>
          </FormSelect>
          <FormSelect
            defaultValue={state.fields.customerId}
            label="고객"
            name="customerId"
            wrapperClassName="md:col-span-2"
          >
            <option value="">고객 연결 없음</option>
            {customerOptions.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.label}
              </option>
            ))}
          </FormSelect>
          <FormTextArea
            defaultValue={state.fields.memo}
            label="메모"
            name="memo"
            placeholder="상담 메모, 준비할 서류, 미리 전달 사항"
            rows={4}
            wrapperClassName="md:col-span-2"
          />

          <div className="flex flex-wrap items-center justify-between gap-2 md:col-span-2">
            <div>
              {isEditMode ? (
                <button
                  className={`${dangerButtonClassName} h-10 px-4`}
                  disabled={isPending}
                  formNoValidate
                  name="intent"
                  type="submit"
                  value="delete"
                >
                  삭제
                </button>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                className={`${secondaryButtonClassName} h-10 px-4`}
                onClick={onClose}
                type="button"
              >
                닫기
              </button>
              <SubmitButton
                disabled={isPending}
                label={isPending ? "저장 중.." : "일정 저장"}
                name="intent"
                value="save"
              />
            </div>
          </div>
        </form>
      </div>

      <WorkspaceMessageModal
        message={state.status === "error" ? state.message : null}
        signal={state}
        subtitle="Schedule Form"
        title="일정 정보를 확인해 주세요"
        tone="error"
      />
    </WorkspaceModalShell>
  );
}
