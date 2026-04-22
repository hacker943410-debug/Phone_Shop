import type { Metadata } from "next";

import { ReceivablesOverview } from "@/components/workspace/receivables-overview";
import type {
  ReceivablesFilters,
  ReceivablesNotice,
} from "@/components/workspace/receivables-types";
import { getCurrentUser } from "@/lib/auth/dal";
import { formatKstDate } from "@/lib/date-utils";
import { createPagination, readPageNumber } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "미수금 관리",
};

const receivablesPageSize = 8;

function readSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function isReceivablesNotice(value: string): value is ReceivablesNotice {
  return (
    value === "invalid-payment-form" ||
    value === "invalid-manual-receivable-form" ||
    value === "manual-receivable-customer-not-found" ||
    value === "receivable-not-found" ||
    value === "payment-not-found" ||
    value === "payment-cancel-reason-required" ||
    value === "payment-over-balance"
  );
}

function isReceivableStatusFilter(
  value: string,
): value is ReceivablesFilters["status"] {
  return (
    value === "all" ||
    value === "UNPAID" ||
    value === "PARTIALLY_PAID" ||
    value === "PAID"
  );
}

export default async function ReceivablesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string | string[];
    customerId?: string | string[];
    carrierId?: string | string[];
    saleId?: string | string[];
    status?: string | string[];
    page?: string | string[];
    notice?: string | string[];
  }>;
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return null;
  }

  const rawSearchParams = await searchParams;
  const q = readSearchParam(rawSearchParams.q);
  const customerId = readSearchParam(rawSearchParams.customerId);
  const carrierId = readSearchParam(rawSearchParams.carrierId);
  const saleId = readSearchParam(rawSearchParams.saleId);
  const statusValue = readSearchParam(rawSearchParams.status) || "all";
  const requestedPage = readPageNumber(rawSearchParams.page);
  const noticeValue = readSearchParam(rawSearchParams.notice);
  const normalizedQuery = q.replace(/\D/g, "");
  const status = isReceivableStatusFilter(statusValue) ? statusValue : "all";
  const notice = isReceivablesNotice(noticeValue) ? noticeValue : null;

  const where = {
    ...(q
      ? {
          OR: [
            {
              customer: {
                name: {
                  contains: q,
                },
              },
            },
            {
              customer: {
                phone: {
                  contains: q,
                },
              },
            },
            ...(normalizedQuery
              ? [
                  {
                    customer: {
                      normalizedPhone: {
                        contains: normalizedQuery,
                      },
                    },
                  },
                ]
              : []),
            {
              sale: {
                is: {
                  carrier: {
                    name: {
                      contains: q,
                    },
                  },
                },
              },
            },
            {
              sale: {
                is: {
                  deviceModel: {
                    name: {
                      contains: q,
                    },
                  },
                },
              },
            },
          ],
        }
      : {}),
    ...(customerId
      ? {
          customerId,
        }
      : {}),
    ...(saleId
      ? {
          saleId,
        }
      : {}),
    ...(carrierId
      ? {
          sale: {
            is: {
              carrierId,
            },
          },
        }
      : {}),
    ...(status !== "all"
      ? {
          status,
        }
      : {}),
  };

  const [
    customers,
    carriers,
    filteredCount,
    totalCount,
    outstandingCount,
    partiallyPaidCount,
    paidCount,
    balanceAggregate,
  ] = await Promise.all([
    prisma.customer.findMany({
      where: {
        isHidden: false,
      },
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        phone: true,
      },
    }),
    prisma.carrier.findMany({
      where: {
        isActive: true,
      },
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        name: true,
      },
    }),
    prisma.receivable.count({
      where,
    }),
    prisma.receivable.count(),
    prisma.receivable.count({
      where: {
        balanceAmount: {
          gt: 0,
        },
      },
    }),
    prisma.receivable.count({
      where: {
        status: "PARTIALLY_PAID",
      },
    }),
    prisma.receivable.count({
      where: {
        status: "PAID",
      },
    }),
    prisma.receivable.aggregate({
      _sum: {
        balanceAmount: true,
      },
      where: {
        balanceAmount: {
          gt: 0,
        },
      },
    }),
  ]);

  const pagination = createPagination(
    requestedPage,
    filteredCount,
    receivablesPageSize,
  );

  const records = await prisma.receivable.findMany({
    where,
    orderBy: [{ balanceAmount: "desc" }, { createdAt: "desc" }],
    skip: (pagination.page - 1) * receivablesPageSize,
    take: receivablesPageSize,
    include: {
      customer: {
        select: {
          name: true,
          phone: true,
        },
      },
      sale: {
        select: {
          id: true,
          saleDate: true,
          carrierId: true,
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
          staff: {
            select: {
              displayName: true,
            },
          },
          store: {
            select: {
              name: true,
            },
          },
        },
      },
      payments: {
        orderBy: [{ paymentDate: "desc" }, { createdAt: "desc" }],
        include: {
          canceledBy: {
            select: {
              displayName: true,
            },
          },
          staff: {
            select: {
              displayName: true,
            },
          },
        },
      },
    },
  });

  return (
    <ReceivablesOverview
      carriers={carriers}
      currentUserName={currentUser.displayName}
      customers={customers}
      defaultPaymentDate={formatKstDate(new Date())}
      filters={{
        q,
        customerId,
        carrierId,
        saleId,
        status,
      }}
      metrics={{
        totalCount,
        filteredCount,
        outstandingCount,
        partiallyPaidCount,
        paidCount,
        balanceAmount: balanceAggregate._sum.balanceAmount ?? 0,
      }}
      notice={notice}
      pagination={pagination}
      records={records.map((record) => {
        const paidAmount = record.payments
          .filter((payment) => payment.status === "COMPLETED")
          .reduce((total, payment) => total + payment.amount, 0);

        return {
          id: record.id,
          saleId: record.saleId,
          customerId: record.customerId,
          carrierId: record.sale?.carrierId ?? null,
          customerName: record.customer.name,
          customerPhone: record.customer.phone,
          referenceDate: record.sale?.saleDate ?? record.createdAt,
          carrierName: record.sale?.carrier.name ?? "수동 등록",
          deviceModelName: record.sale?.deviceModel.name ?? "미수금",
          saleSummary: record.sale
            ? `${record.sale.carrier.name} ${record.sale.deviceModel.name}`
            : "수동 등록 미수금",
          storeName: record.sale?.store?.name ?? null,
          staffName: record.sale?.staff.displayName ?? "수동 등록",
          isManualEntry: record.sale === null,
          originalAmount: record.originalAmount,
          paidAmount,
          balanceAmount: record.balanceAmount,
          status: record.status,
          memo: record.memo,
          createdAt: record.createdAt,
          payments: record.payments.map((payment) => ({
            id: payment.id,
            paymentDate: payment.paymentDate,
            amount: payment.amount,
            method: payment.method,
            status: payment.status,
            memo: payment.memo,
            createdAt: payment.createdAt,
            canceledAt: payment.canceledAt,
            cancellationReason: payment.cancellationReason,
            canceledByName: payment.canceledBy?.displayName ?? null,
            staffName: payment.staff.displayName,
          })),
        };
      })}
    />
  );
}
