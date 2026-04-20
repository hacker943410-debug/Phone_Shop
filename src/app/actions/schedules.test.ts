import { afterEach, describe, expect, it, vi } from "vitest";

import { buildScheduleUpsertActionState } from "@/lib/schedule-upsert-action-state";

const requireCurrentUser = vi.fn();
const revalidatePath = vi.fn();

const customerFindFirst = vi.fn();
const saleFindUnique = vi.fn();
const manualScheduleFindUnique = vi.fn();
const manualScheduleCreate = vi.fn();
const manualScheduleUpdate = vi.fn();
const manualScheduleDelete = vi.fn();

const prisma = {
  customer: {
    findFirst: customerFindFirst,
  },
  sale: {
    findUnique: saleFindUnique,
  },
  manualSchedule: {
    findUnique: manualScheduleFindUnique,
    create: manualScheduleCreate,
    update: manualScheduleUpdate,
    delete: manualScheduleDelete,
  },
};

vi.mock("next/cache", () => ({
  revalidatePath,
}));

vi.mock("@/lib/auth/dal", () => ({
  requireCurrentUser,
}));

vi.mock("@/lib/prisma", () => ({
  prisma,
}));

describe("schedule actions", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("creates a manual schedule with the selected customer", async () => {
    requireCurrentUser.mockResolvedValueOnce({
      id: "user-admin",
      username: "admin",
      displayName: "관리자",
      role: "ADMIN",
      isActive: true,
    });
    customerFindFirst.mockResolvedValueOnce({
      id: "customer-kim",
    });
    manualScheduleCreate.mockResolvedValueOnce({
      id: "schedule-kim",
    });

    const { upsertManualScheduleDialogAction } = await import("@/app/actions/schedules");
    const formData = new FormData();
    formData.set("title", "유지기간 만료 후 연락");
    formData.set("scheduledDate", "2026-04-23");
    formData.set("status", "OPEN");
    formData.set("customerId", "customer-kim");
    formData.set("memo", "보상 정책 안내");
    formData.set("intent", "save");

    const result = await upsertManualScheduleDialogAction(
      buildScheduleUpsertActionState(),
      formData,
    );

    expect(manualScheduleCreate).toHaveBeenCalledWith({
      data: {
        title: "유지기간 만료 후 연락",
        scheduledDate: expect.any(Date),
        status: "OPEN",
        customerId: "customer-kim",
        memo: "보상 정책 안내",
        saleId: null,
        createdById: "user-admin",
      },
      select: {
        id: true,
      },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/schedule");
    expect(result.status).toBe("success");
    expect(result.scheduleId).toBe("schedule-kim");
    expect(result.fields.customerId).toBe("customer-kim");
  });

  it("rejects schedules when the selected customer does not match the linked sale", async () => {
    requireCurrentUser.mockResolvedValueOnce({
      id: "user-admin",
      username: "admin",
      displayName: "관리자",
      role: "ADMIN",
      isActive: true,
    });
    customerFindFirst.mockResolvedValueOnce({
      id: "customer-kim",
    });
    saleFindUnique.mockResolvedValueOnce({
      id: "sale-park",
      customerId: "customer-park",
    });

    const { upsertManualScheduleDialogAction } = await import("@/app/actions/schedules");
    const formData = new FormData();
    formData.set("title", "판매 후 확인");
    formData.set("scheduledDate", "2026-04-24");
    formData.set("status", "OPEN");
    formData.set("customerId", "customer-kim");
    formData.set("saleId", "sale-park");
    formData.set("intent", "save");

    const result = await upsertManualScheduleDialogAction(
      buildScheduleUpsertActionState(),
      formData,
    );

    expect(manualScheduleCreate).not.toHaveBeenCalled();
    expect(result.status).toBe("error");
    expect(result.message).toBe(
      "연결된 판매 이력의 고객과 선택한 고객이 일치하지 않습니다.",
    );
  });

  it("deletes an existing manual schedule", async () => {
    requireCurrentUser.mockResolvedValueOnce({
      id: "user-admin",
      username: "admin",
      displayName: "관리자",
      role: "ADMIN",
      isActive: true,
    });
    manualScheduleFindUnique.mockResolvedValueOnce({
      id: "schedule-kim",
    });
    manualScheduleDelete.mockResolvedValueOnce({});

    const { upsertManualScheduleDialogAction } = await import("@/app/actions/schedules");
    const formData = new FormData();
    formData.set("id", "schedule-kim");
    formData.set("intent", "delete");

    const result = await upsertManualScheduleDialogAction(
      buildScheduleUpsertActionState(),
      formData,
    );

    expect(manualScheduleDelete).toHaveBeenCalledWith({
      where: {
        id: "schedule-kim",
      },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/schedule");
    expect(result.status).toBe("success");
    expect(result.deleted).toBe(true);
  });
});
