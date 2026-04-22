import { afterEach, describe, expect, it, vi } from "vitest";

const requireRole = vi.fn();
const revalidatePath = vi.fn();

const userFindUnique = vi.fn();
const staffCommissionPolicyCreate = vi.fn();
const staffCommissionPolicyUpdate = vi.fn();

const prisma = {
  user: {
    findUnique: userFindUnique,
  },
  staffCommissionPolicy: {
    create: staffCommissionPolicyCreate,
    update: staffCommissionPolicyUpdate,
  },
};

vi.mock("next/cache", () => ({
  revalidatePath,
}));

vi.mock("@/lib/auth/dal", () => ({
  requireRole,
}));

vi.mock("@/lib/prisma", () => ({
  prisma,
}));

describe("staff commission policy actions", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("creates a staff commission policy for a staff account", async () => {
    requireRole.mockResolvedValueOnce(undefined);
    userFindUnique.mockResolvedValueOnce({
      id: "user-staff-kim",
      displayName: "Kim JH",
      username: "kim-jh",
      isActive: true,
      role: "STAFF",
    });
    staffCommissionPolicyCreate.mockResolvedValueOnce({
      id: "commission-kim",
    });

    const { upsertStaffCommissionPolicyAction } = await import("@/app/actions/policies");
    const formData = new FormData();
    formData.set("staffId", "user-staff-kim");
    formData.set("startsAt", "2026-04-22");
    formData.set("endsAt", "2026-05-31");
    formData.set("calculationMethod", "FIXED_AMOUNT");
    formData.set("calculationValue", "50000");
    formData.set("memo", "spring event");

    await upsertStaffCommissionPolicyAction(formData);

    expect(requireRole).toHaveBeenCalledWith("ADMIN");
    expect(userFindUnique).toHaveBeenCalledWith({
      where: {
        id: "user-staff-kim",
      },
      select: {
        id: true,
        displayName: true,
        username: true,
        isActive: true,
        role: true,
      },
    });
    expect(staffCommissionPolicyCreate).toHaveBeenCalledWith({
      data: {
        name: "Kim JH",
        carrierId: null,
        staffId: "user-staff-kim",
        startsAt: expect.any(Date),
        endsAt: expect.any(Date),
        calculationMethod: "FIXED_AMOUNT",
        calculationValue: 50000,
        memo: "spring event",
      },
    });
    expect(revalidatePath.mock.calls.map(([path]) => path)).toEqual([
      "/settings/policies",
      "/sales",
      "/",
      "/reports/summary",
    ]);
  });

  it("does not create a staff commission policy for a non-staff account", async () => {
    requireRole.mockResolvedValueOnce(undefined);
    userFindUnique.mockResolvedValueOnce({
      id: "user-admin",
      displayName: "Admin",
      username: "admin",
      isActive: true,
      role: "ADMIN",
    });

    const { upsertStaffCommissionPolicyAction } = await import("@/app/actions/policies");
    const formData = new FormData();
    formData.set("staffId", "user-admin");
    formData.set("startsAt", "2026-04-22");
    formData.set("endsAt", "2026-05-31");
    formData.set("calculationMethod", "FIXED_AMOUNT");
    formData.set("calculationValue", "50000");

    await upsertStaffCommissionPolicyAction(formData);

    expect(staffCommissionPolicyCreate).not.toHaveBeenCalled();
    expect(staffCommissionPolicyUpdate).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
