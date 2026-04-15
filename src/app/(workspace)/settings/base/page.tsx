import type { Metadata } from "next";

import { BaseInfoOverview } from "@/components/workspace/base-info-overview";
import { requireRole } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "기초정보",
};

export default async function BaseInfoPage() {
  await requireRole("ADMIN");

  const [storeRows, carrierRows, ratePlanRows, addOnServiceRows] = await Promise.all([
    prisma.store.findMany({
      orderBy: [{ isDefault: "desc" }, { isActive: "desc" }, { name: "asc" }],
    }),
    prisma.carrier.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      include: {
        _count: {
          select: {
            ratePlans: true,
            services: true,
          },
        },
      },
    }),
    prisma.ratePlan.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      include: {
        carrier: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
      },
    }),
    prisma.addOnService.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      include: {
        carrier: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
      },
    }),
  ]);

  return (
    <BaseInfoOverview
      stores={storeRows.map((store) => ({
        id: store.id,
        code: store.code,
        name: store.name,
        region: store.region,
        isActive: store.isActive,
        isDefault: store.isDefault,
      }))}
      carriers={carrierRows.map((carrier) => ({
        id: carrier.id,
        code: carrier.code,
        name: carrier.name,
        isActive: carrier.isActive,
        ratePlanCount: carrier._count.ratePlans,
        addOnServiceCount: carrier._count.services,
      }))}
      ratePlans={ratePlanRows.map((ratePlan) => ({
        id: ratePlan.id,
        carrierId: ratePlan.carrierId,
        carrierName: ratePlan.carrier.name,
        carrierActive: ratePlan.carrier.isActive,
        name: ratePlan.name,
        monthlyFee: ratePlan.monthlyFee,
        description: ratePlan.description,
        isActive: ratePlan.isActive,
      }))}
      addOnServices={addOnServiceRows.map((service) => ({
        id: service.id,
        carrierId: service.carrierId,
        carrierName: service.carrier?.name ?? null,
        carrierActive: service.carrier?.isActive ?? null,
        name: service.name,
        monthlyFee: service.monthlyFee,
        description: service.description,
        isActive: service.isActive,
      }))}
    />
  );
}
