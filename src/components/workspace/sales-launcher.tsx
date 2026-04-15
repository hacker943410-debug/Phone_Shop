"use client";

import { useEffect, useState, type ReactNode } from "react";

import { upsertCustomerAction } from "@/app/actions/customers";
import {
  FormField,
  FormSelect,
  FormTextArea,
  SubmitButton,
} from "@/components/workspace/admin-form-controls";
import { SalesEntryForm } from "@/components/workspace/sales-entry-form";
import type {
  SalesAvailableInventoryRecord,
  SalesCarrierRecord,
  SalesCustomerRecord,
  SalesDiscountPolicyRecord,
  SalesRebatePolicyRecord,
  SalesSaleProfitPolicyRecord,
} from "@/components/workspace/sales-types";
import {
  joinClassNames,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/workspace/ui-classnames";

type LauncherView = "chooser" | "existing" | "new" | null;

interface SalesLauncherProps {
  availableInventory: SalesAvailableInventoryRecord[];
  carriers: SalesCarrierRecord[];
  currentUserName: string;
  customers: SalesCustomerRecord[];
  defaultSaleDate: string;
  discountPolicies: SalesDiscountPolicyRecord[];
  rebatePolicies: SalesRebatePolicyRecord[];
  saleProfitPolicies: SalesSaleProfitPolicyRecord[];
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

function ExistingCustomerIllustration() {
  return (
    <svg aria-hidden="true" className="h-20 w-20" fill="none" viewBox="0 0 96 96">
      <rect x="12" y="14" width="72" height="68" rx="18" fill="#EFF6FF" />
      <path
        d="M29 41c0-10.493 8.507-19 19-19s19 8.507 19 19"
        stroke="#2563EB"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="48" cy="44" r="12" fill="#BFDBFE" />
      <path
        d="M28 70c5.8-9.333 12.467-14 20-14s14.2 4.667 20 14"
        stroke="#1D4ED8"
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function NewCustomerIllustration() {
  return (
    <svg aria-hidden="true" className="h-20 w-20" fill="none" viewBox="0 0 96 96">
      <rect x="10" y="16" width="76" height="64" rx="18" fill="#ECFDF5" />
      <rect x="28" y="28" width="24" height="6" rx="3" fill="#10B981" />
      <rect x="28" y="42" width="40" height="6" rx="3" fill="#6EE7B7" />
      <rect x="28" y="56" width="32" height="6" rx="3" fill="#A7F3D0" />
      <circle cx="70" cy="32" r="12" fill="#D1FAE5" />
      <path
        d="M70 26v12M64 32h12"
        stroke="#059669"
        strokeLinecap="round"
        strokeWidth="5"
      />
    </svg>
  );
}

function ActionChoiceCard({
  description,
  illustration,
  onClick,
  title,
}: {
  description: string;
  illustration: ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      className="group flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-[1.6rem] border border-stone-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(245,243,239,0.98)_100%)] px-6 py-6 text-center shadow-[0_24px_50px_-40px_rgba(15,23,42,0.32)] transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_28px_60px_-38px_rgba(37,99,235,0.28)]"
      onClick={onClick}
      type="button"
    >
      <div className="rounded-[1.4rem] border border-white/80 bg-white/90 p-4 shadow-[0_18px_36px_-32px_rgba(15,23,42,0.24)]">
        {illustration}
      </div>
      <h4 className="mt-5 text-xl font-semibold tracking-[-0.04em] text-slate-950">
        {title}
      </h4>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </button>
  );
}

function ModalShell({
  children,
  onClose,
  subtitle,
  title,
}: {
  children: ReactNode;
  onClose: () => void;
  subtitle: string;
  title: string;
}) {
  return (
    <div
      className="dashboard-dialog-backdrop fixed inset-0 z-[80] flex items-end justify-center bg-[rgba(15,23,42,0.42)] px-4 py-6 sm:items-center"
      onClick={onClose}
    >
      <div
        aria-modal="true"
        className="dashboard-dialog-panel flex max-h-[min(88vh,60rem)] w-full max-w-6xl flex-col overflow-hidden rounded-[1.7rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(245,243,239,0.98)_100%)] shadow-[0_42px_90px_-34px_rgba(15,23,42,0.5)] backdrop-blur"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4 border-b border-stone-200/90 px-5 py-4 sm:px-6">
          <div className="space-y-1.5">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-blue-700">
              {subtitle}
            </p>
            <h3 className="text-[1.45rem] font-semibold tracking-[-0.04em] text-slate-950">
              {title}
            </h3>
          </div>
          <button
            aria-label="모달 닫기"
            className={joinClassNames(
              `${secondaryButtonClassName} h-9 w-9 px-0`,
              "rounded-full border-stone-200 bg-white text-slate-700",
            )}
            onClick={onClose}
            type="button"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {children}
        </div>
      </div>
    </div>
  );
}

export function SalesLauncher({
  availableInventory,
  carriers,
  currentUserName,
  customers,
  defaultSaleDate,
  discountPolicies,
  rebatePolicies,
  saleProfitPolicies,
}: SalesLauncherProps) {
  const [view, setView] = useState<LauncherView>(null);

  useEffect(() => {
    if (!view) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [view]);

  return (
    <>
      <button
        className={`${primaryButtonClassName} h-10 px-4`}
        onClick={() => setView("chooser")}
        type="button"
      >
        판매 등록 화면 열기
      </button>

      {view === "chooser" ? (
        <ModalShell
          onClose={() => setView(null)}
          subtitle="Launch"
          title="판매 등록 흐름을 선택합니다"
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <ActionChoiceCard
              description="이미 등록된 고객을 선택해 바로 판매 등록 흐름으로 들어갑니다."
              illustration={<ExistingCustomerIllustration />}
              onClick={() => setView("existing")}
              title="기존 고객"
            />
            <ActionChoiceCard
              description="먼저 고객을 등록하고, 이후 판매 연결 흐름은 다음 요청 단계에서 이어갑니다."
              illustration={<NewCustomerIllustration />}
              onClick={() => setView("new")}
              title="신규 고객"
            />
          </div>
        </ModalShell>
      ) : null}

      {view === "existing" ? (
        <ModalShell
          onClose={() => setView(null)}
          subtitle="Existing Customer"
          title="기존 고객 판매 등록"
        >
          <SalesEntryForm
            availableInventory={availableInventory}
            carriers={carriers}
            currentUserName={currentUserName}
            customers={customers}
            defaultSaleDate={defaultSaleDate}
            discountPolicies={discountPolicies}
            rebatePolicies={rebatePolicies}
            saleProfitPolicies={saleProfitPolicies}
          />
        </ModalShell>
      ) : null}

      {view === "new" ? (
        <ModalShell
          onClose={() => setView(null)}
          subtitle="New Customer"
          title="신규 고객 등록"
        >
          <div className="mx-auto max-w-3xl space-y-4">
            <div className="rounded-[1.2rem] border border-blue-100 bg-blue-50/85 px-4 py-3 text-sm leading-6 text-slate-600">
              고객 저장 후 현재 판매 화면 데이터가 다시 갱신됩니다. 저장 이후 판매 연결 흐름은
              다음 요청 단계에서 이어서 정리합니다.
            </div>
            <form
              action={upsertCustomerAction}
              className="grid gap-4 rounded-[1.4rem] border border-stone-200 bg-white/90 p-5 shadow-[0_20px_44px_-34px_rgba(15,23,42,0.24)] md:grid-cols-2"
            >
              <FormField
                autoComplete="off"
                label="고객명"
                name="name"
                required
              />
              <FormField
                autoComplete="off"
                inputMode="tel"
                label="연락처"
                name="phone"
                placeholder="010-1234-5678"
                required
              />
              <FormSelect
                label="현재 통신사"
                name="currentCarrierId"
              >
                <option value="">미정</option>
                {carriers.map((carrier) => (
                  <option key={carrier.id} value={carrier.id}>
                    {carrier.name}
                  </option>
                ))}
              </FormSelect>
              <FormField label="생년월일" name="birthDate" type="date" />
              <FormField
                autoComplete="off"
                label="주소"
                name="address"
                placeholder="상세 주소 또는 메모"
                wrapperClassName="md:col-span-2"
              />
              <FormTextArea
                label="메모"
                name="memo"
                placeholder="상담 메모, 선호 기종, 후속 요청"
                rows={4}
                wrapperClassName="md:col-span-2"
              />
              <div className="flex flex-wrap items-center justify-end gap-2 md:col-span-2">
                <button
                  className={`${secondaryButtonClassName} h-10 px-4`}
                  onClick={() => setView("chooser")}
                  type="button"
                >
                  이전 선택으로
                </button>
                <SubmitButton label="고객 저장" />
              </div>
            </form>
          </div>
        </ModalShell>
      ) : null}
    </>
  );
}
