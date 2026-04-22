"use client";

import { useState } from "react";

import { SalesEntryForm } from "@/components/workspace/sales-entry-form";
import { WorkspaceModalShell } from "@/components/workspace/workspace-modal-shell";
import type {
  SalesAvailableInventoryRecord,
  SalesAgencyRecord,
  SalesCarrierRecord,
  SalesCustomerRecord,
  SalesDiscountPolicyRecord,
  SalesSaleProfitPolicyRecord,
  SalesStaffCommissionPolicyRecord,
} from "@/components/workspace/sales-types";
import { primaryButtonClassName } from "@/components/workspace/ui-classnames";

interface SalesLauncherProps {
  availableInventory: SalesAvailableInventoryRecord[];
  carriers: SalesCarrierRecord[];
  currentUserId: string;
  currentUserName: string;
  customers: SalesCustomerRecord[];
  defaultSaleDate: string;
  discountPolicies: SalesDiscountPolicyRecord[];
  salesAgencies: SalesAgencyRecord[];
  saleProfitPolicies: SalesSaleProfitPolicyRecord[];
  staffCommissionPolicies: SalesStaffCommissionPolicyRecord[];
}

export function SalesLauncher({
  availableInventory,
  carriers,
  currentUserId,
  currentUserName,
  customers,
  defaultSaleDate,
  discountPolicies,
  salesAgencies,
  saleProfitPolicies,
  staffCommissionPolicies,
}: SalesLauncherProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className={`${primaryButtonClassName} h-10 px-4`}
        onClick={() => setIsOpen(true)}
        type="button"
      >
        판매 등록
      </button>

      {isOpen ? (
        <WorkspaceModalShell
          onClose={() => setIsOpen(false)}
          subtitle="Sales"
          title="판매 등록"
        >
          <SalesEntryForm
            availableInventory={availableInventory}
            carriers={carriers}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            customers={customers}
            defaultSaleDate={defaultSaleDate}
            discountPolicies={discountPolicies}
            salesAgencies={salesAgencies}
            saleProfitPolicies={saleProfitPolicies}
            staffCommissionPolicies={staffCommissionPolicies}
          />
        </WorkspaceModalShell>
      ) : null}
    </>
  );
}
