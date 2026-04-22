import {
  buildCustomerActiveContractSummary,
  calculateDeviceInstallmentPrincipal,
  calculateElapsedInstallmentMonths,
  calculateRemainingInstallmentSummary,
} from "@/lib/customer-contract-summary";

describe("customer-contract-summary", () => {
  it("calculates installment principal from list price minus subsidy", () => {
    expect(calculateDeviceInstallmentPrincipal(1_250_000, 330_000)).toBe(920_000);
  });

  it("tracks elapsed months in KST billing month units", () => {
    expect(
      calculateElapsedInstallmentMonths(
        new Date("2026-01-15T12:00:00+09:00"),
        new Date("2026-04-22T10:00:00+09:00"),
      ),
    ).toBe(3);
    expect(
      calculateElapsedInstallmentMonths(
        new Date("2026-01-15T12:00:00+09:00"),
        new Date("2026-04-14T10:00:00+09:00"),
      ),
    ).toBe(2);
  });

  it("returns remaining installment amount and months", () => {
    expect(calculateRemainingInstallmentSummary(900_000, 24, 3)).toEqual({
      remainingInstallmentAmount: 787_500,
      remainingInstallmentMonths: 21,
    });
  });

  it("builds the latest completed contract summary and skips canceled sales", () => {
    expect(
      buildCustomerActiveContractSummary(
        [
          {
            saleDate: new Date("2026-04-20T12:00:00+09:00"),
            status: "CANCELED",
            deviceModelName: "Galaxy S25 Ultra",
            ratePlanName: "5G Premium",
            ratePlanMonthlyFee: 89_000,
            listPrice: 1_650_000,
            subsidyAmount: 250_000,
            installmentMonths: 24,
          },
          {
            saleDate: new Date("2026-01-10T12:00:00+09:00"),
            status: "COMPLETED",
            deviceModelName: "Galaxy S24",
            ratePlanName: "5G Standard",
            ratePlanMonthlyFee: 61_000,
            listPrice: 1_200_000,
            subsidyAmount: 300_000,
            installmentMonths: 24,
          },
        ],
        new Date("2026-04-22T10:00:00+09:00"),
      ),
    ).toEqual({
      saleDate: new Date("2026-01-10T12:00:00+09:00"),
      deviceModelName: "Galaxy S24",
      ratePlanName: "5G Standard",
      ratePlanMonthlyFee: 61_000,
      deviceInstallmentPrincipal: 900_000,
      installmentMonths: 24,
      monthlyInstallmentAmount: 37_500,
      remainingInstallmentAmount: 787_500,
      remainingInstallmentMonths: 21,
    });
  });
});
