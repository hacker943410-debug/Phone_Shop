export type DiscountMethodValue = "PERCENTAGE" | "FIXED_AMOUNT";
export type DiscountTargetValue = "CARRIER" | "DEVICE";
export type RevenueCalculationMethodValue =
  | "NONE"
  | "FIXED_AMOUNT"
  | "PERCENTAGE";
export type SaleStatusValue = "COMPLETED" | "CANCELED";
export type ReceivableStatusValue = "UNPAID" | "PARTIALLY_PAID" | "PAID";

export type SalesNotice =
  | "invalid-sale-form"
  | "sale-customer-not-found"
  | "sale-inventory-unavailable"
  | "sale-rate-plan-mismatch"
  | "sale-service-mismatch"
  | "sale-overpayment"
  | "sale-discount-rule-missing"
  | "sale-not-found"
  | "sale-cancel-blocked";

export interface SalesCarrierRecord {
  id: string;
  name: string;
  code: string;
  ratePlans: Array<{
    id: string;
    name: string;
    monthlyFee: number;
  }>;
  addOnServices: Array<{
    id: string;
    name: string;
    monthlyFee: number | null;
    scope: "shared" | "carrier";
  }>;
}

export interface SalesCustomerRecord {
  id: string;
  name: string;
  phone: string;
  currentCarrierName: string | null;
}

export interface SalesRebatePolicyRecord {
  id: string;
  name: string;
  carrierId: string;
  carrierName: string;
  deviceModelId: string;
  deviceModelName: string;
  startsAt: string;
  endsAt: string;
  defaultRebateAmount: number;
}

export interface SalesSaleProfitPolicyRecord {
  id: string;
  name: string;
  carrierId: string;
  carrierName: string;
  startsAt: string;
  endsAt: string;
  calculationMethod: RevenueCalculationMethodValue;
  calculationValue: number;
}

export interface SalesDiscountPolicyRecord {
  id: string;
  name: string;
  target: DiscountTargetValue;
  carrierId: string | null;
  carrierName: string | null;
  deviceModelId: string | null;
  deviceModelName: string | null;
  startsAt: string;
  endsAt: string;
  discountMethod: DiscountMethodValue;
  discountValue: number;
}

export interface SalesAvailableInventoryRecord {
  id: string;
  carrierId: string;
  carrierName: string;
  deviceModelId: string;
  deviceModelName: string;
  color: string;
  capacity: string;
  imei: string;
  costAmount: number;
  receivedAt: string;
}

export interface SalesRecord {
  id: string;
  saleDate: string;
  status: SaleStatusValue;
  canceledAt: string | null;
  cancellationReason: string | null;
  customerName: string;
  carrierName: string;
  deviceModelName: string;
  ratePlanName: string | null;
  staffName: string;
  finalSalePrice: number;
  discountApplied: boolean;
  discountMethod: DiscountMethodValue | null;
  discountValue: number | null;
  rebateAmount: number;
  policyRevenueAmount: number;
  receivableAmount: number;
  receivableBalance: number;
  receivableStatus: ReceivableStatusValue | null;
  selectedServices: string[];
  appliedDiscountPolicyName: string | null;
  appliedRebatePolicyName: string | null;
  appliedSaleProfitPolicyName: string | null;
  canCancel: boolean;
  hasPayments: boolean;
}
