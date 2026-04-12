import type { Metadata } from "next";

import { ReceivablesOverview } from "@/components/workspace/receivables-overview";
import type {
  ReceivablesFilters,
  ReceivablesNotice,
} from "@/components/workspace/receivables-types";
import { getCurrentUser } from "@/lib/auth/dal";
import { formatKstDate, parseKstDateInput } from "@/lib/date-utils";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "미수금 관리",
};

function readSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function isReceivablesNotice(value: string): value is ReceivablesNotice {
  return (
    value === "invalid-payment-form" ||
    value === "receivable-not-found" ||
    value === "payment-not-found" ||
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
    saleId?: string | string[];
    status?: string | string[];
    dateFrom?: string | string[];
    dateTo?: string | string[];
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
  const saleId = readSearchParam(rawSearchParams.saleId);
  const statusValue = readSearchParam(rawSearchParams.status) || "all";
  const dateFrom = readSearchParam(rawSearchParams.dateFrom);
  const dateTo = readSearchParam(rawSearchParams.dateTo);
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
                carrier: {
                  name: {
                    contains: q,
                  },
                },
              },
            },
            {
              sale: {
                deviceModel: {
                  name: {
                    contains: q,
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
    ...(status !== "all"
      ? {
          status,
        }
      : {}),
    ...(dateFrom || dateTo
      ? {
          sale: {
            saleDate: {
              ...(dateFrom
                ? {
                    gte: parseKstDateInput(dateFrom, "start"),
                  }
                : {}),
              ...(dateTo
                ? {
                    lte: parseKstDateInput(dateTo, "end"),
                  }
                : {}),
            },
          },
        }
      : {}),
  };

  const [customers, totalCount, outstandingCount, partiallyPaidCount, paidCount, balanceAggregate, records] =
    await Promise.all([
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
      prisma.receivable.findMany({
        where,
        orderBy: [{ balanceAmount: "desc" }, { createdAt: "desc" }],
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
            },
          },
          payments: {
            orderBy: [{ paymentDate: "desc" }, { createdAt: "desc" }],
            include: {
              staff: {
                select: {
                  displayName: true,
                },
              },
            },
          },
        },
      }),
    ]);

  return (
    <ReceivablesOverview
      currentUserName={currentUser.displayName}
      defaultPaymentDate={formatKstDate(new Date())}
      customers={customers}
      filters={{
        q,
        customerId,
        saleId,
        status,
        dateFrom,
        dateTo,
      }}
      metrics={{
        totalCount,
        filteredCount: records.length,
        outstandingCount,
        partiallyPaidCount,
        paidCount,
        balanceAmount: balanceAggregate._sum.balanceAmount ?? 0,
      }}
      notice={notice}
      records={records.map((record) => {
        const paidAmount = record.payments
          .filter((payment) => payment.status === "COMPLETED")
          .reduce((total, payment) => total + payment.amount, 0);

        return {
          id: record.id,
          saleId: record.saleId,
          customerId: record.customerId,
          customerName: record.customer.name,
          customerPhone: record.customer.phone,
          saleDate: record.sale.saleDate,
          saleSummary: `${record.sale.carrier.name} ${record.sale.deviceModel.name}`,
          staffName: record.sale.staff.displayName,
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
            staffName: payment.staff.displayName,
          })),
        };
      })}
    />
  );
}
