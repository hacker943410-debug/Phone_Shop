import { afterEach, describe, expect, it, vi } from "vitest";

const requireRole = vi.fn();
const revalidatePath = vi.fn();

const inventoryColorOptionFindUnique = vi.fn();
const inventoryColorOptionUpdate = vi.fn();
const inventoryColorOptionCreate = vi.fn();
const inventoryItemUpdateMany = vi.fn();

const prisma = {
  inventoryColorOption: {
    findUnique: inventoryColorOptionFindUnique,
    update: inventoryColorOptionUpdate,
    create: inventoryColorOptionCreate,
  },
  inventoryItem: {
    updateMany: inventoryItemUpdateMany,
  },
  $transaction: vi.fn(async (callback: (tx: typeof prisma) => Promise<void>) =>
    callback(prisma),
  ),
};

vi.mock("next/cache", () => ({
  revalidatePath,
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@/lib/auth/dal", () => ({
  requireRole,
}));

vi.mock("@/lib/auth/password", () => ({
  hashPassword: vi.fn(),
}));

vi.mock("@/lib/backup-storage", () => ({
  createDatabaseBackup: vi.fn(),
  readBackupSettings: vi.fn(),
  restoreDatabaseBackup: vi.fn(),
  saveBackupSettings: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma,
}));

describe("base info inventory color actions", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renames a color option and syncs existing inventory color values", async () => {
    requireRole.mockResolvedValueOnce(undefined);
    inventoryColorOptionFindUnique.mockResolvedValueOnce({
      name: "Blue",
    });

    const { upsertInventoryColorOptionAction } = await import("@/app/actions/base-info");
    const formData = new FormData();
    formData.set("id", "color-blue");
    formData.set("name", "Sky Blue");

    await upsertInventoryColorOptionAction(formData);

    expect(requireRole).toHaveBeenCalledWith("ADMIN");
    expect(inventoryColorOptionFindUnique).toHaveBeenCalledWith({
      where: { id: "color-blue" },
      select: { name: true },
    });
    expect(inventoryColorOptionUpdate).toHaveBeenCalledWith({
      where: { id: "color-blue" },
      data: { name: "Sky Blue" },
    });
    expect(inventoryItemUpdateMany).toHaveBeenCalledWith({
      where: { color: "Blue" },
      data: { color: "Sky Blue" },
    });
    expect(revalidatePath.mock.calls.map(([path]) => path)).toEqual([
      "/settings/base",
      "/staffs",
      "/settings/policies",
      "/sales",
      "/sales/new",
      "/inventory",
      "/customers",
      "/receivables",
      "/reports/summary",
      "/",
    ]);
  });
});
