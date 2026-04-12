"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireCurrentUser } from "@/lib/auth/dal";
import { parseKstDateInput } from "@/lib/date-utils";
import { prisma } from "@/lib/prisma";
import {
  calculatePolicyRevenueAmount,
  calculateSalesAmounts,
  findMatchingDiscountPolicy,
  findMatchingRebatePolicy,
  findMatchingSaleProfitPolicy,
} from "@/lib/sales-calculations";
import {
  DiscountMethod,
  InventoryStatus,
  PaymentStatus,
  ReceivableStatus,
  SaleStatus,
  type DiscountMethod as DiscountMethodValue,
} from "../../../prisma/generated/client/enums";

function redirectSalesNotice(notice: string): never {
  redirect(`/sales?notice=${notice}`);
}

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readOptionalText(formData: FormData, key: string) {
  const value = readText(formData, key);
  return value.length > 0 ? value : null;
}

function readOptionalInt(formData: FormData, key: string) {
  const value = readText(formData, key);

  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function readIntOrZero(formData: FormData, key: string) {
  const value = readText(formData, key);

  if (!value) {
    return 0;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function readRequiredDate(formData: FormData, key: string) {
  const value = readText(formData, key);
  return value ? parseKstDateInput(value, "start") : null;
}

function readDiscountMethod(
  formData: FormData,
  key: string,
): DiscountMethodValue | null {
  const value = readText(formData, key);

  switch (value) {
    case DiscountMethod.PERCENTAGE:
    case DiscountMethod.FIXED_AMOUNT:
      return value;
    default:
      return null;
  }
}

function readBoolean(formData: FormData, key: string) {
  return readText(formData, key) === "true";
}

function readAddOnServiceIds(formData: FormData) {
  return [...new Set(formData.getAll("addOnServiceIds").map(String).filter(Boolean))];
}

function revalidateSalesViews() {
  revalidatePath("/sales");
  revalidatePath("/inventory");
  revalidatePath("/customers");
  revalidatePath("/receivables");
}

function validateDiscountSelection(
  listPrice: number,
  manualDiscountMethod: DiscountMethodValue | null,
  manualDiscountValue: number | null,
) {
  const manualDiscountTouched =
    manualDiscountMethod !== null || manualDiscountValue !== null;

  if (!manualDiscountTouched) {
    return;
  }

  if (!manualDiscountMethod || manualDiscountValue === null) {
    redirectSalesNotice("invalid-sale-form");
  }

  if (
    manualDiscountMethod === DiscountMethod.PERCENTAGE &&
    manualDiscountValue > 100
  ) {
    redirectSalesNotice("invalid-sale-form");
  }

  if (
    manualDiscountMethod === DiscountMethod.FIXED_AMOUNT &&
    manualDiscountValue > listPrice
  ) {
    redirectSalesNotice("invalid-sale-form");
  }
}

function getReceivableStatus(actualReceivedAmount: number, receivableAmount: number) {
  if (receivableAmount <= 0) {
    return null;
  }

  return actualReceivedAmount > 0
    ? ReceivableStatus.PARTIALLY_PAID
    : ReceivableStatus.UNPAID;
}

export async function createSaleAction(formData: FormData) {
  const currentUser = await requireCurrentUser();

  const customerId = readText(formData, "customerId");
  const inventoryItemId = readText(formData, "inventoryItemId");
  const saleDate = readRequiredDate(formData, "saleDate");
  const ratePlanId = readOptionalText(formData, "ratePlanId");
  const listPrice = readOptionalInt(formData, "listPrice");
  const discountApplied = readBoolean(formData, "discountApplied");
  const manualDiscountMethod = readDiscountMethod(formData, "discountMethod");
  const manualDiscountValue = readOptionalInt(formData, "discountValue");
  const rebateAmountInput = readOptionalInt(formData, "rebateAmount");
  const cashAmount = readIntOrZero(formData, "cashAmount");
  const cardAmount = readIntOrZero(formData, "cardAmount");
  const bankTransferAmount = readIntOrZero(formData, "bankTransferAmount");
  const cardInstallmentMonths = readOptionalInt(formData, "cardInstallmentMonths");
  const notes = readOptionalText(formData, "notes");
  const selectedAddOnServiceIds = readAddOnServiceIds(formData);

  if (
    !customerId ||
    !inventoryItemId ||
    !saleDate ||
    listPrice === null ||
    listPrice <= 0 ||
    cashAmount === null ||
    cardAmount === null ||
    bankTransferAmount === null
  ) {
    redirectSalesNotice("invalid-sale-form");
  }

  validateDiscountSelection(listPrice, manualDiscountMethod, manualDiscountValue);

  const [
    customer,
    inventoryItem,
    availableRatePlans,
    addOnServices,
    rebatePolicies,
    saleProfitPolicies,
    discountPolicies,
  ] = await Promise.all([
      prisma.customer.findFirst({
        where: {
          id: customerId,
          isHidden: false,
        },
        select: {
          id: true,
        },
      }),
      prisma.inventoryItem.findFirst({
        where: {
          id: inventoryItemId,
          status: InventoryStatus.IN_STOCK,
          isHidden: false,
          carrier: {
            isActive: true,
          },
          deviceModel: {
            isActive: true,
          },
        },
        select: {
          id: true,
          carrierId: true,
          deviceModelId: true,
          costAmount: true,
        },
      }),
      prisma.ratePlan.findMany({
        where: {
          isActive: true,
        },
        select: {
          id: true,
          carrierId: true,
        },
      }),
      prisma.addOnService.findMany({
        where: {
          isActive: true,
        },
        select: {
          id: true,
          carrierId: true,
          name: true,
          monthlyFee: true,
        },
      }),
      prisma.rebatePolicy.findMany({
        where: {
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          carrierId: true,
          deviceModelId: true,
          startsAt: true,
          endsAt: true,
          defaultRebateAmount: true,
        },
      }),
      prisma.saleProfitPolicy.findMany({
        where: {
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          carrierId: true,
          startsAt: true,
          endsAt: true,
          calculationMethod: true,
          calculationValue: true,
        },
      }),
      prisma.discountPolicy.findMany({
        where: {
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          carrierId: true,
          deviceModelId: true,
          target: true,
          startsAt: true,
          endsAt: true,
          discountMethod: true,
          discountValue: true,
        },
      }),
    ]);

  if (!customer) {
    redirectSalesNotice("sale-customer-not-found");
  }

  if (!inventoryItem) {
    redirectSalesNotice("sale-inventory-unavailable");
  }

  const carrierRatePlans = availableRatePlans.filter(
    (ratePlan) => ratePlan.carrierId === inventoryItem.carrierId,
  );

  if (carrierRatePlans.length > 0 && !ratePlanId) {
    redirectSalesNotice("invalid-sale-form");
  }

  if (
    ratePlanId &&
    !carrierRatePlans.some((ratePlan) => ratePlan.id === ratePlanId)
  ) {
    redirectSalesNotice("sale-rate-plan-mismatch");
  }

  const availableServiceOptions = addOnServices.filter(
    (service) =>
      service.carrierId === null || service.carrierId === inventoryItem.carrierId,
  );

  if (
    selectedAddOnServiceIds.some(
      (serviceId) =>
        !availableServiceOptions.some((service) => service.id === serviceId),
    )
  ) {
    redirectSalesNotice("sale-service-mismatch");
  }

  const matchedDiscountPolicy = findMatchingDiscountPolicy(
    discountPolicies,
    saleDate,
    inventoryItem.carrierId,
    inventoryItem.deviceModelId,
  );
  const matchedRebatePolicy = findMatchingRebatePolicy(
    rebatePolicies,
    saleDate,
    inventoryItem.carrierId,
    inventoryItem.deviceModelId,
  );
  const matchedSaleProfitPolicy = findMatchingSaleProfitPolicy(
    saleProfitPolicies,
    saleDate,
    inventoryItem.carrierId,
  );

  const effectiveDiscountMethod = discountApplied
    ? manualDiscountMethod ?? matchedDiscountPolicy?.discountMethod ?? null
    : null;
  const effectiveDiscountValue = discountApplied
    ? manualDiscountValue ?? matchedDiscountPolicy?.discountValue ?? null
    : null;

  if (discountApplied && (!effectiveDiscountMethod || effectiveDiscountValue === null)) {
    redirectSalesNotice("sale-discount-rule-missing");
  }

  const rebateAmount =
    rebateAmountInput ?? matchedRebatePolicy?.defaultRebateAmount ?? 0;

  const salesBaseAmounts = calculateSalesAmounts({
    listPrice,
    discountApplied,
    discountMethod: effectiveDiscountMethod,
    discountValue: effectiveDiscountValue,
    rebateAmount,
    policyRevenueAmount: 0,
    cashAmount,
    cardAmount,
    bankTransferAmount,
  });

  const policyRevenueAmount = matchedSaleProfitPolicy
    ? calculatePolicyRevenueAmount(
        salesBaseAmounts.finalSalePrice,
        matchedSaleProfitPolicy.calculationMethod,
        matchedSaleProfitPolicy.calculationValue,
      )
    : 0;

  const calculationResult = calculateSalesAmounts({
    listPrice,
    discountApplied,
    discountMethod: effectiveDiscountMethod,
    discountValue: effectiveDiscountValue,
    rebateAmount,
    policyRevenueAmount,
    cashAmount,
    cardAmount,
    bankTransferAmount,
  });

  if (calculationResult.actualReceivedAmount > calculationResult.finalSalePrice) {
    redirectSalesNotice("sale-overpayment");
  }

  const selectedServices = availableServiceOptions.filter((service) =>
    selectedAddOnServiceIds.includes(service.id),
  );
  const receivableStatus = getReceivableStatus(
    calculationResult.actualReceivedAmount,
    calculationResult.receivableAmount,
  );

  try {
    await prisma.$transaction(async (tx) => {
      const latestInventoryItem = await tx.inventoryItem.findUnique({
        where: {
          id: inventoryItem.id,
        },
        select: {
          status: true,
          isHidden: true,
        },
      });

      if (
        !latestInventoryItem ||
        latestInventoryItem.status !== InventoryStatus.IN_STOCK ||
        latestInventoryItem.isHidden
      ) {
        throw new Error("SALE_INVENTORY_UNAVAILABLE");
      }

      const sale = await tx.sale.create({
        data: {
          saleDate,
          status: SaleStatus.COMPLETED,
          customerId: customer.id,
          staffId: currentUser.id,
          carrierId: inventoryItem.carrierId,
          ratePlanId,
          inventoryItemId: inventoryItem.id,
          deviceModelId: inventoryItem.deviceModelId,
          listPrice,
          discountApplied,
          discountMethod: effectiveDiscountMethod,
          discountValue: effectiveDiscountValue,
          discountSuggestionMethod: matchedDiscountPolicy?.discountMethod ?? null,
          discountSuggestionValue: matchedDiscountPolicy?.discountValue ?? null,
          discountAmount: calculationResult.discountAmount,
          discountedPrice: calculationResult.discountedPrice,
          subsidyAmount: 0,
          finalSalePrice: calculationResult.finalSalePrice,
          cashAmount,
          cardAmount,
          bankTransferAmount,
          cardInstallmentMonths:
            cardAmount > 0 ? cardInstallmentMonths ?? null : null,
          actualReceivedAmount: calculationResult.actualReceivedAmount,
          receivableAmount: calculationResult.receivableAmount,
          deviceCostAmount: inventoryItem.costAmount,
          rebateAmount,
          policyRevenueAmount,
          profitCalculationBaseAmount: matchedSaleProfitPolicy
            ? calculationResult.profitCalculationBaseAmount
            : null,
          profitDeductionAmount: 0,
          totalProfitAmount: calculationResult.totalProfitAmount,
          appliedRebatePolicyId: matchedRebatePolicy?.id ?? null,
          appliedSaleProfitPolicyId: matchedSaleProfitPolicy?.id ?? null,
          appliedDiscountPolicyId:
            manualDiscountMethod !== null
              ? null
              : (matchedDiscountPolicy?.id ?? null),
          appliedRebatePolicyName: matchedRebatePolicy?.name ?? null,
          appliedSaleProfitPolicyName: matchedSaleProfitPolicy?.name ?? null,
          appliedDiscountPolicyName:
            manualDiscountMethod !== null
              ? null
              : (matchedDiscountPolicy?.name ?? null),
          notes,
          selectedServices: {
            create: selectedServices.map((service) => ({
              addOnServiceId: service.id,
              nameSnapshot: service.name,
              monthlyFee: service.monthlyFee,
            })),
          },
        },
      });

      if (calculationResult.receivableAmount > 0 && receivableStatus) {
        await tx.receivable.create({
          data: {
            saleId: sale.id,
            customerId: customer.id,
            status: receivableStatus,
            originalAmount: calculationResult.receivableAmount,
            balanceAmount: calculationResult.receivableAmount,
            memo: notes,
          },
        });
      }

      await tx.inventoryItem.update({
        where: {
          id: inventoryItem.id,
        },
        data: {
          status: InventoryStatus.SOLD,
          dispatchedAt: saleDate,
        },
      });

      await tx.customer.update({
        where: {
          id: customer.id,
        },
        data: {
          currentCarrierId: inventoryItem.carrierId,
        },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "SALE_INVENTORY_UNAVAILABLE") {
      redirectSalesNotice("sale-inventory-unavailable");
    }

    throw error;
  }

  revalidateSalesViews();
}

export async function cancelSaleAction(formData: FormData) {
  await requireCurrentUser();

  const saleId = readText(formData, "saleId");
  const cancellationReason = readOptionalText(formData, "cancellationReason");

  if (!saleId) {
    redirectSalesNotice("sale-not-found");
  }

  const sale = await prisma.sale.findUnique({
    where: {
      id: saleId,
    },
    select: {
      id: true,
      status: true,
      customerId: true,
      inventoryItemId: true,
      receivable: {
        select: {
          id: true,
        },
      },
      payments: {
        where: {
          status: PaymentStatus.COMPLETED,
        },
        select: {
          id: true,
        },
      },
    },
  });

  if (!sale || sale.status !== SaleStatus.COMPLETED) {
    redirectSalesNotice("sale-not-found");
  }

  if (sale.payments.length > 0) {
    redirectSalesNotice("sale-cancel-blocked");
  }

  try {
    await prisma.$transaction(async (tx) => {
      const latestSale = await tx.sale.findUnique({
        where: {
          id: sale.id,
        },
        select: {
          status: true,
        },
      });

      if (!latestSale || latestSale.status !== SaleStatus.COMPLETED) {
        throw new Error("SALE_NOT_FOUND");
      }

      await tx.sale.update({
        where: {
          id: sale.id,
        },
        data: {
          status: SaleStatus.CANCELED,
          canceledAt: new Date(),
          cancellationReason,
        },
      });

      if (sale.receivable) {
        await tx.receivable.delete({
          where: {
            saleId: sale.id,
          },
        });
      }

      const currentCarrierId = await tx.sale.findFirst({
        where: {
          customerId: sale.customerId,
          status: SaleStatus.COMPLETED,
          id: {
            not: sale.id,
          },
        },
        orderBy: [{ saleDate: "desc" }, { createdAt: "desc" }],
        select: {
          carrierId: true,
        },
      });

      await tx.inventoryItem.update({
        where: {
          id: sale.inventoryItemId,
        },
        data: {
          status: InventoryStatus.IN_STOCK,
          dispatchedAt: null,
        },
      });

      await tx.customer.update({
        where: {
          id: sale.customerId,
        },
        data: {
          currentCarrierId: currentCarrierId?.carrierId ?? null,
        },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "SALE_NOT_FOUND") {
      redirectSalesNotice("sale-not-found");
    }

    throw error;
  }

  revalidateSalesViews();
}
