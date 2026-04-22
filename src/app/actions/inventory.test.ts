import { afterEach, describe, expect, it, vi } from "vitest";

const requireCurrentUser = vi.fn();
const revalidatePath = vi.fn();
const redirect = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});
const inventoryItemFindFirst = vi.fn();
const inventoryItemCreate = vi.fn();

const prisma = {
  store: {
    findFirst: vi.fn(),
  },
  inventoryItem: {
    findFirst: inventoryItemFindFirst,
    findUnique: vi.fn(),
    create: inventoryItemCreate,
    update: vi.fn(),
  },
};

vi.mock("next/cache", () => ({
  revalidatePath,
}));

vi.mock("next/navigation", () => ({
  redirect,
}));

vi.mock("@/lib/auth/dal", () => ({
  requireCurrentUser,
}));

vi.mock("@/lib/prisma", () => ({
  prisma,
}));

describe("inventory actions", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("normalizes model number and formatted cost amount on create", async () => {
    requireCurrentUser.mockResolvedValueOnce({
      id: "user-admin",
    });
    inventoryItemFindFirst.mockResolvedValueOnce(null);
    inventoryItemCreate.mockResolvedValueOnce({
      id: "inventory-001",
    });

    const { upsertInventoryItemAction } = await import("@/app/actions/inventory");
    const formData = new FormData();
    formData.set("storeId", "store-main");
    formData.set("carrierId", "carrier-skt");
    formData.set("deviceModelId", "device-galaxy-s25");
    formData.set("color", "Titan Gray");
    formData.set("capacity", "256GB");
    formData.set("serialNumber", "sn-s25-003");
    formData.set("modelNumber", "sm009203912309");
    formData.set("costAmount", "912,000");
    formData.set("status", "IN_STOCK");
    formData.set("receivedAt", "2026-04-22");

    await upsertInventoryItemAction(formData);

    expect(requireCurrentUser).toHaveBeenCalled();
    expect(inventoryItemFindFirst).toHaveBeenCalledWith({
      where: {
        serialNumber: "SN-S25-003",
      },
      select: {
        id: true,
      },
    });
    expect(inventoryItemCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        storeId: "store-main",
        carrierId: "carrier-skt",
        deviceModelId: "device-galaxy-s25",
        color: "Titan Gray",
        capacity: "256GB",
        serialNumber: "SN-S25-003",
        modelNumber: "SM-009203912309",
        costAmount: 912000,
        status: "IN_STOCK",
        assigneeId: null,
        notes: null,
        dispatchedAt: null,
      }),
    });
    expect(revalidatePath.mock.calls.map(([path]) => path)).toEqual([
      "/inventory",
      "/sales",
    ]);
  });
});
