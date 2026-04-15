import {
  calculatePolicyRevenueAmount,
  calculateSalesAmounts,
  findMatchingDiscountPolicy,
} from "@/lib/sales-calculations";

describe("sales calculations", () => {
  it("prefers device discount policy over carrier policy", () => {
    const matchedPolicy = findMatchingDiscountPolicy(
      [
        {
          id: "carrier",
          name: "통신사 할인",
          carrierId: "carrier-skt",
          deviceModelId: null,
          target: "CARRIER",
          startsAt: "2026-04-01T00:00:00+09:00",
          endsAt: "2026-04-30T23:59:59+09:00",
          discountMethod: "PERCENTAGE",
          discountValue: 5,
        },
        {
          id: "device",
          name: "단말 할인",
          carrierId: null,
          deviceModelId: "device-s25",
          target: "DEVICE",
          startsAt: "2026-04-01T00:00:00+09:00",
          endsAt: "2026-04-30T23:59:59+09:00",
          discountMethod: "PERCENTAGE",
          discountValue: 8,
        },
      ],
      "2026-04-12T12:00:00+09:00",
      "carrier-skt",
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
});
