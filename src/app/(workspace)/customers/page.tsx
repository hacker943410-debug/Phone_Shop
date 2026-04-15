import type { Metadata } from "next";

import { CustomersOverview } from "@/components/workspace/customers-overview";
import { createPagination, readPageNumber } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "고객 관리",
};

const customersPageSize = 12;

function readSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function isReceivableFilter(value: string): value is "all" | "outstanding" | "clear" {
  return value === "all" || value === "outstanding" || value === "clear";
}

function isNoticeValue(
  value: string,
): value is "duplicate-phone" | "invalid-customer-form" {
  return value === "duplicate-phone" || value === "invalid-customer-form";
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string | string[];
    carrierId?: string | string[];
    receivable?: string | string[];
    customerId?: string | string[];
    page?: string | string[];
    notice?: string | string[];
  }>;
}) {
  const rawSearchParams = await searchParams;
  const q = readSearchParam(rawSearchParams.q);
  const carrierId = readSearchParam(rawSearchParams.carrierId);
  const receivableValue = readSearchParam(rawSearchParams.receivable) || "all";
  const customerId = readSearchParam(rawSearchParams.customerId);
  const requestedPage = readPageNumber(rawSearchParams.page);
  const noticeValue = readSearchParam(rawSearchParams.notice);
  const normalizedQuery = q.replace(/\D/g, "");

  const receivable = isReceivableFilter(receivableValue) ? receivableValue : "all";
  const notice = isNoticeValue(noticeValue) ? noticeValue : null;

  const where = {
    isHidden: false,
    ...(q
      ? {
          OR: [
            {
              name: {
                contains: q,
              },
            },
            {
              phone: {
                contains: q,
              },
            },
            ...(normalizedQuery
              ? [
                  {
                    normalizedPhone: {
                      contains: normalizedQuery,
                    },
                  },
                ]
              : []),
          ],
        }
      : {}),
    ...(carrierId
      ? {
          currentCarrierId: carrierId,
        }
      : {}),
    ...(receivable === "outstanding"
      ? {
          receivables: {
            some: {
              balanceAmount: {
                gt: 0,
              },
            },
          },
        }
      : receivable === "clear"
        ? {
            receivables: {
              none: {
                balanceAmount: {
                  gt: 0,
                },
              },
            },
          }
        : {}),
  };

  const [
    carriers,
    filteredCount,
    totalCount,
    outstandingCustomers,
    receivableAggregate,
    repeatCustomerGroups,
  ] =
    await Promise.all([
      prisma.carrier.findMany({
        orderBy: [{ isActive: "desc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          isActive: true,
        },
      }),
      prisma.customer.count({
        where,
      }),
      prisma.customer.count({
        where: {
          isHidden: false,
        },
      }),
      prisma.customer.count({
        where: {
          isHidden: false,
          receivables: {
            some: {
              balanceAmount: {
                gt: 0,
              },
            },
          },
        },
      }),
      prisma.receivable.aggregate({
        _sum: {
          balanceAmount: true,
        },
        where: {
          customer: {
            isHidden: false,
          },
          balanceAmount: {
            gt: 0,
          },
        },
      }),
      prisma.sale.groupBy({
        by: ["customerId"],
        where: {
          customer: where,
        },
        _count: {
          _all: true,
        },
      }),
    ]);

  const pagination = createPagination(
    requestedPage,
    filteredCount,
    customersPageSize,
  );

  const customers = await prisma.customer.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
    skip: (pagination.page - 1) * customersPageSize,
    take: customersPageSize,
    include: {
      currentCarrier: {
        select: {
          name: true,
        },
      },
      _count: {
        select: {
          sales: true,
        },
      },
      receivables: {
        select: {
          balanceAmount: true,
        },
      },
      sales: {
        take: 1,
        orderBy: {
          saleDate: "desc",
        },
        select: {
          saleDate: true,
        },
      },
    },
  });

  const selectedCustomerId = customers.some((customer) => customer.id === customerId)
    ? customerId
    : (customers[0]?.id ?? null);

  const selectedCustomer = selectedCustomerId
    ? await prisma.customer.findUnique({
        where: {
          id: selectedCustomerId,
          isHidden: false,
        },
        include: {
          currentCarrier: {
            select: {
              name: true,
            },
          },
          sales: {
            orderBy: {
              saleDate: "desc",
            },
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
              ratePlan: {
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
          receivables: {
            orderBy: {
              createdAt: "desc",
            },
            include: {
              sale: {
                select: {
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
                },
              },
            },
          },
        },
      })
    : null;

  const repeatCustomerCount = repeatCustomerGroups.filter(
    (customerGroup) => customerGroup._count._all > 1,
  ).length;

  return (
    <CustomersOverview
      carriers={carriers}
      customers={customers.map((customer) => ({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        currentCarrierId: customer.currentCarrierId,
        currentCarrierName: customer.currentCarrier?.name ?? null,
        salesCount: customer._count.sales,
        receivableBalance: customer.receivables.reduce(
          (total, receivable) => total + receivable.balanceAmount,
          0,
        ),
        lastVisitAt: customer.sales[0]?.saleDate ?? null,
      }))}
      selectedCustomer={
        selectedCustomer
          ? {
              id: selectedCustomer.id,
              name: selectedCustomer.name,
              phone: selectedCustomer.phone,
              currentCarrierId: selectedCustomer.currentCarrierId,
              currentCarrierName: selectedCustomer.currentCarrier?.name ?? null,
              birthDate: selectedCustomer.birthDate,
              address: selectedCustomer.address,
              memo: selectedCustomer.memo,
              createdAt: selectedCustomer.createdAt,
              sales: selectedCustomer.sales.map((sale) => ({
                id: sale.id,
                saleDate: sale.saleDate,
                carrierName: sale.carrier.name,
                deviceModelName: sale.deviceModel.name,
                ratePlanName: sale.ratePlan?.name ?? null,
                finalSalePrice: sale.finalSalePrice,
                receivableAmount: sale.receivableAmount,
                staffName: sale.staff.displayName,
              })),
              receivables: selectedCustomer.receivables.map((receivable) => ({
                id: receivable.id,
                createdAt: receivable.createdAt,
                originalAmount: receivable.originalAmount,
                balanceAmount: receivable.balanceAmount,
                status: receivable.status,
                memo: receivable.memo,
                saleDate: receivable.sale.saleDate,
                saleSummary: `${receivable.sale.carrier.name} ${receivable.sale.deviceModel.name}`,
              })),
            }
          : null
      }
      filters={{
        q,
        carrierId,
        receivable,
      }}
      pagination={pagination}
      metrics={{
        totalCount,
        filteredCount,
        outstandingCount: outstandingCustomers,
        repeatCustomerCount,
        receivableBalance: receivableAggregate._sum.balanceAmount ?? 0,
      }}
      notice={notice}
    />
  );
}
