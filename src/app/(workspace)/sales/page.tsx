import type { Metadata } from "next";

import { SalesOverview } from "@/components/workspace/sales-overview";
import type { SalesNotice } from "@/components/workspace/sales-types";
import { getCurrentUser } from "@/lib/auth/dal";
import { formatKstDate } from "@/lib/date-utils";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "판매 관리",
};

function readSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function isNoticeValue(value: string): value is SalesNotice {
  return (
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

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{
    notice?: string | string[];
  }>;
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return null;
  }

  const rawSearchParams = await searchParams;
  const noticeValue = readSearchParam(rawSearchParams.notice);
  const notice = isNoticeValue(noticeValue) ? noticeValue : null;

  const [
    customers,
    activeCarriers,
    sharedServices,
    rebatePolicies,
    saleProfitPolicies,
    discountPolicies,
    availableInventory,
    sales,
  ] = await Promise.all([
    prisma.customer.findMany({
      where: {
        isHidden: false,
      },
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        phone: true,
        currentCarrier: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.carrier.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
      include: {
        ratePlans: {
          where: {
            isActive: true,
          },
          orderBy: [{ monthlyFee: "desc" }, { name: "asc" }],
          select: {
            id: true,
            name: true,
            monthlyFee: true,
          },
        },
        services: {
          where: {
            isActive: true,
          },
          orderBy: {
            name: "asc",
          },
          select: {
            id: true,
            name: true,
            monthlyFee: true,
          },
        },
      },
    }),
    prisma.addOnService.findMany({
      where: {
        isActive: true,
        carrierId: null,
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        monthlyFee: true,
      },
    }),
    prisma.rebatePolicy.findMany({
      where: {
        isActive: true,
      },
      orderBy: [{ startsAt: "desc" }, { name: "asc" }],
      include: {
        carrier: {
          select: {
            name: true,
          },
        },
        deviceModel: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.saleProfitPolicy.findMany({
      where: {
        isActive: true,
      },
      orderBy: [{ startsAt: "desc" }, { name: "asc" }],
      include: {
        carrier: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.discountPolicy.findMany({
      where: {
        isActive: true,
      },
      orderBy: [{ startsAt: "desc" }, { name: "asc" }],
      include: {
        carrier: {
          select: {
            name: true,
          },
        },
        deviceModel: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.inventoryItem.findMany({
      where: {
        status: "IN_STOCK",
        isHidden: false,
        carrier: {
          isActive: true,
        },
        deviceModel: {
          isActive: true,
        },
      },
      orderBy: [{ receivedAt: "asc" }, { createdAt: "asc" }],
      include: {
        carrier: {
          select: {
            name: true,
          },
        },
        deviceModel: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.sale.findMany({
      take: 12,
      orderBy: [{ saleDate: "desc" }, { createdAt: "desc" }],
      include: {
        customer: {
          select: {
            name: true,
          },
        },
        carrier: {
          select: {
            name: true,
          },
        },
        deviceModel: {
          select: {
            name: true,
          },
        },
        ratePlan: {
          select: {
            name: true,
          },
        },
        staff: {
          select: {
            displayName: true,
          },
        },
        selectedServices: {
          select: {
            nameSnapshot: true,
          },
        },
        receivable: {
          select: {
            balanceAmount: true,
            status: true,
          },
        },
        payments: {
          where: {
            status: "COMPLETED",
          },
          select: {
            id: true,
          },
        },
      },
    }),
  ]);

  return (
    <SalesOverview
      currentUserName={currentUser.displayName}
      defaultSaleDate={formatKstDate(new Date())}
      notice={notice}
      customers={customers.map((customer) => ({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        currentCarrierName: customer.currentCarrier?.name ?? null,
      }))}
      carriers={activeCarriers.map((carrier) => ({
        id: carrier.id,
        name: carrier.name,
        code: carrier.code,
        ratePlans: carrier.ratePlans,
        addOnServices: [
          ...sharedServices.map((service) => ({
            id: service.id,
            name: `공통 / ${service.name}`,
            monthlyFee: service.monthlyFee,
            scope: "shared" as const,
          })),
          ...carrier.services.map((service) => ({
            id: service.id,
            name: service.name,
            monthlyFee: service.monthlyFee,
            scope: "carrier" as const,
          })),
        ],
      }))}
      rebatePolicies={rebatePolicies.map((policy) => ({
        id: policy.id,
        name: policy.name,
        carrierId: policy.carrierId,
        carrierName: policy.carrier.name,
        deviceModelId: policy.deviceModelId,
        deviceModelName: policy.deviceModel.name,
        startsAt: policy.startsAt.toISOString(),
        endsAt: policy.endsAt.toISOString(),
        defaultRebateAmount: policy.defaultRebateAmount,
      }))}
      saleProfitPolicies={saleProfitPolicies.map((policy) => ({
        id: policy.id,
        name: policy.name,
        carrierId: policy.carrierId,
        carrierName: policy.carrier.name,
        startsAt: policy.startsAt.toISOString(),
        endsAt: policy.endsAt.toISOString(),
        calculationMethod: policy.calculationMethod,
        calculationValue: policy.calculationValue,
      }))}
      discountPolicies={discountPolicies.map((policy) => ({
        id: policy.id,
        name: policy.name,
        target: policy.target,
        carrierId: policy.carrierId,
        carrierName: policy.carrier?.name ?? null,
        deviceModelId: policy.deviceModelId,
        deviceModelName: policy.deviceModel?.name ?? null,
        startsAt: policy.startsAt.toISOString(),
        endsAt: policy.endsAt.toISOString(),
        discountMethod: policy.discountMethod,
        discountValue: policy.discountValue,
      }))}
      availableInventory={availableInventory.map((item) => ({
        id: item.id,
        carrierId: item.carrierId,
        carrierName: item.carrier.name,
        deviceModelId: item.deviceModelId,
        deviceModelName: item.deviceModel.name,
        color: item.color,
        capacity: item.capacity,
        imei: item.imei,
        costAmount: item.costAmount,
        receivedAt: item.receivedAt.toISOString(),
      }))}
      sales={sales.map((sale) => ({
        id: sale.id,
        saleDate: sale.saleDate.toISOString(),
        status: sale.status,
        canceledAt: sale.canceledAt?.toISOString() ?? null,
        cancellationReason: sale.cancellationReason,
        customerName: sale.customer.name,
        carrierName: sale.carrier.name,
        deviceModelName: sale.deviceModel.name,
        ratePlanName: sale.ratePlan?.name ?? null,
        staffName: sale.staff.displayName,
        finalSalePrice: sale.finalSalePrice,
        discountApplied: sale.discountApplied,
        discountMethod: sale.discountMethod,
        discountValue: sale.discountValue,
        rebateAmount: sale.rebateAmount,
        policyRevenueAmount: sale.policyRevenueAmount,
        receivableAmount: sale.receivableAmount,
        receivableBalance: sale.receivable?.balanceAmount ?? 0,
        receivableStatus: sale.receivable?.status ?? null,
        selectedServices: sale.selectedServices.map((service) => service.nameSnapshot),
        appliedDiscountPolicyName: sale.appliedDiscountPolicyName,
        appliedRebatePolicyName: sale.appliedRebatePolicyName,
        appliedSaleProfitPolicyName: sale.appliedSaleProfitPolicyName,
        canCancel: sale.status === "COMPLETED" && sale.payments.length === 0,
        hasPayments: sale.payments.length > 0,
      }))}
    />
  );
}
