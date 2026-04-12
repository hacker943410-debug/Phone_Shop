"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

import { createSaleAction } from "@/app/actions/sales";
import { formatWon } from "@/lib/formatters";
import {
  calculatePolicyRevenueAmount,
  calculateSalesAmounts,
  findMatchingDiscountPolicy,
  findMatchingRebatePolicy,
  findMatchingSaleProfitPolicy,
  parseSaleDateForPolicyMatch,
} from "@/lib/sales-calculations";

import type {
  DiscountMethodValue,
  SalesAvailableInventoryRecord,
  SalesCarrierRecord,
  SalesCustomerRecord,
  SalesDiscountPolicyRecord,
  SalesRebatePolicyRecord,
  SalesSaleProfitPolicyRecord,
} from "./sales-types";

const controlClassName =
  "w-full rounded-[1.15rem] border border-slate-950/12 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200";
const labelClassName = "space-y-2 text-sm font-medium text-slate-700";
const surfaceClassName =
  "rounded-[1.35rem] border border-slate-950/8 bg-stone-50/85 p-4 shadow-[0_12px_36px_-30px_rgba(15,23,42,0.35)]";

interface SalesEntryFormProps {
  currentUserName: string;
  defaultSaleDate: string;
  customers: SalesCustomerRecord[];
  carriers: SalesCarrierRecord[];
  availableInventory: SalesAvailableInventoryRecord[];
  discountPolicies: SalesDiscountPolicyRecord[];
  rebatePolicies: SalesRebatePolicyRecord[];
  saleProfitPolicies: SalesSaleProfitPolicyRecord[];
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

function getDiscountLabel(
  method: DiscountMethodValue | null,
  value: number | null,
) {
  if (!method || value === null) {
    return "없음";
  }

  return method === "PERCENTAGE" ? `${value}%` : formatWon(value);
}

function CreateSaleSubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
    >
      {pending ? "판매 저장 중..." : "판매 등록"}
    </button>
  );
}

export function SalesEntryForm({
  currentUserName,
  defaultSaleDate,
  customers,
  carriers,
  availableInventory,
  discountPolicies,
  rebatePolicies,
  saleProfitPolicies,
}: SalesEntryFormProps) {
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [inventoryItemId, setInventoryItemId] = useState(
    availableInventory[0]?.id ?? "",
  );
  const [saleDate, setSaleDate] = useState(defaultSaleDate);
  const [ratePlanId, setRatePlanId] = useState("");
  const [selectedAddOnServiceIds, setSelectedAddOnServiceIds] = useState<string[]>(
    [],
  );
  const [listPrice, setListPrice] = useState("");
  const [discountApplied, setDiscountApplied] = useState(true);
  const [manualDiscountMethod, setManualDiscountMethod] = useState("");
  const [manualDiscountValue, setManualDiscountValue] = useState("");
  const [rebateAmount, setRebateAmount] = useState("");
  const [cashAmount, setCashAmount] = useState("");
  const [cardAmount, setCardAmount] = useState("");
  const [bankTransferAmount, setBankTransferAmount] = useState("");
  const [cardInstallmentMonths, setCardInstallmentMonths] = useState("");
  const [notes, setNotes] = useState("");

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
          selectedInventory.carrierId,
          selectedInventory.deviceModelId,
        )
      : null;
  const suggestedRebatePolicy =
    selectedInventory && saleDateForPolicies
      ? findMatchingRebatePolicy(
          rebatePolicies,
          saleDateForPolicies,
          selectedInventory.carrierId,
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

  const effectiveDiscountMethod: DiscountMethodValue | null = discountApplied
    ? manualDiscountIsValidMethod
      ? manualDiscountMethod
      : (suggestedDiscountPolicy?.discountMethod ?? null)
    : null;
  const effectiveDiscountValue = discountApplied
    ? parsedManualDiscountValue ?? suggestedDiscountPolicy?.discountValue ?? null
    : null;
  const effectiveRebateAmount =
    parsedRebateAmount ?? suggestedRebatePolicy?.defaultRebateAmount ?? 0;
  const effectiveCashAmount = parsedCashAmount ?? 0;
  const effectiveCardAmount = parsedCardAmount ?? 0;
  const effectiveBankTransferAmount = parsedBankTransferAmount ?? 0;

  const baseCalculation = calculateSalesAmounts({
    listPrice: parsedListPrice,
    discountApplied,
    discountMethod: effectiveDiscountMethod,
    discountValue: effectiveDiscountValue,
    rebateAmount: effectiveRebateAmount,
    policyRevenueAmount: 0,
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
  const previewCalculation = calculateSalesAmounts({
    listPrice: parsedListPrice,
    discountApplied,
    discountMethod: effectiveDiscountMethod,
    discountValue: effectiveDiscountValue,
    rebateAmount: effectiveRebateAmount,
    policyRevenueAmount: effectivePolicyRevenueAmount,
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
  const paymentIssue =
    previewCalculation.actualReceivedAmount > previewCalculation.finalSalePrice
      ? "수납 금액 합계가 최종 판매가를 초과합니다."
      : null;
  const formIssue =
    numericInputHasError || parsedListPrice <= 0
      ? "금액 필드는 0 이상의 숫자로 입력해야 합니다."
      : discountIssue ?? paymentIssue;
  const submitDisabled =
    !selectedCustomer ||
    !selectedInventory ||
    !saleDate ||
    parsedListPrice <= 0 ||
    Boolean(formIssue);

  if (customers.length === 0 || availableInventory.length === 0) {
    return (
      <div className={surfaceClassName}>
        <p className="text-sm leading-6 text-slate-600">
          {customers.length === 0
            ? "등록된 고객이 없어 판매를 입력할 수 없습니다. 먼저 고객 관리에서 고객을 등록하세요."
            : "판매 가능한 재고가 없어 판매를 입력할 수 없습니다. 재고 관리에서 입고 상태 재고를 확보하세요."}
        </p>
      </div>
    );
  }

  return (
    <form
      action={createSaleAction}
      className="grid gap-6 xl:grid-cols-[1.06fr_0.94fr]"
    >
      <section className="space-y-4">
        <article className={surfaceClassName}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Sales Input
              </p>
              <h3 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-slate-950">
                고객과 재고를 기준으로 판매를 등록합니다.
              </h3>
            </div>
            <span className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white">
              담당자 {currentUserName}
            </span>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <label className={labelClassName}>
              <span>고객</span>
              <select
                name="customerId"
                value={customerId}
                onChange={(event) => setCustomerId(event.target.value)}
                className={controlClassName}
                required
              >
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} / {customer.phone}
                    {customer.currentCarrierName
                      ? ` / ${customer.currentCarrierName}`
                      : ""}
                  </option>
                ))}
              </select>
            </label>

            <label className={labelClassName}>
              <span>판매 일자</span>
              <input
                name="saleDate"
                type="date"
                value={saleDate}
                onChange={(event) => setSaleDate(event.target.value)}
                className={controlClassName}
                required
              />
            </label>

            <label className={`${labelClassName} md:col-span-2`}>
              <span>판매 재고</span>
              <select
                name="inventoryItemId"
                value={inventoryItemId}
                onChange={(event) => setInventoryItemId(event.target.value)}
                className={controlClassName}
                required
              >
                {availableInventory.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.carrierName} {item.deviceModelName} / {item.color} /{" "}
                    {item.capacity} / IMEI {item.imei}
                  </option>
                ))}
              </select>
            </label>

            <label className={labelClassName}>
              <span>요금제</span>
              <select
                name="ratePlanId"
                value={effectiveRatePlanId}
                onChange={(event) => setRatePlanId(event.target.value)}
                className={controlClassName}
                required={availableRatePlans.length > 0}
                disabled={availableRatePlans.length === 0}
              >
                {availableRatePlans.length > 0 ? null : (
                  <option value="">선택 가능한 요금제가 없습니다.</option>
                )}
                {availableRatePlans.map((ratePlan) => (
                  <option key={ratePlan.id} value={ratePlan.id}>
                    {ratePlan.name} / {formatWon(ratePlan.monthlyFee)}
                  </option>
                ))}
              </select>
            </label>

            <label className={labelClassName}>
              <span>단말 판매가</span>
              <input
                name="listPrice"
                type="number"
                min="0"
                value={listPrice}
                onChange={(event) => setListPrice(event.target.value)}
                className={controlClassName}
                placeholder="1288000"
                required
              />
            </label>
          </div>

          <div className="mt-4 rounded-[1.15rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            <p className="font-medium text-slate-900">
              {selectedInventory?.carrierName} {selectedInventory?.deviceModelName}
            </p>
            <p className="mt-1">
              {selectedInventory?.color} / {selectedInventory?.capacity} / 원가{" "}
              {selectedInventory ? formatWon(selectedInventory.costAmount) : "-"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              고객 현재 회선 {selectedCustomer?.currentCarrierName ?? "미지정"}
            </p>
          </div>
        </article>

        <article className={surfaceClassName}>
          <h3 className="text-lg font-semibold tracking-[-0.03em] text-slate-950">
            할인, 리베이트, 수납 입력
          </h3>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <label className={labelClassName}>
              <span>할인 적용</span>
              <select
                name="discountApplied"
                value={discountApplied ? "true" : "false"}
                onChange={(event) =>
                  setDiscountApplied(event.target.value === "true")
                }
                className={controlClassName}
              >
                <option value="true">적용</option>
                <option value="false">미적용</option>
              </select>
            </label>

            <label className={labelClassName}>
              <span>수동 할인 방식</span>
              <select
                name="discountMethod"
                value={manualDiscountMethod}
                onChange={(event) => setManualDiscountMethod(event.target.value)}
                className={controlClassName}
              >
                <option value="">자동 정책 사용</option>
                <option value="PERCENTAGE">퍼센트</option>
                <option value="FIXED_AMOUNT">정액</option>
              </select>
            </label>

            <label className={labelClassName}>
              <span>수동 할인값</span>
              <input
                name="discountValue"
                type="number"
                min="0"
                value={manualDiscountValue}
                onChange={(event) => setManualDiscountValue(event.target.value)}
                className={controlClassName}
                placeholder="예: 8 또는 120000"
              />
            </label>

            <label className={labelClassName}>
              <span>리베이트 금액</span>
              <input
                name="rebateAmount"
                type="number"
                min="0"
                value={rebateAmount}
                onChange={(event) => setRebateAmount(event.target.value)}
                className={controlClassName}
                placeholder="비워두면 정책 기본값 사용"
              />
            </label>

            <label className={labelClassName}>
              <span>현금 수납</span>
              <input
                name="cashAmount"
                type="number"
                min="0"
                value={cashAmount}
                onChange={(event) => setCashAmount(event.target.value)}
                className={controlClassName}
                placeholder="0"
              />
            </label>

            <label className={labelClassName}>
              <span>카드 수납</span>
              <input
                name="cardAmount"
                type="number"
                min="0"
                value={cardAmount}
                onChange={(event) => setCardAmount(event.target.value)}
                className={controlClassName}
                placeholder="0"
              />
            </label>

            <label className={labelClassName}>
              <span>계좌이체 수납</span>
              <input
                name="bankTransferAmount"
                type="number"
                min="0"
                value={bankTransferAmount}
                onChange={(event) => setBankTransferAmount(event.target.value)}
                className={controlClassName}
                placeholder="0"
              />
            </label>

            <label className={labelClassName}>
              <span>카드 할부 개월</span>
              <input
                name="cardInstallmentMonths"
                type="number"
                min="0"
                value={cardInstallmentMonths}
                onChange={(event) =>
                  setCardInstallmentMonths(event.target.value)
                }
                className={controlClassName}
                placeholder="일시불이면 비워두기"
              />
            </label>
          </div>

          <div className="mt-5 space-y-3">
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
                        className="flex items-center justify-between gap-3 rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                      >
                        <span className="space-y-1">
                          <span className="block font-medium text-slate-900">
                            {service.name}
                          </span>
                          <span className="block text-xs text-slate-500">
                            {service.scope === "shared" ? "공통" : "통신사 전용"} /{" "}
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
                            })
                          }}
                          className="h-4 w-4 accent-slate-950"
                        />
                      </label>
                    );
                  })
                ) : (
                  <p className="rounded-[1rem] border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-500 md:col-span-2">
                    선택 가능한 부가서비스가 없습니다.
                  </p>
                )}
              </div>
            </div>

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
        </article>
      </section>

      <aside className="space-y-4">
        <article className={surfaceClassName}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Live Preview
          </p>
          <h3 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-slate-950">
            저장 전 계산 결과
          </h3>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1rem] border border-white/70 bg-white px-4 py-3">
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
            <div className="rounded-[1rem] border border-white/70 bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                최종 판매가
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-950">
                {formatWon(previewCalculation.finalSalePrice)}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                할인 후 {formatWon(previewCalculation.discountedPrice)}
              </p>
            </div>
            <div className="rounded-[1rem] border border-white/70 bg-white px-4 py-3">
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
            <div className="rounded-[1rem] border border-white/70 bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                총 이익
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-950">
                {formatWon(previewCalculation.totalProfitAmount)}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                리베이트 {formatWon(effectiveRebateAmount)} / 정책수익{" "}
                {formatWon(effectivePolicyRevenueAmount)}
              </p>
            </div>
          </div>

          {formIssue ? (
            <div className="mt-4 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-800">
              {formIssue}
            </div>
          ) : (
            <div className="mt-4 rounded-[1rem] border border-teal-200 bg-teal-50 px-4 py-3 text-sm leading-6 text-teal-900">
              서버에서도 같은 계산식으로 다시 검증한 뒤 저장합니다.
            </div>
          )}

          <div className="mt-5 flex justify-end">
            <CreateSaleSubmitButton disabled={submitDisabled} />
          </div>
        </article>

        <article className={surfaceClassName}>
          <h3 className="text-lg font-semibold tracking-[-0.03em] text-slate-950">
            정책 매칭
          </h3>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="rounded-[1rem] border border-white/70 bg-white px-4 py-3">
              <p className="font-medium text-slate-900">할인 정책</p>
              <p className="mt-1">
                {suggestedDiscountPolicy
                  ? `${suggestedDiscountPolicy.name} / ${getDiscountLabel(
                      suggestedDiscountPolicy.discountMethod,
                      suggestedDiscountPolicy.discountValue,
                    )}`
                  : "매칭 없음"}
              </p>
            </div>
            <div className="rounded-[1rem] border border-white/70 bg-white px-4 py-3">
              <p className="font-medium text-slate-900">리베이트 정책</p>
              <p className="mt-1">
                {suggestedRebatePolicy
                  ? `${suggestedRebatePolicy.name} / ${formatWon(
                      suggestedRebatePolicy.defaultRebateAmount,
                    )}`
                  : "매칭 없음"}
              </p>
            </div>
            <div className="rounded-[1rem] border border-white/70 bg-white px-4 py-3">
              <p className="font-medium text-slate-900">정책 수익</p>
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
          </div>
        </article>
      </aside>
    </form>
  );
}
