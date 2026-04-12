import type { Metadata } from "next";

import { InventoryOverview } from "@/components/workspace/inventory-overview";
import { getCurrentUser } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { getRoleLabel } from "@/lib/auth/access";
import { InventoryStatus } from "../../../../prisma/generated/client/enums";

export const metadata: Metadata = {
  title: "재고 관리",
};

function readSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function isInventoryStatusValue(
  value: string,
): value is
  | "IN_STOCK"
  | "RESERVED"
  | "SOLD"
  | "RETURNED"
  | "DISCARDED" {
  return (
    value === InventoryStatus.IN_STOCK ||
    value === InventoryStatus.RESERVED ||
    value === InventoryStatus.SOLD ||
    value === InventoryStatus.RETURNED ||
    value === InventoryStatus.DISCARDED
  );
}

function isVisibilityValue(value: string): value is "all" | "visible" | "hidden" {
  return value === "all" || value === "visible" || value === "hidden";
}

function isNoticeValue(
  value: string,
): value is "duplicate-imei" | "invalid-inventory-form" | "inventory-not-found" {
  return (
    value === "duplicate-imei" ||
    value === "invalid-inventory-form" ||
    value === "inventory-not-found"
  );
}

function getLongHeldThreshold() {
  return new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
}

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string | string[];
    status?: string | string[];
    carrierId?: string | string[];
    assigneeId?: string | string[];
    visibility?: string | string[];
    notice?: string | string[];
  }>;
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return null;
  }

  const rawSearchParams = await searchParams;
  const q = readSearchParam(rawSearchParams.q);
  const statusValue = readSearchParam(rawSearchParams.status);
  const carrierId = readSearchParam(rawSearchParams.carrierId);
  const assigneeId = readSearchParam(rawSearchParams.assigneeId);
  const visibilityValue = readSearchParam(rawSearchParams.visibility) || "all";
  const noticeValue = readSearchParam(rawSearchParams.notice);

  const status = isInventoryStatusValue(statusValue) ? statusValue : "ALL";
  const visibility = isVisibilityValue(visibilityValue) ? visibilityValue : "all";
  const notice = isNoticeValue(noticeValue) ? noticeValue : null;

  const searchWhere = {
    ...(q
      ? {
          OR: [
            {
              imei: {
                contains: q,
              },
            },
            {
              color: {
                contains: q,
              },
            },
            {
              capacity: {
                contains: q,
              },
            },
            {
              carrier: {
                name: {
                  contains: q,
                },
              },
            },
            {
              deviceModel: {
                name: {
                  contains: q,
                },
              },
            },
          ],
        }
      : {}),
    ...(status !== "ALL"
      ? {
          status,
        }
      : {}),
    ...(carrierId
      ? {
          carrierId,
        }
      : {}),
    ...(assigneeId === "unassigned"
      ? {
          assigneeId: null,
        }
      : assigneeId
        ? {
            assigneeId,
          }
        : {}),
    ...(visibility === "hidden"
      ? {
          isHidden: true,
        }
      : visibility === "visible"
        ? {
            isHidden: false,
          }
        : {}),
  };

  const longHeldThreshold = getLongHeldThreshold();

  const [
    carriers,
    deviceModels,
    staffMembers,
    items,
    totalCount,
    availableCount,
    reservedCount,
    soldCount,
    hiddenCount,
    longHeldCount,
  ] = await Promise.all([
    prisma.carrier.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        code: true,
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
    prisma.user.findMany({
      where: {
        isActive: true,
      },
      orderBy: [{ role: "asc" }, { displayName: "asc" }],
      select: {
        id: true,
        displayName: true,
        role: true,
      },
    }),
    prisma.inventoryItem.findMany({
      where: searchWhere,
      orderBy: [{ isHidden: "asc" }, { receivedAt: "desc" }],
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
        assignee: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    }),
    prisma.inventoryItem.count(),
    prisma.inventoryItem.count({
      where: {
        status: InventoryStatus.IN_STOCK,
        isHidden: false,
      },
    }),
    prisma.inventoryItem.count({
      where: {
        status: InventoryStatus.RESERVED,
      },
    }),
    prisma.inventoryItem.count({
      where: {
        status: {
          in: [
            InventoryStatus.SOLD,
            InventoryStatus.RETURNED,
            InventoryStatus.DISCARDED,
          ],
        },
      },
    }),
    prisma.inventoryItem.count({
      where: {
        isHidden: true,
      },
    }),
    prisma.inventoryItem.count({
      where: {
        status: InventoryStatus.IN_STOCK,
        isHidden: false,
        receivedAt: {
          lte: longHeldThreshold,
        },
      },
    }),
  ]);

  return (
    <InventoryOverview
      currentUserId={currentUser.id}
      carriers={carriers}
      deviceModels={deviceModels}
      staffMembers={staffMembers.map((staff) => ({
        id: staff.id,
        displayName: staff.displayName,
        roleLabel: getRoleLabel(staff.role),
      }))}
      items={items.map((item) => ({
        id: item.id,
        carrierId: item.carrierId,
        carrierName: item.carrier.name,
        deviceModelId: item.deviceModelId,
        deviceModelName: item.deviceModel.name,
        color: item.color,
        capacity: item.capacity,
        imei: item.imei,
        costAmount: item.costAmount,
        status: item.status,
        receivedAt: item.receivedAt,
        dispatchedAt: item.dispatchedAt,
        assigneeId: item.assignee?.id ?? null,
        assigneeName: item.assignee?.displayName ?? null,
        notes: item.notes,
        isHidden: item.isHidden,
      }))}
      filters={{
        q,
        status,
        carrierId,
        assigneeId,
        visibility,
      }}
      metrics={{
        totalCount,
        availableCount,
        reservedCount,
        soldCount,
        hiddenCount,
        longHeldCount,
      }}
      notice={notice}
    />
  );
}
