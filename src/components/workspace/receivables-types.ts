export type PaymentMethodValue = "CASH" | "CARD" | "BANK_TRANSFER";
export type PaymentStatusValue = "COMPLETED" | "CANCELED";
export type ReceivableStatusValue = "UNPAID" | "PARTIALLY_PAID" | "PAID";

export type ReceivablesNotice =
  | "invalid-payment-form"
  | "receivable-not-found"
  | "payment-not-found"
  | "payment-over-balance";

export interface ReceivableCustomerOption {
  id: string;
  name: string;
  phone: string;
}

export interface ReceivablePaymentRecord {
  id: string;
  paymentDate: Date;
  amount: number;
  method: PaymentMethodValue;
  status: PaymentStatusValue;
  memo: string | null;
  staffName: string;
}

export interface ReceivableRecord {
  id: string;
  saleId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  saleDate: Date;
  saleSummary: string;
  staffName: string;
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
  saleId: string;
  status: "all" | ReceivableStatusValue;
  dateFrom: string;
  dateTo: string;
}

export interface ReceivablesMetrics {
  totalCount: number;
  filteredCount: number;
  outstandingCount: number;
  partiallyPaidCount: number;
  paidCount: number;
  balanceAmount: number;
}
