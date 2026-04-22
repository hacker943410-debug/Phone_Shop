"use client";

import {
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { useFormStatus } from "react-dom";

import { createSaleAction } from "@/app/actions/sales";
import { CustomerUpsertDialog } from "@/components/workspace/customer-upsert-dialog";
import { formatWon } from "@/lib/formatters";
import { normalizeMoneyInput } from "@/lib/phone-utils";
import type { CustomerUpsertActionCustomer } from "@/lib/customer-upsert-action-state";
import {
  additionalProductDefinitions,
  getAllowedWirelessProductCodes,
  getSaleActivationTypeLabel,
  getSaleCustomerEntryTypeLabel,
  type AdditionalProductCode,
  type SaleActivationType,
  type SaleCustomerEntryType,
  type WiredProductCode,
  type WirelessProductCode,
  wiredProductDefinitions,
  wirelessProductDefinitions,
} from "@/lib/sale-registration";
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
  SalesAgencyRecord,
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

const saleRegistrationSteps = [
  {
    key: "customer-entry",
    eyebrow: "Step 1",
    title: "고객 구분 선택",
    description: "기존 고객인지 신규 고객인지 먼저 정합니다.",
  },
  {
    key: "activation",
    eyebrow: "Step 2",
    title: "가입 유형 선택",
    description: "기기변경, 신규가입, 번호이동 중 판매 유형을 정합니다.",
  },
  {
    key: "setup",
    eyebrow: "Step 3",
    title: "선입력 구성",
    description: "거래 대리점과 상품 구성을 체크한 뒤 기존 등록 흐름으로 넘어갑니다.",
  },
  {
    key: "basics",
    eyebrow: "Step 4",
    title: "고객과 재고 선택",
    description: "고객, 판매할 재고, 요금제와 부가서비스를 확인합니다.",
  },
  {
    key: "pricing",
    eyebrow: "Step 5",
    title: "금액과 수납 입력",
    description: "할인, 리베이트, 지원금, 수납 계획을 입력합니다.",
  },
  {
    key: "review",
    eyebrow: "Step 6",
    title: "최종 검토와 등록",
    description: "계산 결과와 연결 정책을 확인한 뒤 판매를 등록합니다.",
  },
] as const;

function SelectionCardIcon({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "amber" | "blue" | "emerald";
}) {
  const toneClassName =
    tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : tone === "emerald"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-blue-200 bg-blue-50 text-blue-700";

  return (
    <div
      className={`flex h-16 w-16 items-center justify-center rounded-[1.2rem] border ${toneClassName}`}
    >
      {children}
    </div>
  );
}

function FlowChoiceCard({
  active,
  description,
  icon,
  onClick,
  title,
}: {
  active: boolean;
  description: string;
  icon: ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      className={`group flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border px-6 py-6 text-center transition duration-200 ${
        active
          ? "border-amber-300 bg-amber-50/90 text-slate-950 shadow-[0_22px_40px_-30px_rgba(180,83,9,0.38)]"
          : "border-stone-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(245,243,239,0.98)_100%)] text-slate-700 shadow-[0_24px_50px_-40px_rgba(15,23,42,0.32)] hover:-translate-y-1 hover:border-amber-200 hover:shadow-[0_28px_60px_-38px_rgba(180,83,9,0.24)]"
      }`}
      onClick={onClick}
      type="button"
    >
      {icon}
      <h4 className="mt-5 text-xl font-semibold tracking-[-0.04em] text-slate-950">
        {title}
      </h4>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </button>
  );
}

function ProductToggleCard({
  active,
  disabled = false,
  label,
  onClick,
}: {
  active: boolean;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full border px-4 py-2.5 text-sm font-semibold transition ${
        disabled
          ? "cursor-not-allowed border-stone-200 bg-stone-100 text-slate-400"
          : active
            ? "border-amber-300 bg-amber-50 text-amber-900 shadow-[0_16px_28px_-24px_rgba(180,83,9,0.36)]"
            : "cursor-pointer border-stone-200 bg-white text-slate-700 hover:-translate-y-px hover:border-amber-200 hover:bg-amber-50/70"
      }`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

interface SalesEntryFormProps {
  currentUserId: string;
  currentUserName: string;
  defaultSaleDate: string;
  customers: SalesCustomerRecord[];
  carriers: SalesCarrierRecord[];
  salesAgencies: SalesAgencyRecord[];
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

function toSalesCustomerRecord(
  customer: CustomerUpsertActionCustomer,
): SalesCustomerRecord {
  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    currentCarrierId: customer.currentCarrierId,
    currentCarrierName: customer.currentCarrierName,
    retentionDisplay: null,
    retentionRemainingDays: null,
    latestSaleDeviceModelId: null,
    latestSaleRatePlanId: null,
    latestSaleAddOnServiceIds: [],
  };
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
  salesAgencies,
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
    : "";
  const initialSelectedCustomer =
    customers.find((customer) => customer.id === initialResolvedCustomerId) ?? null;
  const initialMappedSelection = resolveCustomerMappedSelection({
    customer: initialSelectedCustomer,
    currentInventoryItemId: availableInventory[0]?.id ?? "",
    availableInventory,
    carriers,
  });

  const [customerOptions, setCustomerOptions] = useState<SalesCustomerRecord[]>(customers);
  const [customerEntryType, setCustomerEntryType] = useState<SaleCustomerEntryType | null>(
    initialCustomerId ? "EXISTING" : null,
  );
  const [activationType, setActivationType] = useState<SaleActivationType | null>(null);
  const [salesAgencyId, setSalesAgencyId] = useState("");
  const [selectedWirelessProducts, setSelectedWirelessProducts] = useState<
    WirelessProductCode[]
  >([]);
  const [selectedWiredProducts, setSelectedWiredProducts] = useState<WiredProductCode[]>([]);
  const [selectedAdditionalProducts, setSelectedAdditionalProducts] = useState<
    AdditionalProductCode[]
  >([]);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
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

  useEffect(() => {
    setCustomerOptions((current) => {
      const merged = new Map<string, SalesCustomerRecord>();

      for (const customer of current) {
        merged.set(customer.id, customer);
      }

      for (const customer of customers) {
        merged.set(customer.id, customer);
      }

      return [...merged.values()];
    });
  }, [customers]);

  const selectedInventory =
    availableInventory.find((item) => item.id === inventoryItemId) ?? null;
  const selectedCustomer = customerOptions.find((item) => item.id === customerId) ?? null;
  const selectedCarrier =
    carriers.find((carrier) => carrier.id === selectedInventory?.carrierId) ?? null;
  const selectedSalesAgency =
    salesAgencies.find((salesAgency) => salesAgency.id === salesAgencyId) ?? null;
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
  const allowedWirelessProducts = getAllowedWirelessProductCodes(activationType);
  const effectiveSelectedWirelessProducts = selectedWirelessProducts.filter((productCode) =>
    allowedWirelessProducts.includes(productCode),
  );
  const selectedRatePlan =
    availableRatePlans.find((ratePlan) => ratePlan.id === effectiveRatePlanId) ?? null;
  const selectedWirelessProductLabels = wirelessProductDefinitions
    .filter((definition) => effectiveSelectedWirelessProducts.includes(definition.code))
    .map((definition) => definition.label);
  const selectedWiredProductLabels = wiredProductDefinitions
    .filter((definition) => selectedWiredProducts.includes(definition.code))
    .map((definition) => definition.label);
  const selectedAdditionalProductLabels = additionalProductDefinitions
    .filter((definition) => selectedAdditionalProducts.includes(definition.code))
    .map((definition) => definition.label);

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

  function toggleProductSelection<T extends string>(
    value: T,
    setter: Dispatch<SetStateAction<T[]>>,
  ) {
    setter((items) =>
      items.includes(value)
        ? items.filter((item) => item !== value)
        : [...items, value],
    );
  }

  function handleCustomerCreated(customer: CustomerUpsertActionCustomer) {
    const nextCustomer = toSalesCustomerRecord(customer);

    setCustomerOptions((current) => [
      nextCustomer,
      ...current.filter((item) => item.id !== nextCustomer.id),
    ]);
    setCustomerId(nextCustomer.id);
    setCustomerEntryType("NEW");
    setIsCustomerDialogOpen(false);
  }

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
  const setupIssue = !salesAgencyId
    ? "거래 대리점을 선택해 주세요."
    : effectiveSelectedWirelessProducts.length === 0 &&
        selectedWiredProducts.length === 0 &&
        selectedAdditionalProducts.length === 0
      ? "무선상품, 유선상품, 부가상품 중 최소 한 항목은 선택해 주세요."
      : null;
  const submitDisabled =
    !customerEntryType ||
    !activationType ||
    !salesAgencyId ||
    !selectedCustomer ||
    !selectedInventory ||
    !saleDate ||
    (effectiveSelectedWirelessProducts.length === 0 &&
      selectedWiredProducts.length === 0 &&
      selectedAdditionalProducts.length === 0) ||
    parsedListPrice <= 0 ||
    Boolean(formIssue);

  function handleCustomerSelection(nextCustomerId: string) {
    const nextCustomer =
      customerOptions.find((customer) => customer.id === nextCustomerId) ?? null;
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
  const customerEntryStepValid = Boolean(customerEntryType);
  const activationStepValid = Boolean(activationType);
  const setupStepValid = !setupIssue;
  const pricingStepValid = parsedListPrice > 0 && !formIssue;
  const manualDiscountDisplayFormat: NumericDisplayFormat =
    manualDiscountMethod === "PERCENTAGE" ? "percentage" : "currency";
  const manualDiscountPlaceholder =
    manualDiscountMethod === "PERCENTAGE" ? "8%" : "120,000원";

  function canMoveToStep(nextStep: number) {
    const boundedStep = Math.max(
      0,
      Math.min(nextStep, saleRegistrationSteps.length - 1),
    );

    if (boundedStep > 4 && !pricingStepValid) {
      return false;
    }

    if (boundedStep > 3 && !basicsStepValid) {
      return false;
    }

    if (boundedStep > 2 && !setupStepValid) {
      return false;
    }

    if (boundedStep > 1 && !activationStepValid) {
      return false;
    }

    if (boundedStep > 0 && !customerEntryStepValid) {
      return false;
    }

    return true;
  }

  function moveToStep(nextStep: number) {
    const boundedStep = Math.max(
      0,
      Math.min(nextStep, saleRegistrationSteps.length - 1),
    );

    if (!canMoveToStep(boundedStep)) {
      return;
    }

    setCurrentStep(boundedStep);
  }

  if (availableInventory.length === 0 || salesAgencies.length === 0) {
    const emptyStateMessage =
      availableInventory.length === 0 && salesAgencies.length === 0
        ? "판매 가능한 재고와 거래 대리점이 모두 준비되지 않았습니다. 재고 관리와 기초정보를 먼저 확인해 주세요."
        : availableInventory.length === 0
          ? "판매 가능한 재고가 없어 판매를 입력할 수 없습니다. 재고 관리에서 입고 상태 재고를 확인해 주세요."
          : "거래 대리점이 등록되지 않아 판매를 입력할 수 없습니다. 기초정보에서 거래 대리점을 먼저 등록해 주세요.";

    return (
      <div className={surfaceClassName}>
        <p className="text-sm leading-6 text-slate-600">{emptyStateMessage}</p>
      </div>
    );
  }

  const currentStepDefinition = saleRegistrationSteps[currentStep];

  return (
    <>
      <form
        action={createSaleAction}
        className="grid gap-6 xl:grid-cols-[1.06fr_0.94fr]"
      >
        <input name="customerId" type="hidden" value={customerId} />
        <input
          name="customerEntryType"
          type="hidden"
          value={customerEntryType ?? ""}
        />
        <input
          name="activationType"
          type="hidden"
          value={activationType ?? ""}
        />
        <input name="salesAgencyId" type="hidden" value={salesAgencyId} />
        <input name="inventoryItemId" type="hidden" value={inventoryItemId} />
        <input name="ratePlanId" type="hidden" value={effectiveRatePlanId} />
        <input
          name="wirelessPostpaidSelected"
          type="hidden"
          value={
            effectiveSelectedWirelessProducts.includes("POSTPAID") ? "true" : "false"
          }
        />
        <input
          name="wirelessPrepaidSelected"
          type="hidden"
          value={
            effectiveSelectedWirelessProducts.includes("PREPAID") ? "true" : "false"
          }
        />
        <input
          name="wirelessGeneralSelected"
          type="hidden"
          value={
            effectiveSelectedWirelessProducts.includes("GENERAL") ? "true" : "false"
          }
        />
        <input
          name="wirelessUsimOnlySelected"
          type="hidden"
          value={
            effectiveSelectedWirelessProducts.includes("USIM_ONLY") ? "true" : "false"
          }
        />
        <input
          name="wirelessUsedPhoneSelected"
          type="hidden"
          value={
            effectiveSelectedWirelessProducts.includes("USED_PHONE") ? "true" : "false"
          }
        />
        <input
          name="wirelessEggSelected"
          type="hidden"
          value={effectiveSelectedWirelessProducts.includes("EGG") ? "true" : "false"}
        />
        <input
          name="wiredInternetSelected"
          type="hidden"
          value={selectedWiredProducts.includes("INTERNET") ? "true" : "false"}
        />
        <input
          name="wiredTvSelected"
          type="hidden"
          value={selectedWiredProducts.includes("TV") ? "true" : "false"}
        />
        <input
          name="wiredLandlineSelected"
          type="hidden"
          value={selectedWiredProducts.includes("LANDLINE") ? "true" : "false"}
        />
        <input
          name="wiredInternetPhoneSelected"
          type="hidden"
          value={
            selectedWiredProducts.includes("INTERNET_PHONE") ? "true" : "false"
          }
        />
        <input
          name="wiredBundleSelected"
          type="hidden"
          value={selectedWiredProducts.includes("BUNDLE") ? "true" : "false"}
        />
        <input
          name="additionalDeviceOnlySelected"
          type="hidden"
          value={selectedAdditionalProducts.includes("DEVICE_ONLY") ? "true" : "false"}
        />
        {currentStep !== 3 ? (
          <input name="saleDate" type="hidden" value={saleDate} />
        ) : null}
        {currentStep !== 4 ? (
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
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            {saleRegistrationSteps.map((step, index) => (
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

        <section className={currentStep === 3 ? "xl:col-span-2" : "space-y-4"}>
          {currentStep === 0 ? (
            <article className={surfaceClassName}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Customer Entry
              </p>
              <h3 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-slate-950">
                기존 고객 또는 신규 고객을 선택해 주세요
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                판매 등록 시작 유형을 먼저 정하면 이후 단계에서 필요한 입력 흐름을 분명하게 나눌 수 있습니다.
              </p>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <FlowChoiceCard
                  active={customerEntryType === "EXISTING"}
                  description="기존 고객을 조회해 바로 판매 등록을 이어갑니다."
                  icon={
                    <SelectionCardIcon tone="blue">
                      <svg
                        aria-hidden="true"
                        className="h-8 w-8"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          cx="12"
                          cy="8"
                          r="3.5"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        />
                        <path
                          d="M5.5 18c1.3-3 3.7-4.5 6.5-4.5S17.2 15 18.5 18"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeWidth="1.8"
                        />
                      </svg>
                    </SelectionCardIcon>
                  }
                  onClick={() => setCustomerEntryType("EXISTING")}
                  title="기존 고객"
                />
                <FlowChoiceCard
                  active={customerEntryType === "NEW"}
                  description="신규 고객을 등록한 뒤 바로 현재 판매 흐름에 연결합니다."
                  icon={
                    <SelectionCardIcon tone="emerald">
                      <svg
                        aria-hidden="true"
                        className="h-8 w-8"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          cx="9"
                          cy="8"
                          r="3.5"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        />
                        <path
                          d="M2.5 18c1.3-3 3.7-4.5 6.5-4.5"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeWidth="1.8"
                        />
                        <path
                          d="M17 7v8M13 11h8"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeWidth="1.8"
                        />
                      </svg>
                    </SelectionCardIcon>
                  }
                  onClick={() => setCustomerEntryType("NEW")}
                  title="신규 고객"
                />
              </div>

              <WizardNav
                currentStep={currentStep}
                moveToStep={moveToStep}
                canGoNext={customerEntryStepValid}
              />
            </article>
          ) : null}

          {currentStep === 1 ? (
            <article className={surfaceClassName}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Activation
              </p>
              <h3 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-slate-950">
                판매 가입 유형을 선택해 주세요
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                가입 유형에 따라 선택 가능한 무선상품 구성이 자동으로 제한됩니다.
              </p>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <FlowChoiceCard
                  active={activationType === "DEVICE_CHANGE"}
                  description="후불, 일반 항목만 활성화됩니다."
                  icon={
                    <SelectionCardIcon tone="amber">
                      <svg
                        aria-hidden="true"
                        className="h-8 w-8"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <rect
                          x="6.5"
                          y="3.5"
                          width="11"
                          height="17"
                          rx="2.5"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        />
                        <path
                          d="M10 8h4M8.5 14.5h7"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeWidth="1.8"
                        />
                      </svg>
                    </SelectionCardIcon>
                  }
                  onClick={() => setActivationType("DEVICE_CHANGE")}
                  title="기기변경"
                />
                <FlowChoiceCard
                  active={activationType === "NEW_SUBSCRIPTION"}
                  description="후불, 선불, 일반, 유심단독, 중고폰, 5G/LTE Egg를 구성할 수 있습니다."
                  icon={
                    <SelectionCardIcon tone="blue">
                      <svg
                        aria-hidden="true"
                        className="h-8 w-8"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M12 5v14M5 12h14"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeWidth="1.8"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="8.5"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        />
                      </svg>
                    </SelectionCardIcon>
                  }
                  onClick={() => setActivationType("NEW_SUBSCRIPTION")}
                  title="신규가입"
                />
                <FlowChoiceCard
                  active={activationType === "NUMBER_PORT"}
                  description="후불, 선불, 일반, 유심단독, 중고폰을 구성할 수 있습니다."
                  icon={
                    <SelectionCardIcon tone="emerald">
                      <svg
                        aria-hidden="true"
                        className="h-8 w-8"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M7 7h10v10"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeWidth="1.8"
                        />
                        <path
                          d="m7 17 10-10"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeWidth="1.8"
                        />
                      </svg>
                    </SelectionCardIcon>
                  }
                  onClick={() => setActivationType("NUMBER_PORT")}
                  title="번호이동"
                />
              </div>

              <WizardNav
                currentStep={currentStep}
                moveToStep={moveToStep}
                canGoNext={activationStepValid}
              />
            </article>
          ) : null}

          {currentStep === 2 ? (
            <article className={surfaceClassName}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Setup
              </p>
              <h3 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-slate-950">
                거래 대리점과 상품 구성을 먼저 선택해 주세요
              </h3>

              <div className="mt-5 grid gap-5">
                <label className={labelClassName}>
                  <span>거래 대리점</span>
                  <SelectControl
                    aria-label="거래 대리점"
                    className={pricingSelectClassName}
                    name="salesAgencyId"
                    onValueChange={setSalesAgencyId}
                    value={salesAgencyId}
                  >
                    <option value="">거래 대리점을 선택해 주세요</option>
                    {salesAgencies.map((salesAgency) => (
                      <option key={salesAgency.id} value={salesAgency.id}>
                        {salesAgency.name}
                      </option>
                    ))}
                  </SelectControl>
                </label>

                <div className="grid gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1.45fr)_minmax(15rem,0.95fr)]">
                  <div className="space-y-3 rounded-[1.15rem] border border-stone-200 bg-white px-4 py-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">무선상품</p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        가입 유형에 따라 선택 가능한 항목만 활성화됩니다.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {wirelessProductDefinitions.map((definition) => {
                        const enabled =
                          activationType !== null &&
                          allowedWirelessProducts.includes(definition.code);

                        return (
                          <ProductToggleCard
                            key={definition.code}
                            active={effectiveSelectedWirelessProducts.includes(
                              definition.code,
                            )}
                            disabled={!enabled}
                            label={definition.label}
                            onClick={() => {
                              if (!enabled) {
                                return;
                              }

                              toggleProductSelection(
                                definition.code,
                                setSelectedWirelessProducts,
                              );
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-3 rounded-[1.15rem] border border-stone-200 bg-white px-4 py-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">유선상품</p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        인터넷, TV, 일반전화, 인터넷전화, 결합 항목을 함께 구성할 수 있습니다.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {wiredProductDefinitions.map((definition) => (
                        <ProductToggleCard
                          key={definition.code}
                          active={selectedWiredProducts.includes(definition.code)}
                          label={definition.label}
                          onClick={() =>
                            toggleProductSelection(
                              definition.code,
                              setSelectedWiredProducts,
                            )
                          }
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 rounded-[1.15rem] border border-stone-200 bg-white px-4 py-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">부가상품</p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        현재 요청 기준으로 Device단독 항목을 선택할 수 있습니다.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {additionalProductDefinitions.map((definition) => (
                        <ProductToggleCard
                          key={definition.code}
                          active={selectedAdditionalProducts.includes(definition.code)}
                          label={definition.label}
                          onClick={() =>
                            toggleProductSelection(
                              definition.code,
                              setSelectedAdditionalProducts,
                            )
                          }
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {setupIssue ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                    {setupIssue}
                  </div>
                ) : null}
              </div>

              <WizardNav
                currentStep={currentStep}
                moveToStep={moveToStep}
                canGoNext={setupStepValid}
              />
            </article>
          ) : null}

          {currentStep === 3 ? (
            <SalesEntryBasicsStep
              availableAddOnServices={availableAddOnServices}
              availableInventory={availableInventory}
              availableRatePlans={availableRatePlans}
              basicsStepValid={basicsStepValid}
              currentUserName={currentUserName}
              customerEntryType={customerEntryType}
              customerId={customerId}
              customers={customerOptions}
              effectiveRatePlanId={effectiveRatePlanId}
              effectiveSelectedAddOnServiceIds={effectiveSelectedAddOnServiceIds}
              inventoryItemId={inventoryItemId}
              moveToStep={moveToStep}
              onOpenCustomerCreateDialog={() => setIsCustomerDialogOpen(true)}
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

          {currentStep === 4 ? (
            <article className={surfaceClassName}>
              <h3 className="text-lg font-semibold tracking-[-0.03em] text-slate-950">
                할인, 리베이트, 수납 금액 입력
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

          {currentStep === 5 ? (
            <article className={surfaceClassName}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Final Review
              </p>
              <h3 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-slate-950">
                등록 전 최종 내용을 확인해 주세요
              </h3>

              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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
                    고객 구분
                  </p>
                  <p className="mt-2 font-medium text-slate-900">
                    {customerEntryType
                      ? getSaleCustomerEntryTypeLabel(customerEntryType)
                      : "-"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {activationType ? getSaleActivationTypeLabel(activationType) : "-"}
                  </p>
                </div>
                <div className="rounded-lg border border-white/70 bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    거래 대리점
                  </p>
                  <p className="mt-2 font-medium text-slate-900">
                    {selectedSalesAgency?.name ?? "-"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">판매 담당 {currentUserName}</p>
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
                      ? `${selectedInventory.color} / ${selectedInventory.capacity} / S/N ${selectedInventory.serialNumber} / Model No. ${selectedInventory.modelNumber}`
                      : "-"}
                  </p>
                </div>
                <div className="rounded-lg border border-white/70 bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    판매 조건
                  </p>
                  <p className="mt-2 font-medium text-slate-900">판매일 {saleDate}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    요금제 {selectedRatePlan?.name ?? "미선택"}
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

              <div className="mt-4 grid gap-3 xl:grid-cols-3">
                <div className="rounded-lg border border-white/70 bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    무선상품
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {selectedWirelessProductLabels.length > 0
                      ? selectedWirelessProductLabels.join(", ")
                      : "선택 안함"}
                  </p>
                </div>
                <div className="rounded-lg border border-white/70 bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    유선상품
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {selectedWiredProductLabels.length > 0
                      ? selectedWiredProductLabels.join(", ")
                      : "선택 안함"}
                  </p>
                </div>
                <div className="rounded-lg border border-white/70 bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    부가상품
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {selectedAdditionalProductLabels.length > 0
                      ? selectedAdditionalProductLabels.join(", ")
                      : "선택 안함"}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => moveToStep(4)}
                  className={`${secondaryButtonClassName} h-10 px-4`}
                >
                  이전 단계
                </button>
                <CreateSaleSubmitButton disabled={submitDisabled} />
              </div>
            </article>
          ) : null}
        </section>

        {currentStep !== 3 ? (
          <aside className="space-y-4">
            <article className={surfaceClassName}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Step Guide
              </p>
              <h3 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-slate-950">
                {currentStepDefinition.title}
              </h3>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                {currentStepDefinition.description}
              </p>
            </article>

            <article className={surfaceClassName}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Quick Summary
              </p>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="rounded-lg border border-white/70 bg-white px-4 py-3">
                  <p className="font-medium text-slate-900">고객 흐름</p>
                  <p className="mt-1">
                    {customerEntryType
                      ? getSaleCustomerEntryTypeLabel(customerEntryType)
                      : "선택 대기"}
                  </p>
                </div>
                <div className="rounded-lg border border-white/70 bg-white px-4 py-3">
                  <p className="font-medium text-slate-900">가입 유형</p>
                  <p className="mt-1">
                    {activationType
                      ? getSaleActivationTypeLabel(activationType)
                      : "선택 대기"}
                  </p>
                </div>
                <div className="rounded-lg border border-white/70 bg-white px-4 py-3">
                  <p className="font-medium text-slate-900">거래 대리점</p>
                  <p className="mt-1">{selectedSalesAgency?.name ?? "선택 대기"}</p>
                </div>
                <div className="rounded-lg border border-white/70 bg-white px-4 py-3">
                  <p className="font-medium text-slate-900">상품 구성</p>
                  <p className="mt-1 leading-6">
                    {[
                      ...selectedWirelessProductLabels,
                      ...selectedWiredProductLabels,
                      ...selectedAdditionalProductLabels,
                    ].join(", ") || "선택 대기"}
                  </p>
                </div>
              </div>
            </article>

            {currentStep >= 4 ? (
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
                      리베이트 {formatWon(effectiveRebateAmount)} / 통신사수익{" "}
                      {formatWon(effectivePolicyRevenueAmount)}
                    </p>
                  </div>
                </div>

                <div
                  className={`mt-4 rounded-lg border px-4 py-3 text-sm leading-6 ${
                    formIssue
                      ? "border-amber-200 bg-amber-50 text-amber-900"
                      : "border-teal-200 bg-teal-50 text-teal-900"
                  }`}
                >
                  {formIssue
                    ? formIssue
                    : "서버 액션에서 같은 계산 규칙으로 한 번 더 검증한 뒤 저장합니다."}
                </div>
              </article>
            ) : null}

            {currentStep >= 4 ? (
              <article className={surfaceClassName}>
                <h3 className="text-lg font-semibold tracking-[-0.03em] text-slate-950">
                  정책 매칭
                </h3>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <div className="rounded-lg border border-white/70 bg-white px-4 py-3">
                    <p className="font-medium text-slate-900">디바이스 할인 정책</p>
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
                    <p className="font-medium text-slate-900">통신사 수익 정책</p>
                    <p className="mt-1">
                      {matchedSaleProfitPolicy
                        ? `${matchedSaleProfitPolicy.name} / ${
                            matchedSaleProfitPolicy.calculationMethod === "PERCENTAGE"
                              ? `${matchedSaleProfitPolicy.calculationValue}%`
                              : matchedSaleProfitPolicy.calculationMethod === "FIXED_AMOUNT"
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
          </aside>
        ) : null}

      </form>

      {isCustomerDialogOpen ? (
        <CustomerUpsertDialog
          carriers={carriers}
          onClose={() => setIsCustomerDialogOpen(false)}
          onSuccess={handleCustomerCreated}
          submitLabel="고객 저장 후 판매 진행"
          subtitle="New Customer"
          title="신규 고객 등록"
        />
      ) : null}
    </>
  );

  /*
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
                    ? `${selectedInventory.color} / ${selectedInventory.capacity} / S/N ${selectedInventory.serialNumber} / Model No. ${selectedInventory.modelNumber}`
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

      {currentStep >= 1 ? (
        <aside className="space-y-4">
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

            {!formIssue ? (
              <div className="mt-4 rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm leading-6 text-teal-900">
                서버 액션에서 같은 계산 규칙으로 다시 검증한 뒤 저장합니다.
              </div>
            ) : null}
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
        </aside>
      ) : null}

      <WorkspaceMessageModal
        message={formIssue}
        signal={formIssue}
        subtitle="Sales Form"
        title="판매 입력 값을 확인해 주세요"
        tone="error"
      />
    </form>
  );
  */
}
