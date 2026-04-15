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

export default async function NewSalePage() {
  const pageData = await getSalesCommonPageData();

  if (!pageData) {
    return null;
  }

  return (
    <div className="space-y-5 p-4 sm:p-5 lg:p-6">
      <PageIntro
        eyebrow="Sales"
        title="신규 판매 등록을 전용 작업 화면으로 분리했습니다."
        description="목록 조회와 등록 입력을 분리해 판매 이력 검색 중 값을 잘못 바꾸는 흐름을 줄이고, 정책 계산과 재고 검증에 집중할 수 있게 구성했습니다."
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

      <section className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
        <Panel
          title="판매 등록"
          description="고객, 재고, 정책 매칭을 확인하면서 판매를 등록합니다. 미수금이 있으면 receivable도 함께 생성됩니다."
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
