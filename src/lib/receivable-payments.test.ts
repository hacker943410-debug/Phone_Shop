import { calculateReceivableState } from "@/lib/receivable-payments";

describe("receivable payments", () => {
  it("marks receivable as partially paid when some balance remains", () => {
    expect(
      calculateReceivableState(300_000, [
        {
          amount: 120_000,
          paymentDate: "2026-04-11T18:00:00+09:00",
        },
      ]),
    ).toEqual({
      paidAmount: 120_000,
      balanceAmount: 180_000,
      status: "PARTIALLY_PAID",
      closedAt: null,
    });
  });

  it("marks receivable as paid when completed payments reach original amount", () => {
    expect(
      calculateReceivableState(300_000, [
        {
          amount: 120_000,
          paymentDate: "2026-04-11T18:00:00+09:00",
        },
        {
          amount: 180_000,
          paymentDate: "2026-04-12T12:10:00+09:00",
        },
      ]),
    ).toEqual({
      paidAmount: 300_000,
      balanceAmount: 0,
      status: "PAID",
      closedAt: new Date("2026-04-12T12:10:00+09:00"),
    });
  });

  it("rejects overpayments beyond the original amount", () => {
    expect(() =>
      calculateReceivableState(300_000, [
        {
          amount: 200_000,
          paymentDate: "2026-04-11T18:00:00+09:00",
        },
        {
          amount: 150_000,
          paymentDate: "2026-04-12T12:10:00+09:00",
        },
      ]),
    ).toThrow("PAYMENT_OVER_BALANCE");
  });
});
