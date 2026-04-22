"use client";

import { useState, type ReactNode } from "react";

import {
  toggleCarrierActivationRuleActiveAction,
  toggleDiscountPolicyActiveAction,
  toggleSaleProfitPolicyActiveAction,
  toggleStaffCommissionPolicyActiveAction,
  upsertCarrierActivationRuleAction,
  upsertDiscountPolicyAction,
  upsertSaleProfitPolicyAction,
  upsertStaffCommissionPolicyAction,
} from "@/app/actions/policies";
import {
  ActiveStatePill,
  EmptyState,
  FormField,
  FormSelect,
  FormTextArea,
  SubmitButton,
} from "@/components/workspace/admin-form-controls";
import { ConfirmSubmitButton } from "@/components/workspace/confirm-submit-button";
import {
  joinClassNames,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/workspace/ui-classnames";
import { WorkspaceModalShell } from "@/components/workspace/workspace-modal-shell";
import {
  ActionChip,
  CarrierTonePill,
  MetricCard,
  PageIntro,
  Panel,
  TonePill,
} from "@/components/workspace/workspace-primitives";
import { formatActivationRuleLabel } from "@/lib/activation-rules";
import { formatKstDate, formatKstDateRange } from "@/lib/date-utils";
import { formatWon } from "@/lib/formatters";

const surfaceClassName =
  "rounded-[1.25rem] border border-stone-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(245,243,239,0.96)_100%)] p-4 shadow-[0_18px_38px_-34px_rgba(15,23,42,0.24)]";

const formGridClassName = "grid gap-3 md:grid-cols-2";

type DiscountMethodValue = "PERCENTAGE" | "FIXED_AMOUNT";
type RevenueCalculationMethodValue = "NONE" | "FIXED_AMOUNT" | "PERCENTAGE";
type ActivationCountUnitValue = "DAY" | "MONTH";
type ActivationMonthCountModeValue =
  | "INCLUDE_CURRENT_MONTH"
  | "EXCLUDE_CURRENT_MONTH";

type PolicyTab =
  | "saleProfits"
  | "staffCommissions"
  | "discounts"
  | "activationRules";

type PolicyModalState =
  | { entity: "saleProfit"; mode: "create" }
  | { entity: "staffCommission"; mode: "create" }
  | { entity: "discount"; mode: "create" }
  | { entity: "activationRule"; mode: "create" }
  | { entity: "saleProfit"; mode: "edit"; id: string }
  | { entity: "staffCommission"; mode: "edit"; id: string }
  | { entity: "discount"; mode: "edit"; id: string }
  | { entity: "activationRule"; mode: "edit"; id: string }
  | null;

export interface PolicyCarrierOption {
  id: string;
  name: string;
  isActive: boolean;
}

export interface PolicyDeviceModelOption {
  id: string;
  name: string;
  manufacturer: string | null;
  isActive: boolean;
}

export interface PolicyStaffOption {
  id: string;
  displayName: string;
  username: string;
  isActive: boolean;
}

export interface SaleProfitPolicyRecord {
  id: string;
  name: string;
  carrierId: string;
  carrierName: string;
  startsAt: Date;
  endsAt: Date;
  calculationMethod: RevenueCalculationMethodValue;
  calculationValue: number;
  memo: string | null;
  isActive: boolean;
}

export interface StaffCommissionPolicyRecord {
  id: string;
  name: string;
  staffId: string;
  staffName: string;
  staffCode: string;
  startsAt: Date;
  endsAt: Date;
  calculationMethod: RevenueCalculationMethodValue;
  calculationValue: number;
  memo: string | null;
  isActive: boolean;
}

export interface DiscountPolicyRecord {
  id: string;
  name: string;
  deviceModelId: string;
  deviceModelName: string;
  manufacturer: string | null;
  startsAt: Date;
  endsAt: Date;
  discountMethod: DiscountMethodValue;
  discountValue: number;
  memo: string | null;
  isActive: boolean;
}

export interface CarrierActivationRuleRecord {
  id: string;
  carrierId: string;
  carrierName: string;
  countUnit: ActivationCountUnitValue;
  countValue: number;
  monthCountMode: ActivationMonthCountModeValue | null;
  memo: string | null;
  isActive: boolean;
}

export interface PoliciesOverviewProps {
  carriers: PolicyCarrierOption[];
  deviceModels: PolicyDeviceModelOption[];
  staffs: PolicyStaffOption[];
  saleProfitPolicies: SaleProfitPolicyRecord[];
  staffCommissionPolicies: StaffCommissionPolicyRecord[];
  discountPolicies: DiscountPolicyRecord[];
  carrierActivationRules: CarrierActivationRuleRecord[];
}

function getCarrierOptionLabel(carrier: PolicyCarrierOption) {
  return carrier.isActive ? carrier.name : `${carrier.name} (비활성)`;
}

function getDeviceModelOptionLabel(deviceModel: PolicyDeviceModelOption) {
  const baseLabel = deviceModel.manufacturer
    ? `${deviceModel.manufacturer} ${deviceModel.name}`
    : deviceModel.name;

  return deviceModel.isActive ? baseLabel : `${baseLabel} (비활성)`;
}

function getStaffOptionLabel(staff: PolicyStaffOption) {
  const baseLabel = `${staff.displayName} / @${staff.username}`;
  return staff.isActive ? baseLabel : `${baseLabel} (비활성)`;
}

function getCalculationMethodLabel(method: RevenueCalculationMethodValue) {
  switch (method) {
    case "PERCENTAGE":
      return "판매가 비율";
    case "FIXED_AMOUNT":
      return "고정 금액";
    default:
      return "미반영";
  }
}

function getCalculationValueLabel(
  method: RevenueCalculationMethodValue,
  value: number,
) {
  switch (method) {
    case "PERCENTAGE":
      return `${value}%`;
    case "FIXED_AMOUNT":
      return formatWon(value);
    default:
      return "0";
  }
}

function getDiscountMethodLabel(method: DiscountMethodValue) {
  return method === "PERCENTAGE" ? "비율" : "고정 금액";
}

function getDiscountValueLabel(method: DiscountMethodValue, value: number) {
  return method === "PERCENTAGE" ? `${value}%` : formatWon(value);
}

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={joinClassNames(
        "inline-flex h-10 cursor-pointer items-center rounded-full border px-4 text-sm font-semibold transition duration-150 hover:-translate-y-px hover:shadow-[0_14px_24px_-22px_rgba(180,83,9,0.28)]",
        active
          ? "border-amber-300 bg-amber-50 text-amber-900 shadow-[0_14px_24px_-22px_rgba(180,83,9,0.42)] hover:border-amber-400 hover:bg-amber-100"
          : "border-stone-200 bg-white text-slate-600 hover:border-amber-200 hover:bg-amber-50/70 hover:text-amber-900",
      )}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function EditIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 20 20">
      <path
        d="M13.75 4.75a1.768 1.768 0 1 1 2.5 2.5L8.5 15H6v-2.5l7.75-7.75Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
      <path
        d="M11.75 6.75 14.25 9.25"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function ActionIconButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-teal-200 bg-teal-50 text-teal-700 transition duration-150 hover:-translate-y-px hover:border-teal-300 hover:bg-teal-100"
      onClick={onClick}
      title={label}
      type="button"
    >
      <EditIcon />
      <span className="sr-only">{label}</span>
    </button>
  );
}

function TableShell({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-[1.1rem] border border-stone-200">
      <table className="min-w-full text-left text-sm">{children}</table>
    </div>
  );
}

function TableHeader({
  headers,
}: {
  headers: Array<{ label: string; align?: "left" | "right" }>;
}) {
  return (
    <thead className="bg-stone-50 text-[0.7rem] uppercase tracking-[0.18em] text-slate-500">
      <tr>
        {headers.map((header) => (
          <th
            key={header.label}
            className={joinClassNames(
              "px-4 py-3 font-semibold",
              header.align === "right" ? "text-right" : "",
            )}
          >
            {header.label}
          </th>
        ))}
      </tr>
    </thead>
  );
}

function TableCell({
  align,
  children,
}: {
  align?: "left" | "right";
  children: ReactNode;
}) {
  return (
    <td
      className={joinClassNames(
        "px-4 py-3.5 align-top",
        align === "right" ? "text-right" : "",
      )}
    >
      {children}
    </td>
  );
}

function SaleProfitPolicyForm({
  carriers,
  initialPolicy,
  usedCarrierIds,
}: {
  carriers: PolicyCarrierOption[];
  initialPolicy?: SaleProfitPolicyRecord | null;
  usedCarrierIds: string[];
}) {
  const blockedCarrierIds = new Set(
    usedCarrierIds.filter((carrierId) => carrierId !== initialPolicy?.carrierId),
  );

  return (
    <form action={upsertSaleProfitPolicyAction} className={`${surfaceClassName} ${formGridClassName}`}>
      {initialPolicy ? <input name="id" type="hidden" value={initialPolicy.id} /> : null}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900 md:col-span-2">
        정책명은 통신사 이름으로 자동 지정됩니다. 통신사별로 1개 정책만 등록할 수 있습니다.
      </div>
      <FormSelect
        defaultValue={initialPolicy?.carrierId ?? ""}
        label="통신사"
        name="carrierId"
        required
      >
        <option value="">통신사를 선택해 주세요</option>
        {carriers.map((carrier) => (
          <option
            key={carrier.id}
            value={carrier.id}
            disabled={blockedCarrierIds.has(carrier.id)}
          >
            {getCarrierOptionLabel(carrier)}
          </option>
        ))}
      </FormSelect>
      <FormSelect
        defaultValue={initialPolicy?.calculationMethod ?? "NONE"}
        label="계산 방식"
        name="calculationMethod"
        required
      >
        <option value="NONE">미반영</option>
        <option value="FIXED_AMOUNT">고정 금액</option>
        <option value="PERCENTAGE">판매가 비율</option>
      </FormSelect>
      <FormField
        defaultValue={initialPolicy?.calculationValue ?? ""}
        label="계산 값"
        min="0"
        name="calculationValue"
        placeholder="70000 또는 5"
        type="number"
      />
      <FormField
        defaultValue={initialPolicy ? formatKstDate(initialPolicy.startsAt) : ""}
        label="시작일"
        name="startsAt"
        required
        type="date"
      />
      <FormField
        defaultValue={initialPolicy ? formatKstDate(initialPolicy.endsAt) : ""}
        label="종료일"
        name="endsAt"
        required
        type="date"
      />
      <FormTextArea
        defaultValue={initialPolicy?.memo ?? ""}
        label="메모"
        name="memo"
        placeholder="정책 운영 메모"
        rows={3}
        wrapperClassName="md:col-span-2"
      />
      <div className="flex justify-end md:col-span-2">
        <SubmitButton
          label={
            initialPolicy ? "통신사 할인 정책 수정" : "통신사 할인 정책 등록"
          }
        />
      </div>
    </form>
  );
}

function StaffCommissionPolicyForm({
  staffs,
  initialPolicy,
}: {
  staffs: PolicyStaffOption[];
  initialPolicy?: StaffCommissionPolicyRecord | null;
}) {
  return (
    <form action={upsertStaffCommissionPolicyAction} className={`${surfaceClassName} ${formGridClassName}`}>
      {initialPolicy ? <input name="id" type="hidden" value={initialPolicy.id} /> : null}
      <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-900 md:col-span-2">
        직원명은 기초정보의 직원 관리에 등록된 직원 기준으로 자동 지정됩니다. 동명이인은
        직원코드(@아이디)로 구분합니다.
      </div>
      <FormSelect
        defaultValue={initialPolicy?.staffId ?? ""}
        label="직원"
        name="staffId"
        required
      >
        <option value="">직원을 선택해 주세요</option>
        {staffs.map((staff) => (
          <option key={staff.id} value={staff.id}>
            {getStaffOptionLabel(staff)}
          </option>
        ))}
      </FormSelect>
      <FormSelect
        defaultValue={initialPolicy?.calculationMethod ?? "FIXED_AMOUNT"}
        label="계산 방식"
        name="calculationMethod"
        required
      >
        <option value="NONE">미반영</option>
        <option value="FIXED_AMOUNT">고정 금액</option>
        <option value="PERCENTAGE">판매가 비율</option>
      </FormSelect>
      <FormField
        defaultValue={initialPolicy?.calculationValue ?? ""}
        label="계산 값"
        min="0"
        name="calculationValue"
        placeholder="40000 또는 3"
        type="number"
      />
      <FormField
        defaultValue={initialPolicy ? formatKstDate(initialPolicy.startsAt) : ""}
        label="시작일"
        name="startsAt"
        required
        type="date"
      />
      <FormField
        defaultValue={initialPolicy ? formatKstDate(initialPolicy.endsAt) : ""}
        label="종료일"
        name="endsAt"
        required
        type="date"
      />
      <FormTextArea
        defaultValue={initialPolicy?.memo ?? ""}
        label="메모"
        name="memo"
        placeholder="직원 수수료 운영 메모"
        rows={3}
        wrapperClassName="md:col-span-2"
      />
      <div className="flex justify-end md:col-span-2">
        <SubmitButton
          label={
            initialPolicy
              ? "직원 수수료 정책 수정"
              : "직원 수수료 정책 등록"
          }
        />
      </div>
    </form>
  );
}

function DiscountPolicyForm({
  deviceModels,
  initialPolicy,
}: {
  deviceModels: PolicyDeviceModelOption[];
  initialPolicy?: DiscountPolicyRecord | null;
}) {
  return (
    <form action={upsertDiscountPolicyAction} className={`${surfaceClassName} ${formGridClassName}`}>
      {initialPolicy ? <input name="id" type="hidden" value={initialPolicy.id} /> : null}
      <div className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm leading-6 text-teal-900 md:col-span-2">
        정책명은 선택한 단말기 모델명으로 자동 지정됩니다. 등록된 단말기 모델만 할인 정책을 만들 수 있습니다.
      </div>
      <FormSelect
        defaultValue={initialPolicy?.deviceModelId ?? ""}
        label="단말기 모델"
        name="deviceModelId"
        required
      >
        <option value="">단말기 모델을 선택해 주세요</option>
        {deviceModels.map((deviceModel) => (
          <option key={deviceModel.id} value={deviceModel.id}>
            {getDeviceModelOptionLabel(deviceModel)}
          </option>
        ))}
      </FormSelect>
      <FormSelect
        defaultValue={initialPolicy?.discountMethod ?? "PERCENTAGE"}
        label="할인 방식"
        name="discountMethod"
        required
      >
        <option value="PERCENTAGE">비율</option>
        <option value="FIXED_AMOUNT">고정 금액</option>
      </FormSelect>
      <FormField
        defaultValue={initialPolicy?.discountValue ?? ""}
        label="할인 값"
        min="0"
        name="discountValue"
        placeholder="8 또는 80000"
        required
        type="number"
      />
      <FormField
        defaultValue={initialPolicy ? formatKstDate(initialPolicy.startsAt) : ""}
        label="시작일"
        name="startsAt"
        required
        type="date"
      />
      <FormField
        defaultValue={initialPolicy ? formatKstDate(initialPolicy.endsAt) : ""}
        label="종료일"
        name="endsAt"
        required
        type="date"
      />
      <FormTextArea
        defaultValue={initialPolicy?.memo ?? ""}
        label="메모"
        name="memo"
        placeholder="단말기 할인 메모"
        rows={3}
        wrapperClassName="md:col-span-2"
      />
      <div className="flex justify-end md:col-span-2">
        <SubmitButton
          label={
            initialPolicy ? "단말기 할인 정책 수정" : "단말기 할인 정책 등록"
          }
        />
      </div>
    </form>
  );
}

function ActivationRuleForm({
  carriers,
  existingCarrierIds,
  initialRule,
}: {
  carriers: PolicyCarrierOption[];
  existingCarrierIds: string[];
  initialRule?: CarrierActivationRuleRecord | null;
}) {
  const blockedCarrierIds = new Set(
    existingCarrierIds.filter((carrierId) => carrierId !== initialRule?.carrierId),
  );

  return (
    <form action={upsertCarrierActivationRuleAction} className={`${surfaceClassName} ${formGridClassName}`}>
      {initialRule ? <input name="id" type="hidden" value={initialRule.id} /> : null}
      <FormSelect
        defaultValue={initialRule?.carrierId ?? ""}
        label="통신사"
        name="carrierId"
        required
      >
        <option value="">통신사를 선택해 주세요</option>
        {carriers.map((carrier) => (
          <option
            key={carrier.id}
            value={carrier.id}
            disabled={blockedCarrierIds.has(carrier.id)}
          >
            {getCarrierOptionLabel(carrier)}
          </option>
        ))}
      </FormSelect>
      <FormSelect
        defaultValue={initialRule?.countUnit ?? "DAY"}
        label="기준 단위"
        name="countUnit"
        required
      >
        <option value="DAY">일수</option>
        <option value="MONTH">개월</option>
      </FormSelect>
      <FormField
        defaultValue={initialRule?.countValue ?? ""}
        label="기준 값"
        min="1"
        name="countValue"
        placeholder="127 또는 4"
        required
        type="number"
      />
      <FormSelect
        defaultValue={initialRule?.monthCountMode ?? ""}
        label="개월 계산 방식"
        name="monthCountMode"
      >
        <option value="">일수 기준이면 비워 둘 수 있습니다</option>
        <option value="INCLUDE_CURRENT_MONTH">당월 포함</option>
        <option value="EXCLUDE_CURRENT_MONTH">당월 제외</option>
      </FormSelect>
      <FormTextArea
        defaultValue={initialRule?.memo ?? ""}
        label="메모"
        name="memo"
        placeholder="예: KT 개통 후 127일 유지"
        rows={3}
        wrapperClassName="md:col-span-2"
      />
      <div className="flex justify-end md:col-span-2">
        <SubmitButton label={initialRule ? "개통 가능 규칙 수정" : "개통 가능 규칙 등록"} />
      </div>
    </form>
  );
}

export function PoliciesOverview({
  carriers,
  deviceModels,
  staffs,
  saleProfitPolicies,
  staffCommissionPolicies,
  discountPolicies,
  carrierActivationRules,
}: PoliciesOverviewProps) {
  const [activeTab, setActiveTab] = useState<PolicyTab>("saleProfits");
  const [modalState, setModalState] = useState<PolicyModalState>(null);

  const activeSaleProfitCount = saleProfitPolicies.filter(
    (policy) => policy.isActive,
  ).length;
  const activeStaffCommissionCount = staffCommissionPolicies.filter(
    (policy) => policy.isActive,
  ).length;
  const activeDiscountCount = discountPolicies.filter((policy) => policy.isActive).length;
  const activeActivationRuleCount = carrierActivationRules.filter(
    (rule) => rule.isActive,
  ).length;
  const canCreateStaffCommissionPolicy = staffs.length > 0;

  const activeSaleProfit =
    modalState?.entity === "saleProfit" && modalState.mode === "edit"
      ? saleProfitPolicies.find((policy) => policy.id === modalState.id) ?? null
      : null;
  const activeStaffCommission =
    modalState?.entity === "staffCommission" && modalState.mode === "edit"
      ? staffCommissionPolicies.find((policy) => policy.id === modalState.id) ?? null
      : null;
  const activeDiscount =
    modalState?.entity === "discount" && modalState.mode === "edit"
      ? discountPolicies.find((policy) => policy.id === modalState.id) ?? null
      : null;
  const activeActivationRule =
    modalState?.entity === "activationRule" && modalState.mode === "edit"
      ? carrierActivationRules.find((rule) => rule.id === modalState.id) ?? null
      : null;

  const usedSaleProfitCarrierIds = saleProfitPolicies.map((policy) => policy.carrierId);
  const availableSaleProfitCarrierCount = carriers.filter(
    (carrier) => !usedSaleProfitCarrierIds.includes(carrier.id),
  ).length;
  const canCreateSaleProfitPolicy = availableSaleProfitCarrierCount > 0;

  const existingActivationCarrierIds = carrierActivationRules.map(
    (rule) => rule.carrierId,
  );
  const availableActivationCarrierCount = carriers.filter(
    (carrier) => !existingActivationCarrierIds.includes(carrier.id),
  ).length;
  const canCreateActivationRule = availableActivationCarrierCount > 0;

  const activePolicyCount =
    activeSaleProfitCount +
    activeStaffCommissionCount +
    activeDiscountCount +
    activeActivationRuleCount;

  return (
    <div className="flex flex-col gap-4 p-3 sm:p-4 2xl:p-5">
      <PageIntro
        eyebrow="Policies"
        title="정책 관리"
        className="shrink-0"
        actions={
          <>
            <ActionChip label={`활성 정책 ${activePolicyCount}개`} tone="dark" />
            <ActionChip
              label={`통신사 ${activeSaleProfitCount} / 직원 ${activeStaffCommissionCount} / 단말기 ${activeDiscountCount}`}
            />
          </>
        }
      />

      <section className="grid shrink-0 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          accent="teal"
          helper="통신사별 1개씩 운영"
          label="통신사 할인 정책"
          value={`${activeSaleProfitCount}개`}
        />
        <MetricCard
          accent="slate"
          helper="등록 직원 기준 수수료"
          label="직원 수수료 정책"
          value={`${activeStaffCommissionCount}개`}
        />
        <MetricCard
          accent="amber"
          helper="등록 단말기 모델 기준"
          label="단말기 할인 정책"
          value={`${activeDiscountCount}개`}
        />
        <MetricCard
          accent="amber"
          helper="통신사별 개통 제한"
          label="개통 가능 규칙"
          value={`${activeActivationRuleCount}개`}
        />
      </section>

      <Panel title="정책 메뉴" contentClassName="space-y-4">
        <div className="flex flex-wrap gap-2">
          <TabButton
            active={activeTab === "saleProfits"}
            label="통신사 할인 정책"
            onClick={() => setActiveTab("saleProfits")}
          />
          <TabButton
            active={activeTab === "staffCommissions"}
            label="직원 수수료 정책"
            onClick={() => setActiveTab("staffCommissions")}
          />
          <TabButton
            active={activeTab === "discounts"}
            label="단말기 할인 정책"
            onClick={() => setActiveTab("discounts")}
          />
          <TabButton
            active={activeTab === "activationRules"}
            label="개통 가능 규칙"
            onClick={() => setActiveTab("activationRules")}
          />
        </div>

        {activeTab === "saleProfits" ? (
          <Panel
            title="통신사 할인 정책"
            actions={
              <div className="flex flex-wrap gap-2">
                <TonePill label={`목록 ${saleProfitPolicies.length}개`} tone="slate" />
                <button
                  className={`${primaryButtonClassName} h-10 px-4`}
                  disabled={!canCreateSaleProfitPolicy}
                  onClick={() =>
                    setModalState({ entity: "saleProfit", mode: "create" })
                  }
                  title={
                    canCreateSaleProfitPolicy
                      ? undefined
                      : "모든 통신사 정책이 이미 등록되어 있습니다."
                  }
                  type="button"
                >
                  신규 통신사 할인 정책 등록
                </button>
                {!canCreateSaleProfitPolicy ? (
                  <p className="flex items-center text-xs font-medium text-slate-500">
                    모든 통신사 정책이 이미 등록되어 있습니다.
                  </p>
                ) : null}
              </div>
            }
            contentClassName="space-y-3"
          >
            {saleProfitPolicies.length > 0 ? (
              <TableShell>
                <TableHeader
                  headers={[
                    { label: "정책명" },
                    { label: "통신사" },
                    { label: "계산 방식" },
                    { label: "기간" },
                    { label: "상태" },
                    { label: "작업", align: "right" },
                  ]}
                />
                <tbody className="divide-y divide-stone-200 bg-white">
                  {saleProfitPolicies.map((policy) => (
                    <tr key={policy.id} className="hover:bg-stone-50/70">
                      <TableCell>
                        <p className="font-semibold text-slate-950">{policy.name}</p>
                      </TableCell>
                      <TableCell>
                        <CarrierTonePill label={policy.carrierName} />
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-slate-700">
                          {getCalculationMethodLabel(policy.calculationMethod)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {getCalculationValueLabel(
                            policy.calculationMethod,
                            policy.calculationValue,
                          )}
                        </p>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-600">
                          {formatKstDateRange(policy.startsAt, policy.endsAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <ActiveStatePill isActive={policy.isActive} />
                      </TableCell>
                      <TableCell align="right">
                        <div className="flex justify-end gap-2">
                          <form action={toggleSaleProfitPolicyActiveAction}>
                            <input name="id" type="hidden" value={policy.id} />
                            <input
                              name="nextActive"
                              type="hidden"
                              value={policy.isActive ? "false" : "true"}
                            />
                            <ConfirmSubmitButton
                              className={`${secondaryButtonClassName} h-8 px-3 text-xs`}
                              confirmMessage={
                                policy.isActive
                                  ? "통신사 할인 정책을 비활성화하시겠습니까?"
                                  : "통신사 할인 정책을 다시 활성화하시겠습니까?"
                              }
                            >
                              {policy.isActive ? "비활성화" : "활성화"}
                            </ConfirmSubmitButton>
                          </form>
                          <ActionIconButton
                            label={`${policy.name} 수정`}
                            onClick={() =>
                              setModalState({
                                entity: "saleProfit",
                                mode: "edit",
                                id: policy.id,
                              })
                            }
                          />
                        </div>
                      </TableCell>
                    </tr>
                  ))}
                </tbody>
              </TableShell>
            ) : (
              <EmptyState message="등록된 통신사 할인 정책이 아직 없습니다." />
            )}
          </Panel>
        ) : null}

        {activeTab === "staffCommissions" ? (
          <Panel
            title="직원 수수료 정책"
            actions={
              <div className="flex flex-wrap gap-2">
                <TonePill
                  label={`목록 ${staffCommissionPolicies.length}개`}
                  tone="slate"
                />
                <button
                  className={`${primaryButtonClassName} h-10 px-4`}
                  disabled={!canCreateStaffCommissionPolicy}
                  onClick={() =>
                    setModalState({ entity: "staffCommission", mode: "create" })
                  }
                  title={
                    canCreateStaffCommissionPolicy
                      ? undefined
                      : "기초정보 > 직원 관리에서 직원을 먼저 등록해 주세요."
                  }
                  type="button"
                >
                  신규 직원 수수료 정책 등록
                </button>
                {!canCreateStaffCommissionPolicy ? (
                  <p className="flex items-center text-xs font-medium text-slate-500">
                    기초정보의 직원 관리에서 직원을 먼저 등록해 주세요.
                  </p>
                ) : null}
              </div>
            }
            contentClassName="space-y-3"
          >
            {staffCommissionPolicies.length > 0 ? (
              <TableShell>
                <TableHeader
                  headers={[
                    { label: "직원명" },
                    { label: "직원코드" },
                    { label: "계산 방식" },
                    { label: "기간" },
                    { label: "상태" },
                    { label: "작업", align: "right" },
                  ]}
                />
                <tbody className="divide-y divide-stone-200 bg-white">
                  {staffCommissionPolicies.map((policy) => (
                    <tr key={policy.id} className="hover:bg-stone-50/70">
                      <TableCell>
                        <p className="font-semibold text-slate-950">{policy.staffName}</p>
                      </TableCell>
                      <TableCell>
                        <TonePill label={`@${policy.staffCode}`} tone="slate" />
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-slate-700">
                          {getCalculationMethodLabel(policy.calculationMethod)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {getCalculationValueLabel(
                            policy.calculationMethod,
                            policy.calculationValue,
                          )}
                        </p>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-600">
                          {formatKstDateRange(policy.startsAt, policy.endsAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <ActiveStatePill isActive={policy.isActive} />
                      </TableCell>
                      <TableCell align="right">
                        <div className="flex justify-end gap-2">
                          <form action={toggleStaffCommissionPolicyActiveAction}>
                            <input name="id" type="hidden" value={policy.id} />
                            <input
                              name="nextActive"
                              type="hidden"
                              value={policy.isActive ? "false" : "true"}
                            />
                            <ConfirmSubmitButton
                              className={`${secondaryButtonClassName} h-8 px-3 text-xs`}
                              confirmMessage={
                                policy.isActive
                                  ? "직원 수수료 정책을 비활성화하시겠습니까?"
                                  : "직원 수수료 정책을 다시 활성화하시겠습니까?"
                              }
                            >
                              {policy.isActive ? "비활성화" : "활성화"}
                            </ConfirmSubmitButton>
                          </form>
                          <ActionIconButton
                            label={`${policy.staffName} 정책 수정`}
                            onClick={() =>
                              setModalState({
                                entity: "staffCommission",
                                mode: "edit",
                                id: policy.id,
                              })
                            }
                          />
                        </div>
                      </TableCell>
                    </tr>
                  ))}
                </tbody>
              </TableShell>
            ) : (
              <EmptyState message="등록된 직원 수수료 정책이 아직 없습니다." />
            )}
          </Panel>
        ) : null}

        {activeTab === "discounts" ? (
          <Panel
            title="단말기 할인 정책"
            actions={
              <div className="flex flex-wrap gap-2">
                <TonePill label={`목록 ${discountPolicies.length}개`} tone="slate" />
                <button
                  className={`${primaryButtonClassName} h-10 px-4`}
                  onClick={() => setModalState({ entity: "discount", mode: "create" })}
                  type="button"
                >
                  신규 단말기 할인 정책 등록
                </button>
              </div>
            }
            contentClassName="space-y-3"
          >
            {discountPolicies.length > 0 ? (
              <TableShell>
                <TableHeader
                  headers={[
                    { label: "단말기 모델" },
                    { label: "제조사" },
                    { label: "할인 방식" },
                    { label: "기간" },
                    { label: "상태" },
                    { label: "작업", align: "right" },
                  ]}
                />
                <tbody className="divide-y divide-stone-200 bg-white">
                  {discountPolicies.map((policy) => (
                    <tr key={policy.id} className="hover:bg-stone-50/70">
                      <TableCell>
                        <p className="font-semibold text-slate-950">
                          {policy.deviceModelName}
                        </p>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-600">
                          {policy.manufacturer ?? "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-slate-700">
                          {getDiscountMethodLabel(policy.discountMethod)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {getDiscountValueLabel(
                            policy.discountMethod,
                            policy.discountValue,
                          )}
                        </p>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-600">
                          {formatKstDateRange(policy.startsAt, policy.endsAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <ActiveStatePill isActive={policy.isActive} />
                      </TableCell>
                      <TableCell align="right">
                        <div className="flex justify-end gap-2">
                          <form action={toggleDiscountPolicyActiveAction}>
                            <input name="id" type="hidden" value={policy.id} />
                            <input
                              name="nextActive"
                              type="hidden"
                              value={policy.isActive ? "false" : "true"}
                            />
                            <ConfirmSubmitButton
                              className={`${secondaryButtonClassName} h-8 px-3 text-xs`}
                              confirmMessage={
                                policy.isActive
                                  ? "단말기 할인 정책을 비활성화하시겠습니까?"
                                  : "단말기 할인 정책을 다시 활성화하시겠습니까?"
                              }
                            >
                              {policy.isActive ? "비활성화" : "활성화"}
                            </ConfirmSubmitButton>
                          </form>
                          <ActionIconButton
                            label={`${policy.deviceModelName} 정책 수정`}
                            onClick={() =>
                              setModalState({
                                entity: "discount",
                                mode: "edit",
                                id: policy.id,
                              })
                            }
                          />
                        </div>
                      </TableCell>
                    </tr>
                  ))}
                </tbody>
              </TableShell>
            ) : (
              <EmptyState message="등록된 단말기 할인 정책이 아직 없습니다." />
            )}
          </Panel>
        ) : null}

        {activeTab === "activationRules" ? (
          <Panel
            title="개통 가능 규칙"
            actions={
              <div className="flex flex-wrap gap-2">
                <TonePill
                  label={`목록 ${carrierActivationRules.length}개`}
                  tone="slate"
                />
                <button
                  className={`${primaryButtonClassName} h-10 px-4`}
                  disabled={!canCreateActivationRule}
                  onClick={() =>
                    setModalState({ entity: "activationRule", mode: "create" })
                  }
                  title={
                    canCreateActivationRule
                      ? undefined
                      : "모든 통신사 규칙이 이미 등록되어 있습니다."
                  }
                  type="button"
                >
                  신규 개통 가능 규칙 등록
                </button>
                {!canCreateActivationRule ? (
                  <p className="flex items-center text-xs font-medium text-slate-500">
                    모든 통신사 규칙이 이미 등록되어 있습니다.
                  </p>
                ) : null}
              </div>
            }
            contentClassName="space-y-3"
          >
            {carrierActivationRules.length > 0 ? (
              <TableShell>
                <TableHeader
                  headers={[
                    { label: "통신사" },
                    { label: "규칙" },
                    { label: "상태" },
                    { label: "메모" },
                    { label: "작업", align: "right" },
                  ]}
                />
                <tbody className="divide-y divide-stone-200 bg-white">
                  {carrierActivationRules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-stone-50/70">
                      <TableCell>
                        <CarrierTonePill label={rule.carrierName} />
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-700">
                          {formatActivationRuleLabel({
                            countUnit: rule.countUnit,
                            countValue: rule.countValue,
                            monthCountMode: rule.monthCountMode,
                          })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <ActiveStatePill isActive={rule.isActive} />
                      </TableCell>
                      <TableCell>
                        <p className="max-w-xs text-sm leading-6 text-slate-600">
                          {rule.memo?.trim() || "메모 없음"}
                        </p>
                      </TableCell>
                      <TableCell align="right">
                        <div className="flex justify-end gap-2">
                          <form action={toggleCarrierActivationRuleActiveAction}>
                            <input name="id" type="hidden" value={rule.id} />
                            <input
                              name="nextActive"
                              type="hidden"
                              value={rule.isActive ? "false" : "true"}
                            />
                            <ConfirmSubmitButton
                              className={`${secondaryButtonClassName} h-8 px-3 text-xs`}
                              confirmMessage={
                                rule.isActive
                                  ? "개통 가능 규칙을 비활성화하시겠습니까?"
                                  : "개통 가능 규칙을 다시 활성화하시겠습니까?"
                              }
                            >
                              {rule.isActive ? "비활성화" : "활성화"}
                            </ConfirmSubmitButton>
                          </form>
                          <ActionIconButton
                            label={`${rule.carrierName} 규칙 수정`}
                            onClick={() =>
                              setModalState({
                                entity: "activationRule",
                                mode: "edit",
                                id: rule.id,
                              })
                            }
                          />
                        </div>
                      </TableCell>
                    </tr>
                  ))}
                </tbody>
              </TableShell>
            ) : (
              <EmptyState message="등록된 개통 가능 규칙이 아직 없습니다." />
            )}
          </Panel>
        ) : null}
      </Panel>

      {modalState?.entity === "saleProfit" ? (
        <WorkspaceModalShell
          contentClassName="sm:px-6"
          maxWidthClassName="max-w-3xl"
          onClose={() => setModalState(null)}
          subtitle="Carrier Discount Policies"
          title={
            modalState.mode === "create"
              ? "신규 통신사 할인 정책 등록"
              : "통신사 할인 정책 수정"
          }
        >
          <SaleProfitPolicyForm
            carriers={carriers}
            initialPolicy={activeSaleProfit}
            usedCarrierIds={usedSaleProfitCarrierIds}
          />
        </WorkspaceModalShell>
      ) : null}

      {modalState?.entity === "staffCommission" ? (
        <WorkspaceModalShell
          contentClassName="sm:px-6"
          maxWidthClassName="max-w-3xl"
          onClose={() => setModalState(null)}
          subtitle="Staff Commission Policies"
          title={
            modalState.mode === "create"
              ? "신규 직원 수수료 정책 등록"
              : "직원 수수료 정책 수정"
          }
        >
          <StaffCommissionPolicyForm
            staffs={staffs}
            initialPolicy={activeStaffCommission}
          />
        </WorkspaceModalShell>
      ) : null}

      {modalState?.entity === "discount" ? (
        <WorkspaceModalShell
          contentClassName="sm:px-6"
          maxWidthClassName="max-w-3xl"
          onClose={() => setModalState(null)}
          subtitle="Device Discount Policies"
          title={
            modalState.mode === "create"
              ? "신규 단말기 할인 정책 등록"
              : "단말기 할인 정책 수정"
          }
        >
          <DiscountPolicyForm
            deviceModels={deviceModels}
            initialPolicy={activeDiscount}
          />
        </WorkspaceModalShell>
      ) : null}

      {modalState?.entity === "activationRule" ? (
        <WorkspaceModalShell
          contentClassName="sm:px-6"
          maxWidthClassName="max-w-3xl"
          onClose={() => setModalState(null)}
          subtitle="Activation Rules"
          title={
            modalState.mode === "create"
              ? "신규 개통 가능 규칙 등록"
              : "개통 가능 규칙 수정"
          }
        >
          <ActivationRuleForm
            carriers={carriers}
            existingCarrierIds={existingActivationCarrierIds}
            initialRule={activeActivationRule}
          />
        </WorkspaceModalShell>
      ) : null}
    </div>
  );
}
