export type SalesDiscountMethod = "PERCENTAGE" | "FIXED_AMOUNT";
export type SalesDiscountTarget = "CARRIER" | "DEVICE";
export type SalesRevenueCalculationMethod =
  | "NONE"
  | "FIXED_AMOUNT"
  | "PERCENTAGE";

export interface DiscountPolicyCandidate {
  id: string;
  name: string;
  carrierId: string | null;
  deviceModelId: string | null;
  target: SalesDiscountTarget;
  startsAt: string | Date;
  endsAt: string | Date;
  discountMethod: SalesDiscountMethod;
  discountValue: number;
}

export interface RebatePolicyCandidate {
  id: string;
  name: string;
  carrierId: string;
  deviceModelId: string;
  startsAt: string | Date;
  endsAt: string | Date;
  defaultRebateAmount: number;
}

export interface SaleProfitPolicyCandidate {
  id: string;
  name: string;
  carrierId: string;
  startsAt: string | Date;
  endsAt: string | Date;
  calculationMethod: SalesRevenueCalculationMethod;
  calculationValue: number;
}

export interface SalesCalculationInput {
  listPrice: number;
  subsidyAmount?: number;
  discountApplied: boolean;
  discountMethod: SalesDiscountMethod | null;
  discountValue: number | null;
  rebateAmount: number;
  policyRevenueAmount: number;
  cashAmount: number;
  cardAmount: number;
  bankTransferAmount: number;
}

export interface SalesCalculationResult {
  discountAmount: number;
  discountedPrice: number;
  finalSalePrice: number;
  actualReceivedAmount: number;
  receivableAmount: number;
  profitCalculationBaseAmount: number;
  totalProfitAmount: number;
}

function toTimestamp(value: string | Date) {
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

function clampMoney(value: number) {
  return value < 0 ? 0 : value;
}

export function parseSaleDateForPolicyMatch(value: string) {
  return new Date(`${value}T12:00:00+09:00`);
}

export function calculateDiscountAmount(
  listPrice: number,
  discountApplied: boolean,
  discountMethod: SalesDiscountMethod | null,
  discountValue: number | null,
) {
  if (!discountApplied || !discountMethod || discountValue === null) {
    return 0;
  }

  if (discountMethod === "PERCENTAGE") {
    return Math.floor((listPrice * discountValue) / 100);
  }

  return clampMoney(discountValue);
}

export function calculatePolicyRevenueAmount(
  baseAmount: number,
  calculationMethod: SalesRevenueCalculationMethod,
  calculationValue: number,
) {
  if (calculationMethod === "NONE" || calculationValue <= 0) {
    return 0;
  }

  if (calculationMethod === "PERCENTAGE") {
    return Math.floor((baseAmount * calculationValue) / 100);
  }

  return clampMoney(calculationValue);
}

export function calculateSalesAmounts({
  listPrice,
  subsidyAmount = 0,
  discountApplied,
  discountMethod,
  discountValue,
  rebateAmount,
  policyRevenueAmount,
  cashAmount,
  cardAmount,
  bankTransferAmount,
}: SalesCalculationInput): SalesCalculationResult {
  const discountAmount = calculateDiscountAmount(
    listPrice,
    discountApplied,
    discountMethod,
    discountValue,
  );
  const discountedPrice = clampMoney(listPrice - discountAmount);
  const finalSalePrice = clampMoney(discountedPrice - subsidyAmount);
  const actualReceivedAmount = clampMoney(cashAmount + cardAmount + bankTransferAmount);
  const receivableAmount = clampMoney(finalSalePrice - actualReceivedAmount);

  return {
    discountAmount,
    discountedPrice,
    finalSalePrice,
    actualReceivedAmount,
    receivableAmount,
    profitCalculationBaseAmount: finalSalePrice,
    totalProfitAmount: clampMoney(rebateAmount + policyRevenueAmount),
  };
}

export function findMatchingDiscountPolicy(
  policies: DiscountPolicyCandidate[],
  saleDate: string | Date,
  carrierId: string,
  deviceModelId: string,
) {
  const timestamp = toTimestamp(saleDate);

  const devicePolicy = policies.find((policy) => {
    if (policy.target !== "DEVICE" || policy.deviceModelId !== deviceModelId) {
      return false;
    }

    if (policy.carrierId && policy.carrierId !== carrierId) {
      return false;
    }

    return (
      toTimestamp(policy.startsAt) <= timestamp &&
      toTimestamp(policy.endsAt) >= timestamp
    );
  });

  if (devicePolicy) {
    return devicePolicy;
  }

  return (
    policies.find((policy) => {
      if (policy.target !== "CARRIER" || policy.carrierId !== carrierId) {
        return false;
      }

      return (
        toTimestamp(policy.startsAt) <= timestamp &&
        toTimestamp(policy.endsAt) >= timestamp
      );
    }) ?? null
  );
}

export function findMatchingRebatePolicy(
  policies: RebatePolicyCandidate[],
  saleDate: string | Date,
  carrierId: string,
  deviceModelId: string,
) {
  const timestamp = toTimestamp(saleDate);

  return (
    policies.find((policy) => {
      return (
        policy.carrierId === carrierId &&
        policy.deviceModelId === deviceModelId &&
        toTimestamp(policy.startsAt) <= timestamp &&
        toTimestamp(policy.endsAt) >= timestamp
      );
    }) ?? null
  );
}

export function findMatchingSaleProfitPolicy(
  policies: SaleProfitPolicyCandidate[],
  saleDate: string | Date,
  carrierId: string,
) {
  const timestamp = toTimestamp(saleDate);

  return (
    policies.find((policy) => {
      return (
        policy.carrierId === carrierId &&
        toTimestamp(policy.startsAt) <= timestamp &&
        toTimestamp(policy.endsAt) >= timestamp
      );
    }) ?? null
  );
}
