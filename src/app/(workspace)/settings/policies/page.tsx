import type { Metadata } from "next";

import { PoliciesOverview } from "@/components/workspace/policies-overview";
import { requireRole } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "정책 관리",
};

export default async function PoliciesPage() {
  await requireRole("ADMIN");

  const [
    carriers,
    deviceModels,
    rebatePolicies,
    saleProfitPolicies,
    discountPolicies,
  ] = await Promise.all([
    prisma.carrier.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    }),
    prisma.deviceModel.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        manufacturer: true,
        isActive: true,
      },
    }),
    prisma.rebatePolicy.findMany({
      orderBy: [{ isActive: "desc" }, { startsAt: "desc" }, { name: "asc" }],
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
      orderBy: [{ isActive: "desc" }, { startsAt: "desc" }, { name: "asc" }],
      include: {
        carrier: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.discountPolicy.findMany({
      orderBy: [{ isActive: "desc" }, { startsAt: "desc" }, { name: "asc" }],
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
  ]);

  return (
    <PoliciesOverview
      carriers={carriers}
      deviceModels={deviceModels}
      rebatePolicies={rebatePolicies.map((policy) => ({
        id: policy.id,
        name: policy.name,
        carrierId: policy.carrierId,
        carrierName: policy.carrier.name,
        deviceModelId: policy.deviceModelId,
        deviceModelName: policy.deviceModel.name,
        startsAt: policy.startsAt,
        endsAt: policy.endsAt,
        defaultRebateAmount: policy.defaultRebateAmount,
        memo: policy.memo,
        isActive: policy.isActive,
      }))}
      saleProfitPolicies={saleProfitPolicies.map((policy) => ({
        id: policy.id,
        name: policy.name,
        carrierId: policy.carrierId,
        carrierName: policy.carrier.name,
        startsAt: policy.startsAt,
        endsAt: policy.endsAt,
        calculationMethod: policy.calculationMethod,
        calculationValue: policy.calculationValue,
        memo: policy.memo,
        isActive: policy.isActive,
      }))}
      discountPolicies={discountPolicies.map((policy) => ({
        id: policy.id,
        name: policy.name,
        target: policy.target,
        carrierId: policy.carrierId,
        carrierName: policy.carrier?.name ?? null,
        deviceModelId: policy.deviceModelId,
        deviceModelName: policy.deviceModel?.name ?? null,
        startsAt: policy.startsAt,
        endsAt: policy.endsAt,
        discountMethod: policy.discountMethod,
        discountValue: policy.discountValue,
        memo: policy.memo,
        isActive: policy.isActive,
      }))}
    />
  );
}
