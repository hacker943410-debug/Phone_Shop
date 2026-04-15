import type { Metadata } from "next";

import { getSalesOverviewPageData } from "@/app/(workspace)/sales/sales-page-data";
import { SalesOverview } from "@/components/workspace/sales-overview";

export const metadata: Metadata = {
  title: "판매 관리",
};

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string | string[];
    carrierId?: string | string[];
    storeId?: string | string[];
    status?: string | string[];
    dateFrom?: string | string[];
    dateTo?: string | string[];
    page?: string | string[];
    notice?: string | string[];
  }>;
}) {
  const pageData = await getSalesOverviewPageData(await searchParams);

  if (!pageData) {
    return null;
  }

  return <SalesOverview {...pageData} />;
}
