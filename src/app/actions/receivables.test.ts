import { afterEach, describe, expect, it, vi } from "vitest";

const requireCurrentUser = vi.fn();
const revalidatePath = vi.fn();
const redirect = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});

const customerFindFirst = vi.fn();
const paymentFindUnique = vi.fn();
const paymentUpdate = vi.fn();
const receivableCreate = vi.fn();
const receivableFindUnique = vi.fn();
const receivableUpdate = vi.fn();
const storeFindFirst = vi.fn();

const prisma = {
  customer: {
    findFirst: customerFindFirst,
  },
  receivable: {
    create: receivableCreate,
  },
  store: {
    findFirst: storeFindFirst,
  },
  $transaction: vi.fn(
    async (
      callback: (tx: {
        payment: {
          findUnique: typeof paymentFindUnique;
          update: typeof paymentUpdate;
        };
        receivable: {
          findUnique: typeof receivableFindUnique;
          update: typeof receivableUpdate;
        };
      }) => Promise<void>,
    ) =>
      callback({
        payment: {
          findUnique: paymentFindUnique,
          update: paymentUpdate,
        },
        receivable: {
          findUnique: receivableFindUnique,
          update: receivableUpdate,
        },
      }),
  ),
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

describe("receivables actions", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("creates a manual receivable for an existing customer", async () => {
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
    receivableCreate.mockResolvedValueOnce({
      id: "manual-receivable-kim",
    });

    const { createManualReceivableAction } = await import("@/app/actions/receivables");
    const formData = new FormData();
    formData.set("customerId", "customer-kim");
    formData.set("amount", "350,000");

    await createManualReceivableAction(formData);

    expect(customerFindFirst).toHaveBeenCalledWith({
      where: {
        id: "customer-kim",
        isHidden: false,
      },
      select: {
        id: true,
      },
    });
    expect(receivableCreate).toHaveBeenCalledWith({
      data: {
        saleId: null,
        customerId: "customer-kim",
        status: "UNPAID",
        originalAmount: 350000,
        balanceAmount: 350000,
        memo: null,
      },
    });
    expect(revalidatePath).toHaveBeenCalledTimes(4);
    expect(revalidatePath).toHaveBeenCalledWith("/receivables");
    expect(revalidatePath).toHaveBeenCalledWith("/customers");
    expect(revalidatePath).toHaveBeenCalledWith("/sales");
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });

  it("requires a cancellation reason before canceling a payment", async () => {
    requireCurrentUser.mockResolvedValueOnce({
      id: "user-admin",
      username: "admin",
      displayName: "관리자",
      role: "ADMIN",
      isActive: true,
    });

    const { cancelPaymentAction } = await import("@/app/actions/receivables");
    const formData = new FormData();
    formData.set("paymentId", "payment-kim-1");

    await expect(cancelPaymentAction(formData)).rejects.toThrow(
      "REDIRECT:/receivables?notice=payment-cancel-reason-required",
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("stores cancellation audit fields and recalculates receivable status", async () => {
    requireCurrentUser.mockResolvedValueOnce({
      id: "user-admin",
      username: "admin",
      displayName: "관리자",
      role: "ADMIN",
      isActive: true,
    });
    paymentFindUnique.mockResolvedValueOnce({
      id: "payment-kim-1",
      receivableId: "receivable-sale-kim",
      status: "COMPLETED",
    });
    paymentUpdate.mockResolvedValueOnce({});
    receivableFindUnique.mockResolvedValueOnce({
      id: "receivable-sale-kim",
      originalAmount: 300000,
      payments: [],
    });
    receivableUpdate.mockResolvedValueOnce({});

    const { cancelPaymentAction } = await import("@/app/actions/receivables");
    const formData = new FormData();
    formData.set("paymentId", "payment-kim-1");
    formData.set("cancellationReason", "중복 입력 정정");

    await cancelPaymentAction(formData);

    expect(paymentUpdate).toHaveBeenCalledWith({
      where: {
        id: "payment-kim-1",
      },
      data: {
        status: "CANCELED",
        canceledAt: expect.any(Date),
        canceledById: "user-admin",
        cancellationReason: "중복 입력 정정",
      },
    });
    expect(receivableUpdate).toHaveBeenCalledWith({
      where: {
        id: "receivable-sale-kim",
      },
      data: {
        status: "UNPAID",
        balanceAmount: 300000,
        closedAt: null,
      },
    });
    expect(revalidatePath).toHaveBeenCalledTimes(4);
    expect(revalidatePath).toHaveBeenCalledWith("/receivables");
    expect(revalidatePath).toHaveBeenCalledWith("/customers");
    expect(revalidatePath).toHaveBeenCalledWith("/sales");
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });
});
