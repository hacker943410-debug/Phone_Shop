"use client";

import { useState, type ReactNode } from "react";

import { CustomerUpsertDialog } from "@/components/workspace/customer-upsert-dialog";
import { SalesEntryForm } from "@/components/workspace/sales-entry-form";
import { WorkspaceModalShell } from "@/components/workspace/workspace-modal-shell";
import type {
  SalesAvailableInventoryRecord,
  SalesCarrierRecord,
  SalesCustomerRecord,
  SalesDiscountPolicyRecord,
  SalesSaleProfitPolicyRecord,
  SalesStaffCommissionPolicyRecord,
} from "@/components/workspace/sales-types";
import { primaryButtonClassName } from "@/components/workspace/ui-classnames";
import type { CustomerUpsertActionCustomer } from "@/lib/customer-upsert-action-state";

type LauncherView =
  | "chooser"
  | "existing-sale"
  | "new-customer"
  | "new-sale"
  | null;

interface SalesLauncherProps {
  availableInventory: SalesAvailableInventoryRecord[];
  carriers: SalesCarrierRecord[];
  currentUserId: string;
  currentUserName: string;
  customers: SalesCustomerRecord[];
  defaultSaleDate: string;
  discountPolicies: SalesDiscountPolicyRecord[];
  saleProfitPolicies: SalesSaleProfitPolicyRecord[];
  staffCommissionPolicies: SalesStaffCommissionPolicyRecord[];
}

function ExistingCustomerIllustration() {
  return (
    <svg aria-hidden="true" className="h-20 w-20" fill="none" viewBox="0 0 96 96">
      <rect x="12" y="14" width="72" height="68" rx="18" fill="#EFF6FF" />
      <path
        d="M29 41c0-10.493 8.507-19 19-19s19 8.507 19 19"
        stroke="#2563EB"
        strokeLinecap="round"
        strokeWidth="6"
      />
      <circle cx="48" cy="44" r="12" fill="#BFDBFE" />
      <path
        d="M28 70c5.8-9.333 12.467-14 20-14s14.2 4.667 20 14"
        stroke="#1D4ED8"
        strokeLinecap="round"
        strokeWidth="6"
      />
    </svg>
  );
}

function NewCustomerIllustration() {
  return (
    <svg aria-hidden="true" className="h-20 w-20" fill="none" viewBox="0 0 96 96">
      <rect x="10" y="16" width="76" height="64" rx="18" fill="#ECFDF5" />
      <rect x="28" y="28" width="24" height="6" rx="3" fill="#10B981" />
      <rect x="28" y="42" width="40" height="6" rx="3" fill="#6EE7B7" />
      <rect x="28" y="56" width="32" height="6" rx="3" fill="#A7F3D0" />
      <circle cx="70" cy="32" r="12" fill="#D1FAE5" />
      <path
        d="M70 26v12M64 32h12"
        stroke="#059669"
        strokeLinecap="round"
        strokeWidth="5"
      />
    </svg>
  );
}

function ActionChoiceCard({
  description,
  illustration,
  onClick,
  title,
}: {
  description?: string;
  illustration: ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      className="group flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-[1.6rem] border border-stone-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(245,243,239,0.98)_100%)] px-6 py-6 text-center shadow-[0_24px_50px_-40px_rgba(15,23,42,0.32)] transition duration-200 hover:-translate-y-1 hover:border-amber-200 hover:shadow-[0_28px_60px_-38px_rgba(180,83,9,0.24)]"
      onClick={onClick}
      type="button"
    >
      <div className="rounded-[1.4rem] border border-white/80 bg-white/90 p-4 shadow-[0_18px_36px_-32px_rgba(15,23,42,0.24)]">
        {illustration}
      </div>
      <h4 className="mt-5 text-xl font-semibold tracking-[-0.04em] text-slate-950">
        {title}
      </h4>
      {description ? (
        <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      ) : null}
    </button>
  );
}

function toSalesCustomerRecord(
  customer: CustomerUpsertActionCustomer,
): SalesCustomerRecord {
  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    currentCarrierId: customer.currentCarrierId,
    currentCarrierName: customer.currentCarrierName,
    retentionDisplay: null,
    retentionRemainingDays: null,
    latestSaleDeviceModelId: null,
    latestSaleRatePlanId: null,
    latestSaleAddOnServiceIds: [],
  };
}

export function SalesLauncher({
  availableInventory,
  carriers,
  currentUserId,
  currentUserName,
  customers,
  defaultSaleDate,
  discountPolicies,
  saleProfitPolicies,
  staffCommissionPolicies,
}: SalesLauncherProps) {
  const [view, setView] = useState<LauncherView>(null);
  const [createdCustomers, setCreatedCustomers] = useState<SalesCustomerRecord[]>(
    [],
  );
  const [seedCustomerId, setSeedCustomerId] = useState<string | undefined>(
    undefined,
  );
  const serverCustomerIds = new Set(customers.map((customer) => customer.id));
  const salesCustomers = [
    ...createdCustomers.filter((customer) => !serverCustomerIds.has(customer.id)),
    ...customers,
  ];

  function closeLauncher() {
    setView(null);
    setSeedCustomerId(undefined);
  }

  function openExistingSale() {
    setSeedCustomerId(undefined);
    setView("existing-sale");
  }

  function openNewCustomerDialog() {
    setSeedCustomerId(undefined);
    setView("new-customer");
  }

  function handleCustomerCreated(customer: CustomerUpsertActionCustomer) {
    const nextCustomer = toSalesCustomerRecord(customer);

    setCreatedCustomers((current) => [
      nextCustomer,
      ...current.filter((item) => item.id !== customer.id),
    ]);
    setSeedCustomerId(customer.id);
    setView("new-sale");
  }

  return (
    <>
      <button
        className={`${primaryButtonClassName} h-10 px-4`}
        onClick={() => setView("chooser")}
        type="button"
      >
        판매 등록
      </button>

      {view === "chooser" ? (
        <WorkspaceModalShell
          onClose={closeLauncher}
          subtitle="Launch"
          title="판매 등록 시작"
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <ActionChoiceCard
              illustration={<ExistingCustomerIllustration />}
              onClick={openExistingSale}
              title="기존 고객"
            />
            <ActionChoiceCard
              illustration={<NewCustomerIllustration />}
              onClick={openNewCustomerDialog}
              title="신규 고객"
            />
          </div>
        </WorkspaceModalShell>
      ) : null}

      {view === "existing-sale" ? (
        <WorkspaceModalShell
          onClose={closeLauncher}
          subtitle="Existing Customer"
          title="기존 고객 판매 등록"
        >
          <SalesEntryForm
            availableInventory={availableInventory}
            carriers={carriers}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            customers={salesCustomers}
            defaultSaleDate={defaultSaleDate}
            discountPolicies={discountPolicies}
            saleProfitPolicies={saleProfitPolicies}
            staffCommissionPolicies={staffCommissionPolicies}
          />
        </WorkspaceModalShell>
      ) : null}

      {view === "new-customer" ? (
        <CustomerUpsertDialog
          carriers={carriers}
          onClose={closeLauncher}
          onSuccess={handleCustomerCreated}
          submitLabel="고객 저장 후 판매 등록"
          subtitle="New Customer"
          title="신규 고객 등록"
        />
      ) : null}

      {view === "new-sale" ? (
        <WorkspaceModalShell
          onClose={closeLauncher}
          subtitle="New Customer"
          title="신규 고객 판매 등록"
        >
          <SalesEntryForm
            key={seedCustomerId ?? "new-sale"}
            availableInventory={availableInventory}
            carriers={carriers}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            customers={salesCustomers}
            defaultSaleDate={defaultSaleDate}
            discountPolicies={discountPolicies}
            saleProfitPolicies={saleProfitPolicies}
            staffCommissionPolicies={staffCommissionPolicies}
            initialCustomerId={seedCustomerId}
          />
        </WorkspaceModalShell>
      ) : null}
    </>
  );
}
