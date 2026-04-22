import { afterEach, describe, expect, it, vi } from "vitest";

const requireRole = vi.fn();
const revalidatePath = vi.fn();
const redirect = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});
const hashPassword = vi.fn((password: string) => `hashed:${password}`);

const userFindUnique = vi.fn();
const userCreate = vi.fn();

const prisma = {
  user: {
    findUnique: userFindUnique,
    create: userCreate,
  },
};

vi.mock("next/cache", () => ({
  revalidatePath,
}));

vi.mock("next/navigation", () => ({
  redirect,
}));

vi.mock("@/lib/auth/dal", () => ({
  requireRole,
}));

vi.mock("@/lib/auth/password", () => ({
  hashPassword,
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

describe("base info staff actions", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("creates a staff account and revalidates dependent views", async () => {
    requireRole.mockResolvedValueOnce(undefined);
    userFindUnique.mockResolvedValueOnce(null);
    userCreate.mockResolvedValueOnce({
      id: "user-kim",
    });

    const [{ createStaffDialogAction }, { buildStaffDialogActionState }] = await Promise.all([
      import("@/app/actions/base-info"),
      import("@/lib/staff-dialog-action-state"),
    ]);
    const formData = new FormData();
    formData.set("displayName", "Kim JH");
    formData.set("username", " Kim.JH ");
    formData.set("password", "temp1234");

    const result = await createStaffDialogAction(buildStaffDialogActionState(), formData);

    expect(requireRole).toHaveBeenCalledWith("ADMIN");
    expect(userFindUnique).toHaveBeenCalledWith({
      where: {
        username: "kim.jh",
      },
      select: {
        id: true,
      },
    });
    expect(hashPassword).toHaveBeenCalledWith("temp1234");
    expect(userCreate).toHaveBeenCalledWith({
      data: {
        username: "kim.jh",
        displayName: "Kim JH",
        passwordHash: "hashed:temp1234",
        role: "STAFF",
        isActive: true,
      },
    });
    expect(result).toEqual({
      status: "success",
      message: "직원을 등록했습니다.",
      fields: {
        displayName: "",
        username: "",
        password: "",
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

  it("returns an error when the username is already in use", async () => {
    requireRole.mockResolvedValueOnce(undefined);
    userFindUnique.mockResolvedValueOnce({
      id: "user-existing",
    });

    const [{ createStaffDialogAction }, { buildStaffDialogActionState }] = await Promise.all([
      import("@/app/actions/base-info"),
      import("@/lib/staff-dialog-action-state"),
    ]);
    const formData = new FormData();
    formData.set("displayName", "Kim JH");
    formData.set("username", "kim-jh");
    formData.set("password", "temp1234");

    const result = await createStaffDialogAction(buildStaffDialogActionState(), formData);

    expect(userCreate).not.toHaveBeenCalled();
    expect(result).toEqual({
      status: "error",
      message: "이미 사용 중인 로그인 아이디입니다. 다른 아이디로 다시 등록해 주세요.",
      fields: {
        displayName: "Kim JH",
        username: "kim-jh",
        password: "temp1234",
      },
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
