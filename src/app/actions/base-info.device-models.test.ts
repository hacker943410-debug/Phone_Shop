import { afterEach, describe, expect, it, vi } from "vitest";

const requireRole = vi.fn();
const revalidatePath = vi.fn();

const deviceModelCreate = vi.fn();
const deviceModelUpdate = vi.fn();

const prisma = {
  deviceModel: {
    create: deviceModelCreate,
    update: deviceModelUpdate,
  },
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

describe("base info device model actions", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("creates a device model with manufacturer mapping", async () => {
    requireRole.mockResolvedValueOnce(undefined);

    const { upsertDeviceModelAction } = await import("@/app/actions/base-info");
    const formData = new FormData();
    formData.set("manufacturer", "Samsung");
    formData.set("name", "Galaxy S25 Ultra");

    await upsertDeviceModelAction(formData);

    expect(requireRole).toHaveBeenCalledWith("ADMIN");
    expect(deviceModelCreate).toHaveBeenCalledWith({
      data: {
        manufacturer: "Samsung",
        name: "Galaxy S25 Ultra",
        isActive: true,
      },
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

  it("toggles a device model active state", async () => {
    requireRole.mockResolvedValueOnce(undefined);

    const { toggleDeviceModelActiveAction } = await import("@/app/actions/base-info");
    const formData = new FormData();
    formData.set("id", "device-model-s25");
    formData.set("nextActive", "false");

    await toggleDeviceModelActiveAction(formData);

    expect(requireRole).toHaveBeenCalledWith("ADMIN");
    expect(deviceModelUpdate).toHaveBeenCalledWith({
      where: { id: "device-model-s25" },
      data: { isActive: false },
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
