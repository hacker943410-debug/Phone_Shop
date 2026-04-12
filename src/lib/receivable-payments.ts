export type ReceivableStatusValue = "UNPAID" | "PARTIALLY_PAID" | "PAID";

export interface ReceivableCompletedPaymentInput {
  amount: number;
  paymentDate: string | Date;
}

export interface ReceivableStateResult {
  paidAmount: number;
  balanceAmount: number;
  status: ReceivableStatusValue;
  closedAt: Date | null;
}

function toDate(value: string | Date) {
  return value instanceof Date ? value : new Date(value);
}

export function calculateReceivableState(
  originalAmount: number,
  payments: ReceivableCompletedPaymentInput[],
): ReceivableStateResult {
  const paidAmount = payments.reduce((total, payment) => total + payment.amount, 0);

  if (originalAmount < 0 || paidAmount < 0 || paidAmount > originalAmount) {
    throw new Error("PAYMENT_OVER_BALANCE");
  }

  if (paidAmount === 0) {
    return {
      paidAmount,
      balanceAmount: originalAmount,
      status: "UNPAID",
      closedAt: null,
    };
  }

  if (paidAmount === originalAmount) {
    const latestPaymentDate = payments.reduce<Date | null>((latest, payment) => {
      const paymentDate = toDate(payment.paymentDate);

      if (!latest || paymentDate.getTime() > latest.getTime()) {
        return paymentDate;
      }

      return latest;
    }, null);

    return {
      paidAmount,
      balanceAmount: 0,
      status: "PAID",
      closedAt: latestPaymentDate,
    };
  }

  return {
    paidAmount,
    balanceAmount: originalAmount - paidAmount,
    status: "PARTIALLY_PAID",
    closedAt: null,
  };
}
