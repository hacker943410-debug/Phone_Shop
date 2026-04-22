import type {
  SalesFilters,
  SalesNotice,
  SalesStatusFilterValue,
} from "@/components/workspace/sales-types";
import { getActivationEligibleDate } from "@/lib/activation-rules";
import { getCurrentUser } from "@/lib/auth/dal";
import { formatKstDate, parseKstDateInput } from "@/lib/date-utils";
import { prisma } from "@/lib/prisma";
import { buildSaleProductLabels } from "@/lib/sale-registration";

const salesPageSize = 10;

export type SalesSearchParams = {
  q?: string | string[];
  carrierId?: string | string[];
  storeId?: string | string[];
  status?: string | string[];
  dateFrom?: string | string[];
  dateTo?: string | string[];
  page?: string | string[];
  notice?: string | string[];
};

function readSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function readPageNumber(value: string | string[] | undefined) {
  const parsed = Number.parseInt(readSearchParam(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function isNoticeValue(value: string): value is SalesNotice {
  return (
    value === "sale-created" ||
    value === "invalid-sale-form" ||
    value === "sale-customer-not-found" ||
    value === "sale-inventory-unavailable" ||
    value === "sale-rate-plan-mismatch" ||
    value === "sale-service-mismatch" ||
    value === "sale-overpayment" ||
    value === "sale-discount-rule-missing" ||
    value === "sale-not-found" ||
    value === "sale-cancel-blocked"
  );
}

function isSalesStatusFilterValue(value: string): value is SalesStatusFilterValue {
  return value === "all" || value === "COMPLETED" || value === "CANCELED";
}

function formatRetentionDisplay(input: {
  countUnit: "DAY" | "MONTH";
  countValue: number;
  monthCountMode: "INCLUDE_CURRENT_MONTH" | "EXCLUDE_CURRENT_MONTH" | null;
  eligibleDate: Date;
}) {
  const durationLabel =
    input.countUnit === "DAY"
      ? `+${input.countValue}일`
      : `+${input.countValue}개월${
          input.monthCountMode === "EXCLUDE_CURRENT_MONTH" ? "(당월 제외)" : ""
        }`;

  return `${durationLabel} / ${formatKstDate(input.eligibleDate)}까지`;
}

export async function getSalesCommonPageData() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return null;
  }

  const [
    customers,
    stores,
    activeCarriers,
    salesAgencies,
    sharedServices,
    activationRules,
    completedSales,
    saleProfitPolicies,
    staffCommissionPolicies,
    discountPolicies,
    availableInventory,
  ] = await Promise.all([
    prisma.customer.findMany({
      where: { isHidden: false },
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        phone: true,
        currentCarrierId: true,
        currentCarrier: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.store.findMany({
      where: { isActive: true },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
      },
    }),
    prisma.carrier.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: {
        ratePlans: {
          where: { isActive: true },
          orderBy: [{ monthlyFee: "desc" }, { name: "asc" }],
          select: {
            id: true,
            name: true,
            monthlyFee: true,
            voiceCallMinutes: true,
            videoCallMinutes: true,
            dataAllowanceGb: true,
          },
        },
        services: {
          where: { isActive: true },
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            monthlyFee: true,
          },
        },
      },
    }),
    prisma.salesAgency.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
      },
    }),
    prisma.addOnService.findMany({
      where: {
        isActive: true,
        carrierId: null,
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        monthlyFee: true,
      },
    }),
    prisma.carrierActivationRule.findMany({
      where: { isActive: true },
      select: {
        carrierId: true,
        countUnit: true,
        countValue: true,
        monthCountMode: true,
      },
    }),
    prisma.sale.findMany({
      where: {
        status: "COMPLETED",
      },
      select: {
        customerId: true,
        carrierId: true,
        saleDate: true,
        createdAt: true,
        ratePlanId: true,
        deviceModelId: true,
        selectedServices: {
          select: {
            addOnServiceId: true,
          },
        },
      },
    }),
    prisma.saleProfitPolicy.findMany({
      where: { isActive: true },
      orderBy: [{ startsAt: "desc" }, { name: "asc" }],
      include: {
        carrier: { select: { name: true } },
      },
    }),
    prisma.staffCommissionPolicy.findMany({
      where: {
        isActive: true,
        staffId: { not: null },
      },
      orderBy: [{ startsAt: "desc" }, { name: "asc" }],
      include: {
        staff: { select: { displayName: true, username: true } },
      },
    }),
    prisma.discountPolicy.findMany({
      where: {
        isActive: true,
        target: "DEVICE",
        deviceModelId: { not: null },
      },
      orderBy: [{ startsAt: "desc" }, { name: "asc" }],
      include: {
        deviceModel: { select: { name: true, manufacturer: true } },
      },
    }),
    prisma.inventoryItem.findMany({
      where: {
        status: "IN_STOCK",
        isHidden: false,
        carrier: { isActive: true },
        deviceModel: { isActive: true },
      },
      orderBy: [{ receivedAt: "asc" }, { createdAt: "asc" }],
      include: {
        carrier: { select: { name: true } },
        deviceModel: { select: { name: true } },
        store: { select: { name: true } },
      },
    }),
  ]);

  const ratePlanUsageCountMap = new Map<string, number>();
  const addOnServiceUsageCountMap = new Map<string, number>();
  const activationRuleMap = new Map(
    activationRules.map((rule) => [rule.carrierId, rule]),
  );
  const latestCustomerCarrierSaleMap = new Map<
    string,
    {
      saleDate: Date;
      createdAt: Date;
      deviceModelId: string;
      ratePlanId: string | null;
      selectedAddOnServiceIds: string[];
    }
  >();
  const todayKst = parseKstDateInput(formatKstDate(new Date()), "start");

  for (const sale of completedSales) {
    const latestSaleKey = `${sale.customerId}:${sale.carrierId}`;
    const currentLatestSale = latestCustomerCarrierSaleMap.get(latestSaleKey);

    if (
      !currentLatestSale ||
      sale.saleDate > currentLatestSale.saleDate ||
      (sale.saleDate.getTime() === currentLatestSale.saleDate.getTime() &&
        sale.createdAt > currentLatestSale.createdAt)
    ) {
      latestCustomerCarrierSaleMap.set(latestSaleKey, {
        saleDate: sale.saleDate,
        createdAt: sale.createdAt,
        deviceModelId: sale.deviceModelId,
        ratePlanId: sale.ratePlanId,
        selectedAddOnServiceIds: sale.selectedServices.map(
          (service) => service.addOnServiceId,
        ),
      });
    }

    if (sale.ratePlanId) {
      const ratePlanKey = `${sale.carrierId}:${sale.ratePlanId}`;
      ratePlanUsageCountMap.set(
        ratePlanKey,
        (ratePlanUsageCountMap.get(ratePlanKey) ?? 0) + 1,
      );
    }

    for (const service of sale.selectedServices) {
      const serviceKey = `${sale.carrierId}:${service.addOnServiceId}`;
      addOnServiceUsageCountMap.set(
        serviceKey,
        (addOnServiceUsageCountMap.get(serviceKey) ?? 0) + 1,
      );
    }
  }

  return {
    currentUserId: currentUser.id,
    currentUserName: currentUser.displayName,
    defaultSaleDate: formatKstDate(new Date()),
    customers: customers.map((customer) => {
      let retentionDisplay: string | null = null;
      let retentionRemainingDays: number | null = null;
      const latestCustomerCarrierSale = customer.currentCarrierId
        ? latestCustomerCarrierSaleMap.get(`${customer.id}:${customer.currentCarrierId}`)
        : null;

      if (customer.currentCarrierId) {
        const activationRule = activationRuleMap.get(customer.currentCarrierId);

        if (!activationRule) {
          retentionDisplay = "규칙 없음";
        } else {
          const latestSaleDate = latestCustomerCarrierSale?.saleDate ?? null;

          if (!latestSaleDate) {
            retentionDisplay = "판매 이력 없음";
          } else {
            const eligibleDate = getActivationEligibleDate(latestSaleDate, {
              countUnit: activationRule.countUnit,
              countValue: activationRule.countValue,
              monthCountMode: activationRule.monthCountMode,
            });

            retentionDisplay = formatRetentionDisplay({
              countUnit: activationRule.countUnit,
              countValue: activationRule.countValue,
              monthCountMode: activationRule.monthCountMode,
              eligibleDate,
            });
            retentionRemainingDays = Math.max(
              0,
              Math.ceil(
                (eligibleDate.getTime() - todayKst.getTime()) / 86_400_000,
              ),
            );
          }
        }
      }

      return {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        currentCarrierId: customer.currentCarrierId,
        currentCarrierName: customer.currentCarrier?.name ?? null,
        retentionDisplay,
        retentionRemainingDays,
        latestSaleDeviceModelId: latestCustomerCarrierSale?.deviceModelId ?? null,
        latestSaleRatePlanId: latestCustomerCarrierSale?.ratePlanId ?? null,
        latestSaleAddOnServiceIds:
          latestCustomerCarrierSale?.selectedAddOnServiceIds ?? [],
      };
    }),
    stores,
    salesAgencies,
    carriers: activeCarriers.map((carrier) => ({
      id: carrier.id,
      name: carrier.name,
      code: carrier.code,
      ratePlans: carrier.ratePlans
        .map((ratePlan) => ({
          id: ratePlan.id,
          name: ratePlan.name,
          monthlyFee: ratePlan.monthlyFee,
          voiceCallMinutes: ratePlan.voiceCallMinutes,
          videoCallMinutes: ratePlan.videoCallMinutes,
          dataAllowanceGb: ratePlan.dataAllowanceGb,
          usageCount:
            ratePlanUsageCountMap.get(`${carrier.id}:${ratePlan.id}`) ?? 0,
        }))
        .sort(
          (left, right) =>
            right.usageCount - left.usageCount ||
            right.monthlyFee - left.monthlyFee ||
            left.name.localeCompare(right.name, "ko"),
        ),
      addOnServices: [
        ...sharedServices.map((service) => ({
          id: service.id,
          name: `공통 / ${service.name}`,
          monthlyFee: service.monthlyFee,
          scope: "shared" as const,
          usageCount:
            addOnServiceUsageCountMap.get(`${carrier.id}:${service.id}`) ?? 0,
        })),
        ...carrier.services.map((service) => ({
          id: service.id,
          name: service.name,
          monthlyFee: service.monthlyFee,
          scope: "carrier" as const,
          usageCount:
            addOnServiceUsageCountMap.get(`${carrier.id}:${service.id}`) ?? 0,
        })),
      ].sort(
        (left, right) =>
          right.usageCount - left.usageCount ||
          (right.monthlyFee ?? -1) - (left.monthlyFee ?? -1) ||
          left.name.localeCompare(right.name, "ko"),
      ),
    })),
    saleProfitPolicies: saleProfitPolicies.map((policy) => ({
      id: policy.id,
      name: policy.name,
      carrierId: policy.carrierId,
      carrierName: policy.carrier.name,
      startsAt: policy.startsAt.toISOString(),
      endsAt: policy.endsAt.toISOString(),
      calculationMethod: policy.calculationMethod,
      calculationValue: policy.calculationValue,
    })),
    staffCommissionPolicies: staffCommissionPolicies.map((policy) => ({
      id: policy.id,
      name: policy.name,
      staffId: policy.staffId ?? "",
      staffName: policy.staff?.displayName ?? policy.name,
      staffCode: policy.staff?.username ?? "",
      startsAt: policy.startsAt.toISOString(),
      endsAt: policy.endsAt.toISOString(),
      calculationMethod: policy.calculationMethod,
      calculationValue: policy.calculationValue,
    })),
    discountPolicies: discountPolicies.map((policy) => ({
      id: policy.id,
      name: policy.name,
      deviceModelId: policy.deviceModelId ?? "",
      deviceModelName: policy.deviceModel?.name ?? policy.name,
      manufacturer: policy.deviceModel?.manufacturer ?? null,
      startsAt: policy.startsAt.toISOString(),
      endsAt: policy.endsAt.toISOString(),
      discountMethod: policy.discountMethod,
      discountValue: policy.discountValue,
    })),
    availableInventory: availableInventory.map((item) => ({
      id: item.id,
      carrierId: item.carrierId,
      carrierName: item.carrier.name,
      deviceModelId: item.deviceModelId,
      deviceModelName: item.deviceModel.name,
      storeName: item.store?.name ?? null,
      color: item.color,
      capacity: item.capacity,
      serialNumber: item.serialNumber,
      modelNumber: item.modelNumber,
      costAmount: item.costAmount,
      receivedAt: item.receivedAt.toISOString(),
    })),
  };
}

export async function getSalesOverviewPageData(searchParams: SalesSearchParams) {
  const commonData = await getSalesCommonPageData();

  if (!commonData) {
    return null;
  }

  const q = readSearchParam(searchParams.q);
  const carrierId = readSearchParam(searchParams.carrierId);
  const storeId = readSearchParam(searchParams.storeId);
  const statusValue = readSearchParam(searchParams.status) || "all";
  const requestedPage = readPageNumber(searchParams.page);
  const noticeValue = readSearchParam(searchParams.notice);
  const normalizedQuery = q.replace(/\D/g, "");

  let dateFrom = readSearchParam(searchParams.dateFrom);
  let dateTo = readSearchParam(searchParams.dateTo);

  if (dateFrom && dateTo && dateFrom > dateTo) {
    [dateFrom, dateTo] = [dateTo, dateFrom];
  }

  const notice = isNoticeValue(noticeValue) ? noticeValue : null;
  const status = isSalesStatusFilterValue(statusValue) ? statusValue : "all";

  const filters: SalesFilters = {
    q,
    carrierId,
    storeId,
    status,
    dateFrom,
    dateTo,
  };

  const salesSearchClauses = q
      ? [
        { customer: { name: { contains: q } } },
        { customer: { phone: { contains: q } } },
        { carrier: { name: { contains: q } } },
        { salesAgency: { name: { contains: q } } },
        { deviceModel: { name: { contains: q } } },
        { staff: { displayName: { contains: q } } },
        { inventoryItem: { serialNumber: { contains: q } } },
        { inventoryItem: { modelNumber: { contains: q } } },
        ...(normalizedQuery
          ? [{ customer: { normalizedPhone: { contains: normalizedQuery } } }]
          : []),
      ]
    : [];

  const salesWhere = {
    ...(salesSearchClauses.length > 0 ? { OR: salesSearchClauses } : {}),
    ...(carrierId ? { carrierId } : {}),
    ...(storeId ? { storeId } : {}),
    ...(status !== "all" ? { status } : {}),
    ...(dateFrom || dateTo
      ? {
          saleDate: {
            ...(dateFrom ? { gte: parseKstDateInput(dateFrom, "start") } : {}),
            ...(dateTo ? { lte: parseKstDateInput(dateTo, "end") } : {}),
          },
        }
      : {}),
  };

  const [
    filteredSalesCount,
    filteredCompletedSalesCount,
    filteredCompletedSalesAggregate,
    filteredOutstandingSalesCount,
  ] = await Promise.all([
    prisma.sale.count({ where: salesWhere }),
    prisma.sale.count({
      where: {
        ...salesWhere,
        status: "COMPLETED",
      },
    }),
    prisma.sale.aggregate({
      where: {
        ...salesWhere,
        status: "COMPLETED",
      },
      _sum: {
        finalSalePrice: true,
      },
    }),
    prisma.sale.count({
      where: {
        ...salesWhere,
        receivable: {
          is: {
            balanceAmount: {
              gt: 0,
            },
          },
        },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredSalesCount / salesPageSize));
  const page = Math.min(requestedPage, totalPages);

  const sales = await prisma.sale.findMany({
    where: salesWhere,
    skip: (page - 1) * salesPageSize,
    take: salesPageSize,
    orderBy: [{ saleDate: "desc" }, { createdAt: "desc" }],
    include: {
      customer: { select: { name: true, phone: true } },
      carrier: { select: { name: true } },
      deviceModel: { select: { name: true } },
      inventoryItem: { select: { serialNumber: true, modelNumber: true } },
      salesAgency: { select: { name: true } },
      store: { select: { name: true } },
      ratePlan: { select: { name: true } },
      staff: { select: { displayName: true } },
      selectedServices: { select: { nameSnapshot: true } },
      receivable: { select: { balanceAmount: true, status: true } },
      payments: {
        where: { status: "COMPLETED" },
        select: { id: true },
      },
    },
  });

  return {
    ...commonData,
    notice,
    filters,
    pagination: {
      page,
      pageSize: salesPageSize,
      totalCount: filteredSalesCount,
      totalPages,
    },
    metrics: {
      completedCount: filteredCompletedSalesCount,
      completedRevenue: filteredCompletedSalesAggregate._sum.finalSalePrice ?? 0,
      outstandingCount: filteredOutstandingSalesCount,
    },
    sales: sales.map((sale) => {
      const productLabels = buildSaleProductLabels({
        wirelessPostpaidSelected: sale.wirelessPostpaidSelected,
        wirelessPrepaidSelected: sale.wirelessPrepaidSelected,
        wirelessGeneralSelected: sale.wirelessGeneralSelected,
        wirelessUsimOnlySelected: sale.wirelessUsimOnlySelected,
        wirelessUsedPhoneSelected: sale.wirelessUsedPhoneSelected,
        wirelessEggSelected: sale.wirelessEggSelected,
        wiredInternetSelected: sale.wiredInternetSelected,
        wiredTvSelected: sale.wiredTvSelected,
        wiredLandlineSelected: sale.wiredLandlineSelected,
        wiredInternetPhoneSelected: sale.wiredInternetPhoneSelected,
        wiredBundleSelected: sale.wiredBundleSelected,
        additionalDeviceOnlySelected: sale.additionalDeviceOnlySelected,
      });

      return {
        id: sale.id,
        saleDate: sale.saleDate.toISOString(),
        status: sale.status,
        customerEntryType: sale.customerEntryType,
        activationType: sale.activationType,
        canceledAt: sale.canceledAt?.toISOString() ?? null,
        cancellationReason: sale.cancellationReason,
        storeName: sale.store?.name ?? null,
        salesAgencyName: sale.salesAgency?.name ?? null,
        customerName: sale.customer.name,
        customerPhone: sale.customer.phone,
        carrierName: sale.carrier.name,
        deviceModelName: sale.deviceModel.name,
        inventorySerialNumber: sale.inventoryItem.serialNumber,
        inventoryModelNumber: sale.inventoryItem.modelNumber,
        ratePlanName: sale.ratePlan?.name ?? null,
        staffName: sale.staff.displayName,
        subsidyAmount: sale.subsidyAmount,
        finalSalePrice: sale.finalSalePrice,
        discountApplied: sale.discountApplied,
        discountMethod: sale.discountMethod,
        discountValue: sale.discountValue,
        rebateAmount: sale.rebateAmount,
        policyRevenueAmount: sale.policyRevenueAmount,
        profitDeductionAmount: sale.profitDeductionAmount,
        receivableAmount: sale.receivableAmount,
        receivableBalance: sale.receivable?.balanceAmount ?? 0,
        receivableStatus: sale.receivable?.status ?? null,
        selectedServices: sale.selectedServices.map((service) => service.nameSnapshot),
        wirelessProducts: productLabels.wirelessProducts,
        wiredProducts: productLabels.wiredProducts,
        additionalProducts: productLabels.additionalProducts,
        appliedDiscountPolicyName: sale.appliedDiscountPolicyName,
        appliedSaleProfitPolicyName: sale.appliedSaleProfitPolicyName,
        appliedStaffCommissionPolicyName: sale.appliedStaffCommissionPolicyName,
        canCancel: sale.status === "COMPLETED" && sale.payments.length === 0,
        hasPayments: sale.payments.length > 0,
      };
    }),
  };
}
