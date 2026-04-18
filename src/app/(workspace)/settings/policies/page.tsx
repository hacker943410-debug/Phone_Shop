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
    staffs,
    saleProfitPolicies,
    staffCommissionPolicies,
    discountPolicies,
    carrierActivationRules,
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
      orderBy: [{ isActive: "desc" }, { manufacturer: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        manufacturer: true,
        isActive: true,
      },
    }),
    prisma.user.findMany({
      where: {
        role: {
          in: ["ADMIN", "STAFF"],
        },
      },
      orderBy: [{ isActive: "desc" }, { displayName: "asc" }, { username: "asc" }],
      select: {
        id: true,
        displayName: true,
        username: true,
        isActive: true,
      },
    }),
    prisma.saleProfitPolicy.findMany({
      orderBy: [{ isActive: "desc" }, { carrier: { name: "asc" } }],
      include: {
        carrier: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.staffCommissionPolicy.findMany({
      where: {
        staffId: {
          not: null,
        },
      },
      orderBy: [{ isActive: "desc" }, { staff: { displayName: "asc" } }, { startsAt: "desc" }],
      include: {
        staff: {
          select: {
            displayName: true,
            username: true,
          },
        },
      },
    }),
    prisma.discountPolicy.findMany({
      where: {
        target: "DEVICE",
        deviceModelId: {
          not: null,
        },
      },
      orderBy: [{ isActive: "desc" }, { deviceModel: { name: "asc" } }, { startsAt: "desc" }],
      include: {
        deviceModel: {
          select: {
            name: true,
            manufacturer: true,
          },
        },
      },
    }),
    prisma.carrierActivationRule.findMany({
      orderBy: [{ isActive: "desc" }, { carrier: { name: "asc" } }],
      include: {
        carrier: {
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
      staffs={staffs}
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
      staffCommissionPolicies={staffCommissionPolicies.map((policy) => ({
        id: policy.id,
        name: policy.name,
        staffId: policy.staffId ?? "",
        staffName: policy.staff?.displayName ?? policy.name,
        staffCode: policy.staff?.username ?? "-",
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
        deviceModelId: policy.deviceModelId ?? "",
        deviceModelName: policy.deviceModel?.name ?? policy.name,
        manufacturer: policy.deviceModel?.manufacturer ?? null,
        startsAt: policy.startsAt,
        endsAt: policy.endsAt,
        discountMethod: policy.discountMethod,
        discountValue: policy.discountValue,
        memo: policy.memo,
        isActive: policy.isActive,
      }))}
      carrierActivationRules={carrierActivationRules.map((rule) => ({
        id: rule.id,
        carrierId: rule.carrierId,
        carrierName: rule.carrier.name,
        countUnit: rule.countUnit,
        countValue: rule.countValue,
        monthCountMode: rule.monthCountMode,
        memo: rule.memo,
        isActive: rule.isActive,
      }))}
    />
  );
}
