export type PaymentMethodValue = "CASH" | "CARD" | "BANK_TRANSFER";
export type PaymentStatusValue = "COMPLETED" | "CANCELED";
export type ReceivableStatusValue = "UNPAID" | "PARTIALLY_PAID" | "PAID";

export type ReceivablesNotice =
  | "invalid-payment-form"
  | "invalid-manual-receivable-form"
  | "manual-receivable-customer-not-found"
  | "receivable-not-found"
  | "payment-not-found"
  | "payment-cancel-reason-required"
  | "payment-over-balance";

export interface ReceivableCustomerOption {
  id: string;
  name: string;
  phone: string;
}

export interface ReceivableCarrierOption {
  id: string;
  name: string;
}

export interface ReceivablePaymentRecord {
  id: string;
  paymentDate: Date;
  amount: number;
  method: PaymentMethodValue;
  status: PaymentStatusValue;
  memo: string | null;
  createdAt: Date;
  canceledAt: Date | null;
  cancellationReason: string | null;
  canceledByName: string | null;
  staffName: string;
}

export interface ReceivableRecord {
  id: string;
  saleId: string | null;
  customerId: string;
  carrierId: string | null;
  customerName: string;
  customerPhone: string;
  referenceDate: Date;
  carrierName: string;
  deviceModelName: string;
  saleSummary: string;
  storeName: string | null;
  staffName: string;
  isManualEntry: boolean;
  originalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: ReceivableStatusValue;
  memo: string | null;
  createdAt: Date;
  payments: ReceivablePaymentRecord[];
}

export interface ReceivablesFilters {
  q: string;
  customerId: string;
  carrierId: string;
  saleId: string;
  status: "all" | ReceivableStatusValue;
}

export interface ReceivablesMetrics {
  totalCount: number;
  filteredCount: number;
  outstandingCount: number;
  partiallyPaidCount: number;
  paidCount: number;
  balanceAmount: number;
}
