import type { Metadata } from "next";

import { getSalesCommonPageData } from "@/app/(workspace)/sales/sales-page-data";
import { SalesEntryForm } from "@/components/workspace/sales-entry-form";
import { SalesSupportPanel } from "@/components/workspace/sales-support-panel";
import {
  ActionChip,
  PageIntro,
  Panel,
} from "@/components/workspace/workspace-primitives";
import { secondaryButtonClassName } from "@/components/workspace/ui-classnames";

export const metadata: Metadata = {
  title: "판매 등록",
};

function readSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function NewSalePage({
  searchParams,
}: {
  searchParams: Promise<{
    customerId?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const pageData = await getSalesCommonPageData();
  const customerId = readSearchParam(params.customerId);

  if (!pageData) {
    return null;
  }

  return (
    <div className="space-y-5 p-4 sm:p-5 lg:p-6">
      <PageIntro
        eyebrow="Sales"
        title="판매 등록"
        actions={
          <>
            <ActionChip label={`담당 ${pageData.currentUserName}`} tone="dark" />
            <a
              href="/sales"
              className={`${secondaryButtonClassName} h-10 px-4`}
            >
              판매 이력으로 돌아가기
            </a>
          </>
        }
      />

      <section className="space-y-6">
        <Panel
          title="등록 입력"
        >
          <SalesEntryForm
            currentUserName={pageData.currentUserName}
            defaultSaleDate={pageData.defaultSaleDate}
            customers={pageData.customers}
            carriers={pageData.carriers}
            availableInventory={pageData.availableInventory}
            discountPolicies={pageData.discountPolicies}
            rebatePolicies={pageData.rebatePolicies}
            saleProfitPolicies={pageData.saleProfitPolicies}
            initialCustomerId={customerId}
          />
        </Panel>

        <SalesSupportPanel
          carriers={pageData.carriers}
          rebatePolicies={pageData.rebatePolicies}
          saleProfitPolicies={pageData.saleProfitPolicies}
          discountPolicies={pageData.discountPolicies}
          availableInventory={pageData.availableInventory}
        />
      </section>
    </div>
  );
}
