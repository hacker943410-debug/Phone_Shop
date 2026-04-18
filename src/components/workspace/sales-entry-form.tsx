"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

import { createSaleAction } from "@/app/actions/sales";
import { formatWon } from "@/lib/formatters";
import { normalizeMoneyInput } from "@/lib/phone-utils";
import { resolveCustomerMappedSelection } from "@/lib/sales-customer-mapping";
import {
  calculatePolicyRevenueAmount,
  calculateSalesAmounts,
  findMatchingDiscountPolicy,
  findMatchingSaleProfitPolicy,
  findMatchingStaffCommissionPolicy,
  parseSaleDateForPolicyMatch,
} from "@/lib/sales-calculations";

import type {
  DiscountMethodValue,
  SalesAvailableInventoryRecord,
  SalesCarrierRecord,
  SalesCustomerRecord,
  SalesDiscountPolicyRecord,
  SalesSaleProfitPolicyRecord,
  SalesStaffCommissionPolicyRecord,
} from "./sales-types";
import { SelectControl } from "./form-client-controls";
import { SalesEntryBasicsStep } from "./sales-entry-basics-step";
import {
  formControlClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  selectControlClassName,
} from "./ui-classnames";

const controlClassName = formControlClassName;
const selectClassName = selectControlClassName;
const pricingFieldClassName = `${controlClassName} h-11 min-h-11`;
const pricingSelectClassName = `${selectClassName} h-11 min-h-11`;
const labelClassName = "space-y-1.5 text-sm font-medium text-slate-700";
const surfaceClassName =
  "rounded-lg border border-stone-200 bg-stone-50 p-4 shadow-[0_1px_3px_rgba(15,23,42,0.05),0_1px_2px_rgba(15,23,42,0.08)]";

type NumericDisplayFormat = "currency" | "percentage" | "months";

const saleSteps = [
  {
    key: "basics",
    eyebrow: "Step 1",
    title: "고객과 재고 선택",
    description: "고객, 판매일, 재고, 요금제를 먼저 고정합니다.",
  },
  {
    key: "pricing",
    eyebrow: "Step 2",
    title: "금액과 수납 입력",
    description: "할인, 리베이트, 지원금, 수납 계획을 입력합니다.",
  },
  {
    key: "review",
    eyebrow: "Step 3",
    title: "최종 검토 후 등록",
    description: "정책 매칭과 계산 결과를 확인한 뒤 저장합니다.",
  },
] as const;

interface SalesEntryFormProps {
  currentUserId: string;
  currentUserName: string;
  defaultSaleDate: string;
  customers: SalesCustomerRecord[];
  carriers: SalesCarrierRecord[];
  availableInventory: SalesAvailableInventoryRecord[];
  discountPolicies: SalesDiscountPolicyRecord[];
  saleProfitPolicies: SalesSaleProfitPolicyRecord[];
  staffCommissionPolicies: SalesStaffCommissionPolicyRecord[];
  initialCustomerId?: string;
}

function parseOptionalInteger(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function areStringArraysEqual(left: string[], right: string[]) {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function getDiscountLabel(
  method: DiscountMethodValue | null,
  value: number | null,
) {
  if (!method || value === null) {
    return "없음";
  }

  return method === "PERCENTAGE" ? `${value}%` : formatWon(value);
}

function normalizeDisplayDigits(value: string, maxDigits?: number) {
  const normalized = normalizeMoneyInput(value);

  return maxDigits ? normalized.slice(0, maxDigits) : normalized;
}

function formatNumericDisplayValue(
  value: string,
  displayFormat: NumericDisplayFormat,
) {
  const normalized = normalizeMoneyInput(value);

  if (!normalized) {
    return "";
  }

  const numericValue = Number.parseInt(normalized, 10);

  if (!Number.isFinite(numericValue)) {
    return "";
  }

  if (displayFormat === "currency") {
    return numericValue.toLocaleString("ko-KR");
  }

  return String(numericValue);
}

function getNumericDisplaySuffix(displayFormat: NumericDisplayFormat) {
  if (displayFormat === "percentage") {
    return "%";
  }

  if (displayFormat === "months") {
    return "개월";
  }

  return "원";
}

function getNumericDisplayPaddingClassName(displayFormat: NumericDisplayFormat) {
  if (displayFormat === "currency") {
    return "pr-14";
  }

  if (displayFormat === "months") {
    return "pr-12";
  }

  return "pr-10";
}

function FormattedNumberInput({
  ariaLabel,
  displayFormat,
  maxDigits,
  name,
  onValueChange,
  placeholder,
  required,
  value,
}: {
  ariaLabel: string;
  displayFormat: NumericDisplayFormat;
  maxDigits?: number;
  name: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  value: string;
}) {
  const displayValue = formatNumericDisplayValue(value, displayFormat);
  const suffix = getNumericDisplaySuffix(displayFormat);

  return (
    <>
      <input name={name} type="hidden" value={value} />
      <div className="relative">
        <input
          aria-label={ariaLabel}
          className={`${pricingFieldClassName} ${displayValue ? getNumericDisplayPaddingClassName(displayFormat) : ""}`}
          inputMode="numeric"
          onChange={(event) =>
            onValueChange(normalizeDisplayDigits(event.target.value, maxDigits))
          }
          placeholder={placeholder}
          required={required}
          type="text"
          value={displayValue}
        />
        {displayValue ? (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-medium text-slate-500">
            {suffix}
          </span>
        ) : null}
      </div>
    </>
  );
}

function StepButton({
  title,
  eyebrow,
  active,
  complete,
  disabled,
  onClick,
}: {
  title: string;
  eyebrow: string;
  active: boolean;
  complete: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-xl border px-4 py-3.5 text-left transition ${
        disabled
          ? "cursor-not-allowed border-stone-200 bg-stone-100/90 text-slate-400 shadow-none"
          : active
          ? "border-amber-300 bg-amber-50/85 text-stone-950 shadow-[0_12px_24px_-22px_rgba(180,83,9,0.42)]"
          : complete
            ? "cursor-pointer border-teal-200 bg-teal-50 text-teal-950 hover:-translate-y-px hover:shadow-[0_12px_24px_-22px_rgba(13,148,136,0.45)]"
            : "cursor-pointer border-stone-200 bg-white text-slate-700 hover:-translate-y-px hover:border-amber-200 hover:bg-amber-50/70 hover:shadow-[0_12px_24px_-22px_rgba(15,23,42,0.2)]"
      }`}
    >
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {eyebrow}
      </p>
      <p className="mt-1.5 text-sm font-semibold">{title}</p>
    </button>
  );
}

function WizardNav({
  currentStep,
  moveToStep,
  canGoNext,
}: {
  currentStep: number;
  moveToStep: (step: number) => void;
  canGoNext: boolean;
}) {
  return (
    <div className="mt-5 flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={() => moveToStep(currentStep - 1)}
        disabled={currentStep === 0}
        className={`${secondaryButtonClassName} h-10 px-4 disabled:border-stone-200 disabled:text-slate-400`}
      >
        이전 단계
      </button>
      <button
        type="button"
        onClick={() => moveToStep(currentStep + 1)}
        disabled={!canGoNext}
        className={`${primaryButtonClassName} h-10 px-5`}
      >
        다음 단계
      </button>
    </div>
  );
}

function CreateSaleSubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={`${primaryButtonClassName} h-10 px-5`}
    >
      {pending ? "판매 저장 중..." : "판매 등록"}
    </button>
  );
}

export function SalesEntryForm({
  currentUserId,
  currentUserName,
  defaultSaleDate,
  customers,
  carriers,
  availableInventory,
  discountPolicies,
  saleProfitPolicies,
  staffCommissionPolicies,
  initialCustomerId,
}: SalesEntryFormProps) {
  const initialResolvedCustomerId = customers.some(
    (customer) => customer.id === initialCustomerId,
  )
    ? (initialCustomerId ?? "")
    : (customers[0]?.id ?? "");
  const initialSelectedCustomer =
    customers.find((customer) => customer.id === initialResolvedCustomerId) ?? null;
  const initialMappedSelection = resolveCustomerMappedSelection({
    customer: initialSelectedCustomer,
    currentInventoryItemId: availableInventory[0]?.id ?? "",
    availableInventory,
    carriers,
  });

  const [customerId, setCustomerId] = useState(initialResolvedCustomerId);
  const [inventoryItemId, setInventoryItemId] = useState(
    initialMappedSelection
      ? (initialMappedSelection.inventoryItemId ?? "")
      : (availableInventory[0]?.id ?? ""),
  );
  const [saleDate, setSaleDate] = useState(defaultSaleDate);
  const [ratePlanId, setRatePlanId] = useState(
    initialMappedSelection?.inventoryItemId ? initialMappedSelection.ratePlanId : "",
  );
  const [selectedAddOnServiceIds, setSelectedAddOnServiceIds] = useState<string[]>(
    initialMappedSelection?.inventoryItemId
      ? initialMappedSelection.selectedAddOnServiceIds
      : [],
  );
  const [listPrice, setListPrice] = useState("");
  const [discountApplied, setDiscountApplied] = useState(true);
  const [manualDiscountMethod, setManualDiscountMethod] = useState("");
  const [manualDiscountValue, setManualDiscountValue] = useState("");
  const [rebateAmount, setRebateAmount] = useState("");
  const [subsidyAmount, setSubsidyAmount] = useState("");
  const [cashAmount, setCashAmount] = useState("");
  const [cardAmount, setCardAmount] = useState("");
  const [bankTransferAmount, setBankTransferAmount] = useState("");
  const [cardInstallmentMonths, setCardInstallmentMonths] = useState("");
  const [notes, setNotes] = useState("");
  const [currentStep, setCurrentStep] = useState(0);

  const selectedInventory =
    availableInventory.find((item) => item.id === inventoryItemId) ?? null;
  const selectedCustomer = customers.find((item) => item.id === customerId) ?? null;
  const selectedCarrier =
    carriers.find((carrier) => carrier.id === selectedInventory?.carrierId) ?? null;
  const availableRatePlans = selectedCarrier?.ratePlans ?? [];
  const availableAddOnServices = selectedCarrier?.addOnServices ?? [];
  const availableServiceIds = new Set(
    availableAddOnServices.map((service) => service.id),
  );
  const effectiveRatePlanId = availableRatePlans.some(
    (ratePlan) => ratePlan.id === ratePlanId,
  )
    ? ratePlanId
    : (availableRatePlans[0]?.id ?? "");
  const effectiveSelectedAddOnServiceIds = selectedAddOnServiceIds.filter(
    (serviceId) => availableServiceIds.has(serviceId),
  );

  const parsedListPrice = parseOptionalInteger(listPrice) ?? 0;
  const parsedManualDiscountValue = parseOptionalInteger(manualDiscountValue);
  const parsedRebateAmount = parseOptionalInteger(rebateAmount);
  const parsedSubsidyAmount = parseOptionalInteger(subsidyAmount);
  const parsedCashAmount = parseOptionalInteger(cashAmount);
  const parsedCardAmount = parseOptionalInteger(cardAmount);
  const parsedBankTransferAmount = parseOptionalInteger(bankTransferAmount);
  const parsedCardInstallmentMonths = parseOptionalInteger(cardInstallmentMonths);

  const manualDiscountConfigured =
    manualDiscountMethod.length > 0 || manualDiscountValue.trim().length > 0;
  const manualDiscountIsValidMethod =
    manualDiscountMethod === "PERCENTAGE" ||
    manualDiscountMethod === "FIXED_AMOUNT";
  const manualDiscountIsInvalid =
    manualDiscountConfigured &&
    (!manualDiscountIsValidMethod ||
      parsedManualDiscountValue === null ||
      (manualDiscountMethod === "PERCENTAGE" &&
        parsedManualDiscountValue > 100) ||
      (manualDiscountMethod === "FIXED_AMOUNT" &&
        parsedManualDiscountValue > parsedListPrice));

  const numericInputHasError =
    (subsidyAmount.trim().length > 0 && parsedSubsidyAmount === null) ||
    (cashAmount.trim().length > 0 && parsedCashAmount === null) ||
    (cardAmount.trim().length > 0 && parsedCardAmount === null) ||
    (bankTransferAmount.trim().length > 0 && parsedBankTransferAmount === null) ||
    (rebateAmount.trim().length > 0 && parsedRebateAmount === null) ||
    (cardInstallmentMonths.trim().length > 0 &&
      parsedCardInstallmentMonths === null);

  const saleDateForPolicies = saleDate
    ? parseSaleDateForPolicyMatch(saleDate)
    : null;
  const suggestedDiscountPolicy =
    selectedInventory && saleDateForPolicies
      ? findMatchingDiscountPolicy(
          discountPolicies,
          saleDateForPolicies,
          selectedInventory.deviceModelId,
        )
      : null;
  const matchedSaleProfitPolicy =
    selectedInventory && saleDateForPolicies
      ? findMatchingSaleProfitPolicy(
          saleProfitPolicies,
          saleDateForPolicies,
          selectedInventory.carrierId,
        )
      : null;
  const matchedStaffCommissionPolicy =
    selectedInventory && saleDateForPolicies
      ? findMatchingStaffCommissionPolicy(
          staffCommissionPolicies,
          saleDateForPolicies,
          currentUserId,
        )
      : null;

  const effectiveDiscountMethod: DiscountMethodValue | null = discountApplied
    ? manualDiscountIsValidMethod
      ? manualDiscountMethod
      : (suggestedDiscountPolicy?.discountMethod ?? null)
    : null;
  const effectiveDiscountValue = discountApplied
    ? parsedManualDiscountValue ?? suggestedDiscountPolicy?.discountValue ?? null
    : null;
  const effectiveRebateAmount = parsedRebateAmount ?? 0;
  const effectiveSubsidyAmount = parsedSubsidyAmount ?? 0;
  const effectiveCashAmount = parsedCashAmount ?? 0;
  const effectiveCardAmount = parsedCardAmount ?? 0;
  const effectiveBankTransferAmount = parsedBankTransferAmount ?? 0;

  const baseCalculation = calculateSalesAmounts({
    listPrice: parsedListPrice,
    subsidyAmount: effectiveSubsidyAmount,
    discountApplied,
    discountMethod: effectiveDiscountMethod,
    discountValue: effectiveDiscountValue,
    rebateAmount: effectiveRebateAmount,
    policyRevenueAmount: 0,
    profitDeductionAmount: 0,
    cashAmount: effectiveCashAmount,
    cardAmount: effectiveCardAmount,
    bankTransferAmount: effectiveBankTransferAmount,
  });

  const effectivePolicyRevenueAmount = matchedSaleProfitPolicy
    ? calculatePolicyRevenueAmount(
        baseCalculation.finalSalePrice,
        matchedSaleProfitPolicy.calculationMethod,
        matchedSaleProfitPolicy.calculationValue,
      )
    : 0;
  const effectiveStaffCommissionAmount = matchedStaffCommissionPolicy
    ? calculatePolicyRevenueAmount(
        baseCalculation.finalSalePrice,
        matchedStaffCommissionPolicy.calculationMethod,
        matchedStaffCommissionPolicy.calculationValue,
      )
    : 0;

  const previewCalculation = calculateSalesAmounts({
    listPrice: parsedListPrice,
    subsidyAmount: effectiveSubsidyAmount,
    discountApplied,
    discountMethod: effectiveDiscountMethod,
    discountValue: effectiveDiscountValue,
    rebateAmount: effectiveRebateAmount,
    policyRevenueAmount: effectivePolicyRevenueAmount,
    profitDeductionAmount: effectiveStaffCommissionAmount,
    cashAmount: effectiveCashAmount,
    cardAmount: effectiveCardAmount,
    bankTransferAmount: effectiveBankTransferAmount,
  });

  const discountIssue =
    !discountApplied
      ? null
      : manualDiscountIsInvalid
        ? "수동 할인값이 올바르지 않습니다."
        : !effectiveDiscountMethod || effectiveDiscountValue === null
          ? "할인을 적용하려면 매칭 정책이 있거나 수동 할인값을 입력해야 합니다."
          : null;
  const subsidyIssue =
    effectiveSubsidyAmount > baseCalculation.discountedPrice
      ? "지원금은 할인 후 금액을 초과할 수 없습니다."
      : null;
  const paymentIssue =
    previewCalculation.actualReceivedAmount > previewCalculation.finalSalePrice
      ? "수납 금액 합계가 최종 판매가를 초과합니다."
      : null;
  const formIssue =
    numericInputHasError || parsedListPrice <= 0
      ? "금액 필드는 0 이상 숫자로 입력해야 합니다."
      : subsidyIssue ?? discountIssue ?? paymentIssue;
  const submitDisabled =
    !selectedCustomer ||
    !selectedInventory ||
    !saleDate ||
    parsedListPrice <= 0 ||
    Boolean(formIssue);

  function handleCustomerSelection(nextCustomerId: string) {
    const nextCustomer = customers.find((customer) => customer.id === nextCustomerId) ?? null;
    const mappedSelection = resolveCustomerMappedSelection({
      customer: nextCustomer,
      currentInventoryItemId: inventoryItemId,
      availableInventory,
      carriers,
    });

    setCustomerId(nextCustomerId);

    if (!mappedSelection) {
      return;
    }

    setInventoryItemId(mappedSelection.inventoryItemId ?? "");
    setRatePlanId(mappedSelection.inventoryItemId ? mappedSelection.ratePlanId : "");
    setSelectedAddOnServiceIds((current) =>
      areStringArraysEqual(current, mappedSelection.selectedAddOnServiceIds)
        ? current
        : mappedSelection.inventoryItemId
          ? mappedSelection.selectedAddOnServiceIds
          : [],
    );
  }

  const basicsStepValid =
    Boolean(selectedCustomer) &&
    Boolean(selectedInventory) &&
    Boolean(saleDate) &&
    (availableRatePlans.length === 0 || Boolean(effectiveRatePlanId));
  const pricingStepValid = parsedListPrice > 0 && !formIssue;
  const manualDiscountDisplayFormat: NumericDisplayFormat =
    manualDiscountMethod === "PERCENTAGE" ? "percentage" : "currency";
  const manualDiscountPlaceholder =
    manualDiscountMethod === "PERCENTAGE" ? "8%" : "120,000원";

  function canMoveToStep(nextStep: number) {
    const boundedStep = Math.max(0, Math.min(nextStep, saleSteps.length - 1));

    if (boundedStep > 1 && !pricingStepValid) {
      return false;
    }

    if (boundedStep > 0 && !basicsStepValid) {
      return false;
    }

    return true;
  }

  function moveToStep(nextStep: number) {
    const boundedStep = Math.max(0, Math.min(nextStep, saleSteps.length - 1));

    if (!canMoveToStep(boundedStep)) {
      return;
    }

    setCurrentStep(boundedStep);
  }

  if (customers.length === 0 || availableInventory.length === 0) {
    return (
      <div className={surfaceClassName}>
        <p className="text-sm leading-6 text-slate-600">
          {customers.length === 0
            ? "등록된 고객이 없어 판매를 입력할 수 없습니다. 먼저 고객 관리에서 고객을 등록해 주세요."
            : "판매 가능한 재고가 없어 판매를 입력할 수 없습니다. 재고 관리에서 입고 상태 재고를 확인해 주세요."}
        </p>
      </div>
    );
  }

  return (
    <form
      action={createSaleAction}
      className="grid gap-6 xl:grid-cols-[1.06fr_0.94fr]"
    >
      <input name="customerId" type="hidden" value={customerId} />
      <input name="inventoryItemId" type="hidden" value={inventoryItemId} />
      <input name="ratePlanId" type="hidden" value={effectiveRatePlanId} />
      {currentStep !== 0 ? (
        <input name="saleDate" type="hidden" value={saleDate} />
      ) : null}
      {currentStep !== 1 ? (
        <>
          <input name="listPrice" type="hidden" value={listPrice} />
          <input
            name="discountApplied"
            type="hidden"
            value={discountApplied ? "true" : "false"}
          />
          <input name="discountMethod" type="hidden" value={manualDiscountMethod} />
          <input name="discountValue" type="hidden" value={manualDiscountValue} />
          <input name="rebateAmount" type="hidden" value={rebateAmount} />
          <input name="subsidyAmount" type="hidden" value={subsidyAmount} />
          <input name="cashAmount" type="hidden" value={cashAmount} />
          <input name="cardAmount" type="hidden" value={cardAmount} />
          <input
            name="bankTransferAmount"
            type="hidden"
            value={bankTransferAmount}
          />
          <input
            name="cardInstallmentMonths"
            type="hidden"
            value={cardInstallmentMonths}
          />
          <input name="notes" type="hidden" value={notes} />
        </>
      ) : null}
      {effectiveSelectedAddOnServiceIds.map((serviceId) => (
        <input key={serviceId} name="addOnServiceIds" type="hidden" value={serviceId} />
      ))}

      <div className="xl:col-span-2">
        <div className="grid gap-3 md:grid-cols-3">
          {saleSteps.map((step, index) => (
            <StepButton
              key={step.key}
              eyebrow={step.eyebrow}
              title={step.title}
              active={currentStep === index}
              complete={currentStep > index}
              disabled={index > currentStep && !canMoveToStep(index)}
              onClick={() => moveToStep(index)}
            />
          ))}
        </div>
      </div>

      <section className={currentStep === 0 ? "xl:col-span-2" : "space-y-4"}>
        {currentStep === 0 ? (
          <SalesEntryBasicsStep
            availableAddOnServices={availableAddOnServices}
            availableInventory={availableInventory}
            availableRatePlans={availableRatePlans}
            basicsStepValid={basicsStepValid}
            currentUserName={currentUserName}
            customerId={customerId}
            customers={customers}
            effectiveRatePlanId={effectiveRatePlanId}
            effectiveSelectedAddOnServiceIds={effectiveSelectedAddOnServiceIds}
            inventoryItemId={inventoryItemId}
            moveToStep={moveToStep}
            saleDate={saleDate}
            selectedCustomer={selectedCustomer}
            selectedInventory={selectedInventory}
            setCustomerId={handleCustomerSelection}
            setInventoryItemId={setInventoryItemId}
            setRatePlanId={setRatePlanId}
            setSaleDate={setSaleDate}
            setSelectedAddOnServiceIds={setSelectedAddOnServiceIds}
          />
        ) : null}

        {currentStep === 1 ? (
          <article className={surfaceClassName}>
            <h3 className="text-lg font-semibold tracking-[-0.03em] text-slate-950">
              할인, 리베이트, 수납 입력
            </h3>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <label className={labelClassName}>
                <span>판매가</span>
                <FormattedNumberInput
                  ariaLabel="판매가"
                  displayFormat="currency"
                  name="listPrice"
                  onValueChange={setListPrice}
                  placeholder="1,280,000원"
                  required
                  value={listPrice}
                />
              </label>

              <label className={labelClassName}>
                <span>할인 적용</span>
                <SelectControl
                  aria-label="할인 적용"
                  name="discountApplied"
                  value={discountApplied ? "true" : "false"}
                  onValueChange={(nextValue) =>
                    setDiscountApplied(nextValue === "true")
                  }
                  className={pricingSelectClassName}
                >
                  <option value="true">적용</option>
                  <option value="false">미적용</option>
                </SelectControl>
              </label>

              <label className={labelClassName}>
                <span>수동 할인 방식</span>
                <SelectControl
                  aria-label="수동 할인 방식"
                  name="discountMethod"
                  value={manualDiscountMethod}
                  onValueChange={setManualDiscountMethod}
                  className={pricingSelectClassName}
                >
                  <option value="">자동 정책 사용</option>
                  <option value="PERCENTAGE">퍼센트</option>
                  <option value="FIXED_AMOUNT">정액</option>
                </SelectControl>
              </label>

              <label className={labelClassName}>
                <span>수동 할인값</span>
                <FormattedNumberInput
                  ariaLabel="수동 할인값"
                  displayFormat={manualDiscountDisplayFormat}
                  maxDigits={manualDiscountMethod === "PERCENTAGE" ? 3 : undefined}
                  name="discountValue"
                  onValueChange={setManualDiscountValue}
                  placeholder={manualDiscountPlaceholder}
                  value={manualDiscountValue}
                />
              </label>

              <label className={labelClassName}>
                <span>리베이트 금액</span>
                <FormattedNumberInput
                  ariaLabel="리베이트 금액"
                  displayFormat="currency"
                  name="rebateAmount"
                  onValueChange={setRebateAmount}
                  placeholder="직접 입력 또는 0원"
                  value={rebateAmount}
                />
              </label>

              <label className={labelClassName}>
                <span>지원금</span>
                <FormattedNumberInput
                  ariaLabel="지원금"
                  displayFormat="currency"
                  name="subsidyAmount"
                  onValueChange={setSubsidyAmount}
                  placeholder="0원"
                  value={subsidyAmount}
                />
              </label>

              <label className={labelClassName}>
                <span>현금 수납</span>
                <FormattedNumberInput
                  ariaLabel="현금 수납"
                  displayFormat="currency"
                  name="cashAmount"
                  onValueChange={setCashAmount}
                  placeholder="0원"
                  value={cashAmount}
                />
              </label>

              <label className={labelClassName}>
                <span>카드 수납</span>
                <FormattedNumberInput
                  ariaLabel="카드 수납"
                  displayFormat="currency"
                  name="cardAmount"
                  onValueChange={setCardAmount}
                  placeholder="0원"
                  value={cardAmount}
                />
              </label>

              <label className={labelClassName}>
                <span>계좌이체 수납</span>
                <FormattedNumberInput
                  ariaLabel="계좌이체 수납"
                  displayFormat="currency"
                  name="bankTransferAmount"
                  onValueChange={setBankTransferAmount}
                  placeholder="0원"
                  value={bankTransferAmount}
                />
              </label>

              <label className={labelClassName}>
                <span>카드 할부 개월</span>
                <FormattedNumberInput
                  ariaLabel="카드 할부 개월"
                  displayFormat="months"
                  name="cardInstallmentMonths"
                  onValueChange={setCardInstallmentMonths}
                  placeholder="예: 24개월"
                  value={cardInstallmentMonths}
                />
              </label>
            </div>

            <div className="mt-5 space-y-3">
              {false ? (
              <div>
                <p className="text-sm font-medium text-slate-700">부가서비스</p>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {availableAddOnServices.length > 0 ? (
                    availableAddOnServices.map((service) => {
                      const checked = effectiveSelectedAddOnServiceIds.includes(
                        service.id,
                      );

                      return (
                        <label
                          key={service.id}
                          className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                        >
                          <span className="space-y-1">
                            <span className="block font-medium text-slate-900">
                              {service.name}
                            </span>
                            <span className="block text-xs text-slate-500">
                              {service.scope === "shared"
                                ? "공통"
                                : "통신사 전용"}{" "}
                              /{" "}
                              {service.monthlyFee !== null
                                ? formatWon(service.monthlyFee)
                                : "월 요금 미정"}
                            </span>
                          </span>
                          <input
                            type="checkbox"
                            name="addOnServiceIds"
                            value={service.id}
                            checked={checked}
                            onChange={(event) => {
                              setSelectedAddOnServiceIds((current) => {
                                const safeCurrent = current.filter((value) =>
                                  availableServiceIds.has(value),
                                );

                                return event.target.checked
                                  ? [...safeCurrent, service.id]
                                  : safeCurrent.filter((value) => value !== service.id);
                              });
                            }}
                            className="h-4 w-4 accent-slate-950"
                          />
                        </label>
                      );
                    })
                  ) : (
                    <p className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-500 md:col-span-2">
                      선택 가능한 부가서비스가 없습니다.
                    </p>
                  )}
                </div>
              </div>
              ) : null}

              <label className={`${labelClassName} block`}>
                <span>메모</span>
                <textarea
                  name="notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className={`${controlClassName} min-h-28 resize-y`}
                  placeholder="상담 메모, 프로모션 메모, 미수금 안내 메모"
                  rows={4}
                />
              </label>
            </div>

            <WizardNav
              currentStep={currentStep}
              moveToStep={moveToStep}
              canGoNext={pricingStepValid}
            />
          </article>
        ) : null}

        {currentStep === 2 ? (
          <article className={surfaceClassName}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Final Review
            </p>
            <h3 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-slate-950">
              등록 전 최종 검토
            </h3>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-white/70 bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  고객
                </p>
                <p className="mt-2 font-medium text-slate-900">
                  {selectedCustomer?.name ?? "-"}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedCustomer?.phone ?? "-"}
                </p>
              </div>
              <div className="rounded-lg border border-white/70 bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  재고
                </p>
                <p className="mt-2 font-medium text-slate-900">
                  {selectedInventory
                    ? `${selectedInventory.carrierName} ${selectedInventory.deviceModelName}`
                    : "-"}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedInventory
                    ? `${selectedInventory.color} / ${selectedInventory.capacity} / IMEI ${selectedInventory.imei}`
                    : "-"}
                </p>
              </div>
              <div className="rounded-lg border border-white/70 bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  판매 조건
                </p>
                <p className="mt-2 font-medium text-slate-900">판매일 {saleDate}</p>
                <p className="mt-1 text-sm text-slate-500">
                  요금제{" "}
                  {availableRatePlans.find(
                    (ratePlan) => ratePlan.id === effectiveRatePlanId,
                  )?.name ?? "미선택"}
                </p>
              </div>
              <div className="rounded-lg border border-white/70 bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  수납 계획
                </p>
                <p className="mt-2 font-medium text-slate-900">
                  현금 {formatWon(effectiveCashAmount)} / 카드{" "}
                  {formatWon(effectiveCardAmount)}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  계좌이체 {formatWon(effectiveBankTransferAmount)} / 미수{" "}
                  {formatWon(previewCalculation.receivableAmount)}
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => moveToStep(1)}
                className={`${secondaryButtonClassName} h-10 px-4`}
              >
                이전 단계
              </button>
              <CreateSaleSubmitButton disabled={submitDisabled} />
            </div>
          </article>
        ) : null}
      </section>

      {currentStep >= 1 ? <aside className="space-y-4">
        {currentStep === 0 ? (
          <article className={surfaceClassName}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Step Guide
            </p>
            <h3 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-slate-950">
              선택 기준 확인
            </h3>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="rounded-lg border border-white/70 bg-white px-4 py-3">
                고객과 재고를 먼저 확정하면 이후 정책 매칭과 수납 계산이 같은
                기준으로 따라옵니다.
              </div>
              <div className="rounded-lg border border-white/70 bg-white px-4 py-3">
                판매 가능한 재고만 선택되며, 고객 현재 회선과 재고 통신사를 같이
                비교할 수 있습니다.
              </div>
            </div>
          </article>
        ) : null}

        {currentStep >= 1 ? (
          <article className={surfaceClassName}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Live Preview
            </p>
            <h3 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-slate-950">
              실시간 계산 결과
            </h3>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-white/70 bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  할인
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {formatWon(previewCalculation.discountAmount)}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {getDiscountLabel(effectiveDiscountMethod, effectiveDiscountValue)}
                </p>
              </div>
              <div className="rounded-lg border border-white/70 bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  최종 판매가
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {formatWon(previewCalculation.finalSalePrice)}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  할인 후 {formatWon(previewCalculation.discountedPrice)} / 지원금{" "}
                  {formatWon(effectiveSubsidyAmount)}
                </p>
              </div>
              <div className="rounded-lg border border-white/70 bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  미수금
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {formatWon(previewCalculation.receivableAmount)}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  수납 합계 {formatWon(previewCalculation.actualReceivedAmount)}
                </p>
              </div>
              <div className="rounded-lg border border-white/70 bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  총이익
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {formatWon(previewCalculation.totalProfitAmount)}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  리베이트 {formatWon(effectiveRebateAmount)} / 통신사 할인{" "}
                  {formatWon(effectivePolicyRevenueAmount)} / 수수료 차감{" "}
                  {formatWon(effectiveStaffCommissionAmount)}
                </p>
              </div>
            </div>

            {formIssue ? (
              <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-800">
                {formIssue}
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm leading-6 text-teal-900">
                서버 액션에서 같은 계산 규칙으로 다시 검증한 뒤 저장합니다.
              </div>
            )}
          </article>
        ) : null}

        {currentStep >= 1 ? (
          <article className={surfaceClassName}>
            <h3 className="text-lg font-semibold tracking-[-0.03em] text-slate-950">
              정책 매칭
            </h3>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="rounded-lg border border-white/70 bg-white px-4 py-3">
                <p className="font-medium text-slate-900">단말기 할인 정책</p>
                <p className="mt-1">
                  {suggestedDiscountPolicy
                    ? `${suggestedDiscountPolicy.name} / ${getDiscountLabel(
                        suggestedDiscountPolicy.discountMethod,
                        suggestedDiscountPolicy.discountValue,
                      )}`
                    : "매칭 없음"}
                </p>
              </div>
              <div className="rounded-lg border border-white/70 bg-white px-4 py-3">
                <p className="font-medium text-slate-900">통신사 할인 정책</p>
                <p className="mt-1">
                  {matchedSaleProfitPolicy
                    ? `${matchedSaleProfitPolicy.name} / ${
                        matchedSaleProfitPolicy.calculationMethod === "PERCENTAGE"
                          ? `${matchedSaleProfitPolicy.calculationValue}%`
                          : matchedSaleProfitPolicy.calculationMethod ===
                              "FIXED_AMOUNT"
                            ? formatWon(matchedSaleProfitPolicy.calculationValue)
                            : "없음"
                      }`
                    : "매칭 없음"}
                </p>
              </div>
              <div className="rounded-lg border border-white/70 bg-white px-4 py-3">
                <p className="font-medium text-slate-900">직원 수수료 정책</p>
                <p className="mt-1">
                  {matchedStaffCommissionPolicy
                    ? `${matchedStaffCommissionPolicy.name} / ${
                        matchedStaffCommissionPolicy.calculationMethod ===
                        "PERCENTAGE"
                          ? `${matchedStaffCommissionPolicy.calculationValue}%`
                          : matchedStaffCommissionPolicy.calculationMethod ===
                              "FIXED_AMOUNT"
                            ? formatWon(
                                matchedStaffCommissionPolicy.calculationValue,
                              )
                            : "없음"
                      }`
                    : "매칭 없음"}
                </p>
              </div>
            </div>
          </article>
        ) : null}
      </aside> : null}
    </form>
  );
}
