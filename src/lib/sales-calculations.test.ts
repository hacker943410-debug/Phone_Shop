import {
  calculatePolicyRevenueAmount,
  calculateSalesAmounts,
  findMatchingDiscountPolicy,
  findMatchingStaffCommissionPolicy,
} from "@/lib/sales-calculations";

describe("sales calculations", () => {
  it("finds the matching device discount policy", () => {
    const matchedPolicy = findMatchingDiscountPolicy(
      [
        {
          id: "device",
          name: "Galaxy S25",
          deviceModelId: "device-s25",
          startsAt: "2026-04-01T00:00:00+09:00",
          endsAt: "2026-04-30T23:59:59+09:00",
          discountMethod: "PERCENTAGE",
          discountValue: 8,
        },
      ],
      "2026-04-12T12:00:00+09:00",
      "device-s25",
    );

    expect(matchedPolicy?.id).toBe("device");
    expect(matchedPolicy?.discountValue).toBe(8);
  });

  it("calculates sale totals and receivable amount", () => {
    expect(
      calculateSalesAmounts({
        listPrice: 1_400_000,
        discountApplied: true,
        discountMethod: "PERCENTAGE",
        discountValue: 8,
        rebateAmount: 310_000,
        policyRevenueAmount: 70_000,
        cashAmount: 200_000,
        cardAmount: 788_000,
        bankTransferAmount: 0,
      }),
    ).toEqual({
      discountAmount: 112_000,
      discountedPrice: 1_288_000,
      finalSalePrice: 1_288_000,
      actualReceivedAmount: 988_000,
      receivableAmount: 300_000,
      profitCalculationBaseAmount: 1_288_000,
      totalProfitAmount: 380_000,
    });
  });

  it("subtracts subsidy from final sale price and receivable", () => {
    expect(
      calculateSalesAmounts({
        listPrice: 1_400_000,
        subsidyAmount: 88_000,
        discountApplied: true,
        discountMethod: "PERCENTAGE",
        discountValue: 8,
        rebateAmount: 310_000,
        policyRevenueAmount: 70_000,
        cashAmount: 200_000,
        cardAmount: 788_000,
        bankTransferAmount: 0,
      }),
    ).toEqual({
      discountAmount: 112_000,
      discountedPrice: 1_288_000,
      finalSalePrice: 1_200_000,
      actualReceivedAmount: 988_000,
      receivableAmount: 212_000,
      profitCalculationBaseAmount: 1_200_000,
      totalProfitAmount: 380_000,
    });
  });

  it("treats NONE or zero-value policy revenue as zero", () => {
    expect(calculatePolicyRevenueAmount(1_000_000, "NONE", 5)).toBe(0);
    expect(calculatePolicyRevenueAmount(1_000_000, "PERCENTAGE", 0)).toBe(0);
    expect(calculatePolicyRevenueAmount(1_000_000, "PERCENTAGE", 5)).toBe(50_000);
  });

  it("deducts staff commission from total profit", () => {
    expect(
      calculateSalesAmounts({
        listPrice: 1_000_000,
        discountApplied: false,
        discountMethod: null,
        discountValue: null,
        rebateAmount: 300_000,
        policyRevenueAmount: 80_000,
        profitDeductionAmount: 50_000,
        cashAmount: 300_000,
        cardAmount: 700_000,
        bankTransferAmount: 0,
      }).totalProfitAmount,
    ).toBe(330_000);
  });

  it("finds the matching staff commission policy by staff and date", () => {
    const matchedPolicy = findMatchingStaffCommissionPolicy(
      [
        {
          id: "commission-kim",
          name: "김지후",
          staffId: "user-kim-jh",
          startsAt: "2026-04-01T00:00:00+09:00",
          endsAt: "2026-04-30T23:59:59+09:00",
          calculationMethod: "FIXED_AMOUNT",
          calculationValue: 40_000,
        },
      ],
      "2026-04-12T12:00:00+09:00",
      "user-kim-jh",
    );

    expect(matchedPolicy?.id).toBe("commission-kim");
    expect(matchedPolicy?.calculationValue).toBe(40_000);
  });
});
