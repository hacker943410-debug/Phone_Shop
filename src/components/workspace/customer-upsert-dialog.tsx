"use client";

import { useActionState, useEffect } from "react";

import {
  upsertCustomerDialogAction,
} from "@/app/actions/customers";
import {
  FormField,
  FormSelect,
  FormTextArea,
  SubmitButton,
} from "@/components/workspace/admin-form-controls";
import { secondaryButtonClassName } from "@/components/workspace/ui-classnames";
import {
  buildCustomerUpsertActionState,
  type CustomerUpsertActionCustomer,
} from "@/lib/customer-upsert-action-state";
import { WorkspaceModalShell } from "@/components/workspace/workspace-modal-shell";

export interface CustomerUpsertDialogCarrier {
  id: string;
  name: string;
  isActive?: boolean;
}

export interface CustomerUpsertDialogSeed {
  id?: string;
  name: string;
  phone: string;
  currentCarrierId: string | null;
  birthDate: string | null;
  address: string | null;
  memo: string | null;
}

interface CustomerUpsertDialogProps {
  carriers: CustomerUpsertDialogCarrier[];
  description?: string;
  initialCustomer?: CustomerUpsertDialogSeed | null;
  onClose: () => void;
  onSuccess: (customer: CustomerUpsertActionCustomer) => void;
  submitLabel: string;
  subtitle: string;
  title: string;
}

function getCarrierOptionLabel(carrier: CustomerUpsertDialogCarrier) {
  return carrier.isActive === false ? `${carrier.name} (비활성)` : carrier.name;
}

function buildInitialDialogState(initialCustomer?: CustomerUpsertDialogSeed | null) {
  return buildCustomerUpsertActionState({
    fields: {
      id: initialCustomer?.id ?? "",
      name: initialCustomer?.name ?? "",
      phone: initialCustomer?.phone ?? "",
      currentCarrierId: initialCustomer?.currentCarrierId ?? "",
      birthDate: initialCustomer?.birthDate ?? "",
      address: initialCustomer?.address ?? "",
      memo: initialCustomer?.memo ?? "",
    },
  });
}

export function CustomerUpsertDialog({
  carriers,
  description,
  initialCustomer,
  onClose,
  onSuccess,
  submitLabel,
  subtitle,
  title,
}: CustomerUpsertDialogProps) {
  const [state, formAction, isPending] = useActionState(
    upsertCustomerDialogAction,
    buildInitialDialogState(initialCustomer),
  );

  useEffect(() => {
    if (state.status === "success" && state.customer) {
      onSuccess(state.customer);
    }
  }, [onSuccess, state.customer, state.status]);

  return (
    <WorkspaceModalShell
      contentClassName="sm:px-6"
      maxWidthClassName="max-w-3xl"
      onClose={onClose}
      subtitle={subtitle}
      title={title}
    >
      <div className="mx-auto max-w-3xl space-y-4">
        {description ? (
          <div className="rounded-[1.15rem] border border-stone-200 bg-stone-50/90 px-4 py-3 text-sm leading-6 text-slate-600">
            {description}
          </div>
        ) : null}

        <form
          action={formAction}
          className="grid gap-4 rounded-[1.4rem] border border-stone-200 bg-white/95 p-5 shadow-[0_20px_44px_-34px_rgba(15,23,42,0.24)] md:grid-cols-2"
        >
          {state.fields.id ? <input name="id" type="hidden" value={state.fields.id} /> : null}

          <FormField
            autoComplete="off"
            defaultValue={state.fields.name}
            label="고객명"
            name="name"
            required
          />
          <FormField
            autoComplete="off"
            defaultValue={state.fields.phone}
            inputMode="tel"
            label="연락처"
            name="phone"
            placeholder="010-1234-5678"
            required
          />
          <FormSelect
            defaultValue={state.fields.currentCarrierId}
            label="현재 통신사"
            name="currentCarrierId"
          >
            <option value="">미정</option>
            {carriers.map((carrier) => (
              <option key={carrier.id} value={carrier.id}>
                {getCarrierOptionLabel(carrier)}
              </option>
            ))}
          </FormSelect>
          <FormField
            defaultValue={state.fields.birthDate}
            label="생년월일"
            name="birthDate"
            type="date"
          />
          <FormField
            autoComplete="off"
            defaultValue={state.fields.address}
            label="주소"
            name="address"
            placeholder="상세 주소 또는 메모"
            wrapperClassName="md:col-span-2"
          />
          <FormTextArea
            defaultValue={state.fields.memo}
            label="메모"
            name="memo"
            placeholder="상담 메모, 선호 기종, 후속 요청"
            rows={4}
            wrapperClassName="md:col-span-2"
          />

          {state.message ? (
            <div className="md:col-span-2 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-800">
              {state.message}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-end gap-2 md:col-span-2">
            <button
              className={`${secondaryButtonClassName} h-10 px-4`}
              onClick={onClose}
              type="button"
            >
              닫기
            </button>
            <SubmitButton
              disabled={isPending}
              label={isPending ? "저장 중..." : submitLabel}
            />
          </div>
        </form>
      </div>
    </WorkspaceModalShell>
  );
}
