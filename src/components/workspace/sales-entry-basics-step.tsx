"use client";

import {
  useDeferredValue,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

import { EmptyState } from "@/components/workspace/admin-form-controls";
import {
  CompactSelectControl,
  DateControl,
} from "@/components/workspace/form-client-controls";
import { SelectionStateControl } from "@/components/workspace/selection-state-controls";
import type {
  SalesAvailableInventoryRecord,
  SalesCarrierRecord,
  SalesCustomerRecord,
} from "@/components/workspace/sales-types";
import {
  formControlClassName,
  joinClassNames,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/workspace/ui-classnames";
import { formatKstDate } from "@/lib/date-utils";
import { formatWon } from "@/lib/formatters";

const surfaceClassName =
  "rounded-xl border border-stone-200 bg-stone-50 p-4 shadow-[0_1px_3px_rgba(15,23,42,0.05),0_1px_2px_rgba(15,23,42,0.08)]";
const summaryCardClassName =
  "rounded-xl border border-white/80 bg-white px-4 py-3 shadow-[0_12px_24px_-24px_rgba(15,23,42,0.3)]";
const tableWrapperClassName =
  "overflow-x-auto rounded-[1rem] border border-stone-200 bg-white";
const tableClassName = "min-w-full table-fixed text-left text-sm";
const headerCellClassName =
  "px-3 py-3 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500";
const cellClassName = "px-3 py-3 align-top text-slate-700";
const fieldLabelClassName = "grid gap-2 text-sm font-medium text-slate-700";
const searchInputClassName = joinClassNames(
  formControlClassName,
  "h-11 min-h-11 rounded-[1rem] px-3 py-2 text-sm",
);
const inlineButtonClassName =
  `${secondaryButtonClassName} h-8 min-w-[4.5rem] whitespace-nowrap px-3 text-[0.72rem]`;
const applyButtonClassName =
  `${primaryButtonClassName} h-8 min-w-[4.5rem] whitespace-nowrap px-3 text-[0.72rem]`;
const detailIconButtonClassName =
  `${secondaryButtonClassName} h-8 w-8 rounded-full p-0`;
const panelModeButtonClassName =
  "inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-amber-300 bg-[linear-gradient(180deg,rgba(251,191,36,1)_0%,rgba(245,158,11,1)_100%)] text-stone-950 shadow-[0_18px_28px_-22px_rgba(180,83,9,0.46)] transition-[transform,box-shadow,border-color,background-color,color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-px hover:scale-[1.03] hover:border-amber-200 hover:bg-[linear-gradient(180deg,rgba(252,211,77,1)_0%,rgba(251,146,60,1)_100%)] hover:shadow-[0_22px_32px_-22px_rgba(180,83,9,0.52)] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-100";
const selectedRowClassName = "bg-emerald-50/75";
const fixedTableWrapperClassName =
  "overflow-hidden rounded-[1rem] border border-stone-200 bg-white";
const paneWrapperBaseClassName =
  "min-w-0 overflow-hidden transition-[max-height,opacity,transform,filter] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[max-height,opacity,transform]";

type StepLayoutMode = "balanced" | "customer-only" | "selection-only";

interface SalesEntryBasicsStepProps {
  currentUserName: string;
  saleDate: string;
  setSaleDate: Dispatch<SetStateAction<string>>;
  customers: SalesCustomerRecord[];
  customerId: string;
  setCustomerId: (customerId: string) => void;
  selectedCustomer: SalesCustomerRecord | null;
  availableInventory: SalesAvailableInventoryRecord[];
  inventoryItemId: string;
  setInventoryItemId: Dispatch<SetStateAction<string>>;
  selectedInventory: SalesAvailableInventoryRecord | null;
  availableRatePlans: SalesCarrierRecord["ratePlans"];
  setRatePlanId: Dispatch<SetStateAction<string>>;
  effectiveRatePlanId: string;
  availableAddOnServices: SalesCarrierRecord["addOnServices"];
  effectiveSelectedAddOnServiceIds: string[];
  setSelectedAddOnServiceIds: Dispatch<SetStateAction<string[]>>;
  basicsStepValid: boolean;
  moveToStep: (step: number) => void;
}

interface CompactSummaryCardProps {
  title: string;
  primary: string;
  secondary: string;
  tertiary?: string;
  tone?: "default" | "highlight";
}

interface PanelCardProps {
  title: string;
  summary: string;
  meta: string;
  countLabel?: string;
  expanded: boolean;
  headerActions?: ReactNode;
  onToggle: () => void;
  children: ReactNode;
}

function CompactSummaryCard(props: CompactSummaryCardProps) {
  const toneClassName =
    props.tone === "highlight"
      ? "border-amber-200 bg-amber-50/80"
      : "border-white/80 bg-white";

  return (
    <article className={`${summaryCardClassName} ${toneClassName} min-w-0`}>
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
        {props.title}
      </p>
      <p
        className="mt-2 truncate text-sm font-semibold text-slate-950"
        title={props.primary}
      >
        {props.primary}
      </p>
      {props.secondary ? (
        <p
          className="mt-1 truncate text-xs leading-5 text-slate-500"
          title={props.secondary}
        >
          {props.secondary}
        </p>
      ) : null}
      {props.tertiary ? (
        <p
          className="mt-1 truncate text-xs leading-5 text-slate-400"
          title={props.tertiary}
        >
          {props.tertiary}
        </p>
      ) : null}
    </article>
  );
}

function PanelModeToggleButton(props: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  const iconStrokeClassName = joinClassNames(
    "origin-center transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
    props.active ? "opacity-100" : "opacity-95",
  );

  return (
    <button
      type="button"
      aria-label={props.label}
      title={props.label}
      onClick={props.onClick}
      className={joinClassNames(
        panelModeButtonClassName,
        props.active
          ? "scale-[1.04] ring-1 ring-amber-200/80 shadow-[0_24px_34px_-24px_rgba(180,83,9,0.58)]"
          : undefined,
      )}
    >
      <svg
        aria-hidden="true"
        className={joinClassNames(
          "h-4 w-4 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          props.active ? "rotate-180 scale-105" : "rotate-0 scale-100",
        )}
        fill="none"
        viewBox="0 0 20 20"
      >
        <path
          className={iconStrokeClassName}
          d="M5 10h10"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2"
        />
        <path
          className={joinClassNames(
            iconStrokeClassName,
            props.active ? "scale-y-0 opacity-0" : "scale-y-100 opacity-100",
          )}
          d="M10 5v10"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2"
        />
      </svg>
    </button>
  );
}

function PanelCard(props: PanelCardProps) {
  return (
    <article className={surfaceClassName}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
            {props.title}
          </p>
          <p
            className="mt-2 truncate text-sm font-semibold text-slate-950"
            title={props.summary}
          >
            {props.summary}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{props.meta}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {props.countLabel ? (
            <span className="rounded-full bg-white px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
              {props.countLabel}
            </span>
          ) : null}
          <button
            type="button"
            onClick={props.onToggle}
            className={inlineButtonClassName}
          >
            {props.expanded ? "접기" : "펼치기"}
          </button>
          {props.headerActions}
        </div>
      </div>

      {props.expanded ? <div className="mt-4 space-y-4">{props.children}</div> : null}
    </article>
  );
}

function DetailPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-[1rem] border border-stone-200 bg-white px-4 py-3 shadow-[0_12px_24px_-24px_rgba(15,23,42,0.25)]">
      <p className="mb-3 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {title}
      </p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </span>
      <span className="max-w-[72%] text-right text-sm text-slate-700">{value}</span>
    </div>
  );
}

function DetailIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 10v5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
      <circle cx="12" cy="7.2" fill="currentColor" r="1" />
    </svg>
  );
}

function DetailIconButton(props: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={props.label}
      className={detailIconButtonClassName}
      onClick={props.onClick}
      title={props.label}
      type="button"
    >
      <DetailIcon
        className={props.active ? "h-4 w-4 text-amber-700" : "h-4 w-4 text-slate-500"}
      />
    </button>
  );
}

function getDisplayFeeLabel(amount: number | null) {
  return amount === null ? "요금 미정" : formatWon(amount);
}

function normalizeSearchText(value: string) {
  return value.trim().toLowerCase();
}

function parseThresholdInput(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function getShortImei(imei: string) {
  return `IMEI ${imei.slice(-6)}`;
}

function summarizeSelectedServices(
  services: SalesCarrierRecord["addOnServices"],
  selectedIds: string[],
) {
  const selectedServices = services.filter((service) => selectedIds.includes(service.id));

  if (selectedServices.length === 0) {
    return {
      primary: "0개 선택",
      secondary: "",
    };
  }

  const leadNames = selectedServices.slice(0, 2).map((service) => service.name);
  const suffix =
    selectedServices.length > 2 ? ` 외 ${selectedServices.length - 2}개` : "";

  return {
    primary: `${selectedServices.length}개 선택`,
    secondary: `${leadNames.join(", ")}${suffix}`,
  };
}

function toggleDetail(
  currentId: string | null,
  nextId: string,
  setter: Dispatch<SetStateAction<string | null>>,
) {
  setter(currentId === nextId ? null : nextId);
}

export function SalesEntryBasicsStep(props: SalesEntryBasicsStepProps) {
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerCarrierFilter, setCustomerCarrierFilter] = useState("all");
  const [customerRetentionDaysFilter, setCustomerRetentionDaysFilter] = useState("");
  const [inventoryCarrierFilter, setInventoryCarrierFilter] = useState("all");
  const [inventoryModelFilter, setInventoryModelFilter] = useState("all");
  const [inventoryStoreFilter, setInventoryStoreFilter] = useState("all");
  const [inventoryColorFilter, setInventoryColorFilter] = useState("all");
  const [inventoryCapacityFilter, setInventoryCapacityFilter] = useState("all");
  const [layoutMode, setLayoutMode] = useState<StepLayoutMode>("balanced");
  const [inventoryExpanded, setInventoryExpanded] = useState(true);
  const [ratePlanExpanded, setRatePlanExpanded] = useState(false);
  const [serviceExpanded, setServiceExpanded] = useState(false);
  const [inventoryDetailId, setInventoryDetailId] = useState<string | null>(null);
  const [ratePlanDetailId, setRatePlanDetailId] = useState<string | null>(null);
  const [serviceDetailId, setServiceDetailId] = useState<string | null>(null);

  const deferredCustomerQuery = useDeferredValue(customerQuery);

  const selectedRatePlan =
    props.availableRatePlans.find((ratePlan) => ratePlan.id === props.effectiveRatePlanId) ??
    null;
  const selectedServices = props.availableAddOnServices.filter((service) =>
    props.effectiveSelectedAddOnServiceIds.includes(service.id),
  );
  const inventoryDetailItem =
    props.availableInventory.find((inventoryItem) => inventoryItem.id === inventoryDetailId) ??
    null;
  const ratePlanDetailItem =
    props.availableRatePlans.find((ratePlan) => ratePlan.id === ratePlanDetailId) ?? null;
  const serviceDetailItem =
    props.availableAddOnServices.find((service) => service.id === serviceDetailId) ?? null;

  const availableCustomerCarrierFilters = useMemo(() => {
    const uniqueCarrierMap = new Map<string, string>();

    for (const customer of props.customers) {
      if (customer.currentCarrierId && customer.currentCarrierName) {
        uniqueCarrierMap.set(customer.currentCarrierId, customer.currentCarrierName);
      }
    }

    return [...uniqueCarrierMap.entries()].map(([id, name]) => ({ id, name }));
  }, [props.customers]);

  const availableInventoryCarrierFilters = useMemo(() => {
    const uniqueCarrierMap = new Map<string, string>();

    for (const inventoryItem of props.availableInventory) {
      uniqueCarrierMap.set(inventoryItem.carrierId, inventoryItem.carrierName);
    }

    return [...uniqueCarrierMap.entries()].map(([id, name]) => ({ id, name }));
  }, [props.availableInventory]);

  const availableInventoryModelFilters = useMemo(() => {
    const uniqueModelMap = new Map<string, string>();

    for (const inventoryItem of props.availableInventory) {
      uniqueModelMap.set(inventoryItem.deviceModelId, inventoryItem.deviceModelName);
    }

    return [...uniqueModelMap.entries()].map(([id, name]) => ({ id, name }));
  }, [props.availableInventory]);

  const availableInventoryStoreFilters = useMemo(() => {
    const uniqueStoreMap = new Map<string, string>();

    for (const inventoryItem of props.availableInventory) {
      if (inventoryItem.storeName) {
        uniqueStoreMap.set(inventoryItem.storeName, inventoryItem.storeName);
      }
    }

    return [...uniqueStoreMap.entries()].map(([id, name]) => ({ id, name }));
  }, [props.availableInventory]);

  const availableInventoryColorFilters = useMemo(() => {
    const uniqueColors = new Set(
      props.availableInventory.map((inventoryItem) => inventoryItem.color),
    );

    return [...uniqueColors].sort((left, right) => left.localeCompare(right));
  }, [props.availableInventory]);

  const availableInventoryCapacityFilters = useMemo(() => {
    const uniqueCapacities = new Set(
      props.availableInventory.map((inventoryItem) => inventoryItem.capacity),
    );

    return [...uniqueCapacities].sort((left, right) => left.localeCompare(right));
  }, [props.availableInventory]);

  const filteredCustomers = useMemo(() => {
    const normalizedQuery = normalizeSearchText(deferredCustomerQuery);
    const retentionThreshold = parseThresholdInput(customerRetentionDaysFilter);

    return props.customers.filter((customer) => {
      if (
        customerCarrierFilter !== "all" &&
        customer.currentCarrierId !== customerCarrierFilter
      ) {
        return false;
      }

      if (
        retentionThreshold !== null &&
        (customer.retentionRemainingDays === null ||
          customer.retentionRemainingDays > retentionThreshold)
      ) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return customer.name.toLowerCase().includes(normalizedQuery);
    });
  }, [
    customerCarrierFilter,
    customerRetentionDaysFilter,
    deferredCustomerQuery,
    props.customers,
  ]);

  const filteredInventory = useMemo(() => {
    return props.availableInventory.filter((inventoryItem) => {
      if (
        inventoryCarrierFilter !== "all" &&
        inventoryItem.carrierId !== inventoryCarrierFilter
      ) {
        return false;
      }

      if (
        inventoryModelFilter !== "all" &&
        inventoryItem.deviceModelId !== inventoryModelFilter
      ) {
        return false;
      }

      if (
        inventoryStoreFilter !== "all" &&
        inventoryItem.storeName !== inventoryStoreFilter
      ) {
        return false;
      }

      if (
        inventoryColorFilter !== "all" &&
        inventoryItem.color !== inventoryColorFilter
      ) {
        return false;
      }

      if (
        inventoryCapacityFilter !== "all" &&
        inventoryItem.capacity !== inventoryCapacityFilter
      ) {
        return false;
      }

      return true;
    });
  }, [
    inventoryCapacityFilter,
    inventoryCarrierFilter,
    inventoryColorFilter,
    inventoryModelFilter,
    inventoryStoreFilter,
    props.availableInventory,
  ]);

  const showCustomerPane = layoutMode !== "selection-only";
  const showSelectionPane = layoutMode !== "customer-only";
  const layoutClassName = joinClassNames(
    "grid gap-4 transition-[grid-template-columns] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
    layoutMode === "customer-only"
      ? "xl:grid-cols-[minmax(0,1fr)_minmax(0,0fr)]"
      : layoutMode === "selection-only"
        ? "xl:grid-cols-[minmax(0,0fr)_minmax(0,1fr)]"
        : "xl:grid-cols-[minmax(0,0.4fr)_minmax(0,0.6fr)]",
  );

  function toggleLayoutMode(targetMode: Exclude<StepLayoutMode, "balanced">) {
    setLayoutMode((current) => (current === targetMode ? "balanced" : targetMode));
  }

  function getPaneWrapperClassName(
    visible: boolean,
    direction: "left" | "right",
  ) {
    return joinClassNames(
      paneWrapperBaseClassName,
      visible
        ? "max-h-[220rem] translate-x-0 scale-100 opacity-100 blur-0"
        : direction === "left"
          ? "pointer-events-none max-h-0 -translate-x-4 scale-[0.985] opacity-0 blur-[2px]"
          : "pointer-events-none max-h-0 translate-x-4 scale-[0.985] opacity-0 blur-[2px]",
    );
  }

  const inventorySummary = props.selectedInventory
    ? `${props.selectedInventory.carrierName} ${props.selectedInventory.deviceModelName}`
    : "재고를 선택해 주세요";
  const inventoryMeta = props.selectedInventory
    ? `${props.selectedInventory.color} · ${props.selectedInventory.capacity} · ${
        props.selectedInventory.storeName ?? "매장 미지정"
      } · ${getShortImei(props.selectedInventory.imei)}`
    : "";
  const ratePlanSummary = selectedRatePlan?.name ?? "요금제를 선택해 주세요";
  const ratePlanMeta = selectedRatePlan
    ? `${formatWon(selectedRatePlan.monthlyFee)} · 최근 ${selectedRatePlan.usageCount}건`
    : "";
  const serviceSummary = summarizeSelectedServices(
    props.availableAddOnServices,
    props.effectiveSelectedAddOnServiceIds,
  );

  function toggleAddOnServiceId(serviceId: string) {
    const availableServiceIds = new Set(
      props.availableAddOnServices.map((service) => service.id),
    );

    props.setSelectedAddOnServiceIds((current) => {
      const safeCurrent = current.filter((value) => availableServiceIds.has(value));

      if (safeCurrent.includes(serviceId)) {
        return safeCurrent.filter((value) => value !== serviceId);
      }

      return [...safeCurrent, serviceId];
    });
  }

  return (
    <div className="space-y-4">
      <article className={surfaceClassName}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Sales Input
            </p>
            <h3 className="text-lg font-semibold tracking-[-0.03em] text-slate-950">
              고객과 재고 선택
            </h3>
          </div>
          <span className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white">
            담당 {props.currentUserName}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <label className={`${fieldLabelClassName} max-w-[12.75rem]`}>
            <span>판매일</span>
            <DateControl
              aria-label="판매일"
              className="h-11 min-h-11 rounded-[1rem] px-3 py-2 text-sm"
              name="saleDate"
              onValueChange={props.setSaleDate}
              required
              value={props.saleDate}
            />
          </label>

          <button
            type="button"
            onClick={() => props.moveToStep(1)}
            disabled={!props.basicsStepValid}
            className={`${primaryButtonClassName} h-11 px-5 disabled:cursor-not-allowed disabled:opacity-60`}
          >
            다음 단계
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <CompactSummaryCard
            title="고객"
            primary={props.selectedCustomer?.name ?? "고객을 선택해 주세요"}
            secondary={props.selectedCustomer?.phone ?? ""}
            tertiary={
              props.selectedCustomer
                ? `${props.selectedCustomer.currentCarrierName ?? "통신사 미정"} · ${
                    props.selectedCustomer.retentionDisplay ?? "유지 기준 미정"
                  }`
                : undefined
            }
            tone="highlight"
          />
          <CompactSummaryCard
            title="재고"
            primary={inventorySummary}
            secondary={inventoryMeta}
            tone="highlight"
          />
          <CompactSummaryCard
            title="요금제"
            primary={ratePlanSummary}
            secondary={ratePlanMeta}
          />
          <CompactSummaryCard
            title="부가서비스"
            primary={serviceSummary.primary}
            secondary={serviceSummary.secondary}
            tertiary={`${selectedServices.length}개 선택`}
          />
        </div>
      </article>

      <div className={layoutClassName}>
        <div
          aria-hidden={!showCustomerPane}
          className={getPaneWrapperClassName(showCustomerPane, "left")}
          inert={!showCustomerPane}
        >
          <article className={`${surfaceClassName} min-w-0`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Customer
                </p>
                <h4 className="text-base font-semibold text-slate-950">고객 표준 선택</h4>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="rounded-full bg-white px-3 py-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {filteredCustomers.length}명
                </span>
                <PanelModeToggleButton
                  active={layoutMode === "customer-only"}
                  label={
                    layoutMode === "customer-only"
                      ? "고객 영역 균형 보기로 되돌리기"
                      : "고객 영역을 넓게 보기"
                  }
                  onClick={() => toggleLayoutMode("customer-only")}
                />
              </div>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,9.5rem)_minmax(0,8.25rem)_minmax(0,5rem)] xl:grid-cols-[minmax(0,10rem)_minmax(0,8.4rem)_minmax(0,5rem)]">
              <label className={joinClassNames(fieldLabelClassName, "w-full max-w-[10rem]")}>
                <span>고객명 검색</span>
                <input
                  className={joinClassNames(searchInputClassName, "w-full max-w-[10rem]")}
                  inputMode="search"
                  maxLength={4}
                  onChange={(event) => setCustomerQuery(event.target.value)}
                  placeholder="고객명 4자"
                  value={customerQuery}
                />
              </label>
              <label className={joinClassNames(fieldLabelClassName, "w-full max-w-[8.4rem]")}>
                <span>통신사</span>
                <CompactSelectControl
                  className="w-full max-w-[8.4rem]"
                  aria-label="통신사"
                  value={customerCarrierFilter}
                  onValueChange={setCustomerCarrierFilter}
                >
                  <option value="all">전체</option>
                  {availableCustomerCarrierFilters.map((carrier) => (
                    <option key={carrier.id} value={carrier.id}>
                      {carrier.name}
                    </option>
                  ))}
                </CompactSelectControl>
              </label>
              <label className={joinClassNames(fieldLabelClassName, "w-full max-w-[5rem]")}>
                <span>잔여일</span>
                <input
                  className={joinClassNames(searchInputClassName, "w-full max-w-[5rem]")}
                  inputMode="numeric"
                  maxLength={2}
                  min="0"
                  onChange={(event) => setCustomerRetentionDaysFilter(event.target.value)}
                  placeholder="예: 30"
                  value={customerRetentionDaysFilter}
                />
              </label>
            </div>

            <div className="mt-4">
              {filteredCustomers.length > 0 ? (
                <div className={fixedTableWrapperClassName}>
                  <div className="max-h-[34rem] overflow-y-auto">
                    <table className={tableClassName}>
                      <thead className="sticky top-0 bg-stone-50">
                        <tr>
                          <th className={`${headerCellClassName} w-[41%]`}>고객</th>
                          <th className={`${headerCellClassName} w-[17%]`}>통신사</th>
                          <th className={`${headerCellClassName} w-[28%]`}>유지 기준</th>
                          <th className={`${headerCellClassName} w-[14%] text-center`}>
                            선택
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200">
                        {filteredCustomers.map((customer) => {
                          const isSelected = customer.id === props.customerId;

                          return (
                            <tr
                              key={customer.id}
                              className={isSelected ? selectedRowClassName : "bg-white"}
                            >
                              <td className={cellClassName}>
                                <p className="truncate font-semibold text-slate-950">
                                  {customer.name}
                                </p>
                                <p className="mt-1 truncate text-xs text-slate-500">
                                  {customer.phone}
                                </p>
                              </td>
                              <td className={cellClassName}>
                                <span className="block truncate">
                                  {customer.currentCarrierName ?? "미정"}
                                </span>
                              </td>
                              <td className={cellClassName}>
                                <span
                                  className="block truncate text-xs text-slate-500"
                                  title={customer.retentionDisplay ?? "유지 기준 미정"}
                                >
                                  {customer.retentionDisplay ?? "유지 기준 미정"}
                                </span>
                                {customer.retentionRemainingDays !== null ? (
                                  <span className="mt-1 inline-flex rounded-full bg-stone-100 px-2 py-1 text-[0.68rem] font-semibold text-slate-600">
                                    잔여 {customer.retentionRemainingDays}일
                                  </span>
                                ) : null}
                              </td>
                              <td className={`${cellClassName} text-center`}>
                                <SelectionStateControl
                                  className="mx-auto"
                                  selected={isSelected}
                                  selectLabel={`${customer.name} 고객 적용`}
                                  selectedLabel={`${customer.name} 고객 선택됨`}
                                  onClick={() => props.setCustomerId(customer.id)}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <EmptyState message="조건에 맞는 고객이 없습니다. 검색 조건을 다시 확인해 주세요." />
              )}
            </div>
          </article>
        </div>

        <div
          aria-hidden={!showSelectionPane}
          className={getPaneWrapperClassName(showSelectionPane, "right")}
          inert={!showSelectionPane}
        >
          <aside className="min-w-0 space-y-4">
            <PanelCard
              title="재고"
              summary={inventorySummary}
              meta={inventoryMeta}
              countLabel={`${filteredInventory.length}개`}
              expanded={inventoryExpanded}
              headerActions={
                <PanelModeToggleButton
                  active={layoutMode === "selection-only"}
                  label={
                    layoutMode === "selection-only"
                      ? "재고 영역 균형 보기로 되돌리기"
                      : "재고 영역을 넓게 보기"
                  }
                  onClick={() => toggleLayoutMode("selection-only")}
                />
              }
              onToggle={() => setInventoryExpanded((current) => !current)}
            >
              <div className="space-y-3">
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                  <label className={fieldLabelClassName}>
                    <span>기종</span>
                    <CompactSelectControl
                      aria-label="기종"
                      value={inventoryModelFilter}
                      onValueChange={setInventoryModelFilter}
                    >
                      <option value="all">전체 기종</option>
                      {availableInventoryModelFilters.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.name}
                        </option>
                      ))}
                    </CompactSelectControl>
                  </label>
                  <label className={fieldLabelClassName}>
                    <span>매장</span>
                    <CompactSelectControl
                      aria-label="매장"
                      value={inventoryStoreFilter}
                      onValueChange={setInventoryStoreFilter}
                    >
                      <option value="all">전체 매장</option>
                      {availableInventoryStoreFilters.map((store) => (
                        <option key={store.id} value={store.id}>
                          {store.name}
                        </option>
                      ))}
                    </CompactSelectControl>
                  </label>
                  <label className={fieldLabelClassName}>
                    <span>색상</span>
                    <CompactSelectControl
                      aria-label="색상"
                      value={inventoryColorFilter}
                      onValueChange={setInventoryColorFilter}
                    >
                      <option value="all">전체 색상</option>
                      {availableInventoryColorFilters.map((color) => (
                        <option key={color} value={color}>
                          {color}
                        </option>
                      ))}
                    </CompactSelectControl>
                  </label>
                  <label className={fieldLabelClassName}>
                    <span>용량</span>
                    <CompactSelectControl
                      aria-label="용량"
                      value={inventoryCapacityFilter}
                      onValueChange={setInventoryCapacityFilter}
                    >
                      <option value="all">전체 용량</option>
                      {availableInventoryCapacityFilters.map((capacity) => (
                        <option key={capacity} value={capacity}>
                          {capacity}
                        </option>
                      ))}
                    </CompactSelectControl>
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    className={
                      inventoryCarrierFilter === "all"
                        ? applyButtonClassName
                        : inlineButtonClassName
                    }
                    onClick={() => setInventoryCarrierFilter("all")}
                    type="button"
                  >
                    전체 통신사
                  </button>
                  {availableInventoryCarrierFilters.map((carrier) => (
                    <button
                      key={carrier.id}
                      className={
                        inventoryCarrierFilter === carrier.id
                          ? applyButtonClassName
                          : inlineButtonClassName
                      }
                      onClick={() => setInventoryCarrierFilter(carrier.id)}
                      type="button"
                    >
                      {carrier.name}
                    </button>
                  ))}
                </div>
              </div>

              {filteredInventory.length > 0 ? (
                <>
                  <div className={tableWrapperClassName}>
                    <table className={tableClassName}>
                      <thead className="bg-stone-50">
                        <tr>
                          <th className={`${headerCellClassName} w-[58%]`}>판매 가능 재고</th>
                          <th className={`${headerCellClassName} w-[14%]`}>입고일</th>
                          <th className={`${headerCellClassName} w-[18%] text-center`}>
                            선택
                          </th>
                          <th className={`${headerCellClassName} w-[10%] text-center`}>
                            상세
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200">
                        {filteredInventory.map((inventoryItem) => {
                          const isSelected = inventoryItem.id === props.inventoryItemId;
                          const primaryLine = `${inventoryItem.carrierName} ${inventoryItem.deviceModelName}`;
                          const secondaryLine = `${inventoryItem.color} · ${inventoryItem.capacity} · ${
                            inventoryItem.storeName ?? "매장 미지정"
                          } · ${getShortImei(inventoryItem.imei)}`;

                          return (
                            <tr
                              key={inventoryItem.id}
                              className={isSelected ? selectedRowClassName : "bg-white"}
                            >
                              <td className={cellClassName}>
                                <p className="truncate font-semibold text-slate-950">
                                  {primaryLine}
                                </p>
                                <p
                                  className="mt-1 truncate text-xs text-slate-500"
                                  title={secondaryLine}
                                >
                                  {secondaryLine}
                                </p>
                              </td>
                              <td className={cellClassName}>
                                <span className="block whitespace-nowrap">
                                  {formatKstDate(new Date(inventoryItem.receivedAt))}
                                </span>
                              </td>
                              <td className={`${cellClassName} text-center`}>
                                <SelectionStateControl
                                  className="mx-auto"
                                  selected={isSelected}
                                  selectLabel={`${inventoryItem.deviceModelName} 재고 적용`}
                                  selectedLabel="선택중"
                                  onClick={() => props.setInventoryItemId(inventoryItem.id)}
                                />
                              </td>
                              <td className={`${cellClassName} text-center`}>
                                <DetailIconButton
                                  active={inventoryDetailId === inventoryItem.id}
                                  label={`${inventoryItem.deviceModelName} 재고 상세 보기`}
                                  onClick={() =>
                                    toggleDetail(
                                      inventoryDetailId,
                                      inventoryItem.id,
                                      setInventoryDetailId,
                                    )
                                  }
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {inventoryDetailItem ? (
                    <DetailPanel title="재고 상세">
                      <DetailLine
                        label="재고"
                        value={`${inventoryDetailItem.carrierName} ${inventoryDetailItem.deviceModelName}`}
                      />
                      <DetailLine
                        label="사양"
                        value={`${inventoryDetailItem.color} / ${inventoryDetailItem.capacity}`}
                      />
                      <DetailLine label="IMEI" value={inventoryDetailItem.imei} />
                      <DetailLine
                        label="매장"
                        value={inventoryDetailItem.storeName ?? "매장 미지정"}
                      />
                      <DetailLine
                        label="원가"
                        value={formatWon(inventoryDetailItem.costAmount)}
                      />
                      <DetailLine
                        label="입고일"
                        value={formatKstDate(new Date(inventoryDetailItem.receivedAt))}
                      />
                    </DetailPanel>
                  ) : null}
                </>
              ) : (
                <EmptyState message="조건에 맞는 판매 가능 재고가 없습니다." />
              )}
            </PanelCard>

            <PanelCard
              title="요금제"
              summary={ratePlanSummary}
              meta={ratePlanMeta}
              countLabel={`${props.availableRatePlans.length}개`}
              expanded={ratePlanExpanded}
              onToggle={() => setRatePlanExpanded((current) => !current)}
            >
              {props.availableRatePlans.length > 0 ? (
                <>
                  <div className={tableWrapperClassName}>
                    <table className={tableClassName}>
                      <thead className="bg-stone-50">
                        <tr>
                          <th className={`${headerCellClassName} w-[58%]`}>요금제</th>
                          <th className={`${headerCellClassName} w-[14%]`}>사용</th>
                          <th className={`${headerCellClassName} w-[18%] text-center`}>
                            선택
                          </th>
                          <th className={`${headerCellClassName} w-[10%] text-center`}>
                            상세
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200">
                        {props.availableRatePlans.map((ratePlan) => {
                          const isSelected = ratePlan.id === props.effectiveRatePlanId;

                          return (
                            <tr
                              key={ratePlan.id}
                              className={isSelected ? selectedRowClassName : "bg-white"}
                            >
                              <td className={cellClassName}>
                                <p className="truncate font-semibold text-slate-950">
                                  {ratePlan.name}
                                </p>
                                <p className="mt-1 truncate text-xs text-slate-500">
                                  {formatWon(ratePlan.monthlyFee)}
                                </p>
                              </td>
                              <td className={cellClassName}>
                                <span className="block whitespace-nowrap">
                                  {ratePlan.usageCount}건
                                </span>
                              </td>
                              <td className={`${cellClassName} text-center`}>
                                <SelectionStateControl
                                  className="mx-auto"
                                  selected={isSelected}
                                  selectLabel={`${ratePlan.name} 요금제 적용`}
                                  selectedLabel="선택중"
                                  onClick={() => props.setRatePlanId(ratePlan.id)}
                                />
                              </td>
                              <td className={`${cellClassName} text-center`}>
                                <DetailIconButton
                                  active={ratePlanDetailId === ratePlan.id}
                                  label={`${ratePlan.name} 요금제 상세 보기`}
                                  onClick={() =>
                                    toggleDetail(
                                      ratePlanDetailId,
                                      ratePlan.id,
                                      setRatePlanDetailId,
                                    )
                                  }
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {ratePlanDetailItem ? (
                    <DetailPanel title="요금제 상세">
                      <DetailLine label="요금제" value={ratePlanDetailItem.name} />
                      <DetailLine
                        label="월요금"
                        value={formatWon(ratePlanDetailItem.monthlyFee)}
                      />
                      <DetailLine
                        label="최근 사용"
                        value={`${ratePlanDetailItem.usageCount}건`}
                      />
                    </DetailPanel>
                  ) : null}
                </>
              ) : (
                <EmptyState message="선택 가능한 요금제가 없습니다. 먼저 재고를 선택해 주세요." />
              )}
            </PanelCard>

            <PanelCard
              title="부가서비스"
              summary={serviceSummary.primary}
              meta={serviceSummary.secondary}
              countLabel={`${props.availableAddOnServices.length}개`}
              expanded={serviceExpanded}
              onToggle={() => setServiceExpanded((current) => !current)}
            >
              {props.availableAddOnServices.length > 0 ? (
                <>
                  <div className={tableWrapperClassName}>
                    <table className={tableClassName}>
                      <thead className="bg-stone-50">
                        <tr>
                          <th className={`${headerCellClassName} w-[58%]`}>부가서비스</th>
                          <th className={`${headerCellClassName} w-[14%]`}>사용</th>
                          <th className={`${headerCellClassName} w-[18%] text-center`}>
                            선택
                          </th>
                          <th className={`${headerCellClassName} w-[10%] text-center`}>
                            상세
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200">
                        {props.availableAddOnServices.map((service) => {
                          const isSelected = props.effectiveSelectedAddOnServiceIds.includes(
                            service.id,
                          );
                          const secondaryLine = `${
                            service.scope === "shared" ? "공통" : "통신사 전용"
                          } · ${getDisplayFeeLabel(service.monthlyFee)}`;

                          return (
                            <tr
                              key={service.id}
                              className={isSelected ? selectedRowClassName : "bg-white"}
                            >
                              <td className={cellClassName}>
                                <p className="truncate font-semibold text-slate-950">
                                  {service.name}
                                </p>
                                <p
                                  className="mt-1 truncate text-xs text-slate-500"
                                  title={secondaryLine}
                                >
                                  {secondaryLine}
                                </p>
                              </td>
                              <td className={cellClassName}>
                                <span className="block whitespace-nowrap">
                                  {service.usageCount}건
                                </span>
                              </td>
                              <td className={`${cellClassName} text-center`}>
                                <SelectionStateControl
                                  className="mx-auto"
                                  selected={isSelected}
                                  selectLabel={`${service.name} 부가서비스 적용`}
                                  selectedLabel="선택중"
                                  onClick={() => toggleAddOnServiceId(service.id)}
                                />
                              </td>
                              <td className={`${cellClassName} text-center`}>
                                <DetailIconButton
                                  active={serviceDetailId === service.id}
                                  label={`${service.name} 부가서비스 상세 보기`}
                                  onClick={() =>
                                    toggleDetail(
                                      serviceDetailId,
                                      service.id,
                                      setServiceDetailId,
                                    )
                                  }
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {serviceDetailItem ? (
                    <DetailPanel title="부가서비스 상세">
                      <DetailLine label="서비스" value={serviceDetailItem.name} />
                      <DetailLine
                        label="구분"
                        value={serviceDetailItem.scope === "shared" ? "공통" : "통신사 전용"}
                      />
                      <DetailLine
                        label="월요금"
                        value={getDisplayFeeLabel(serviceDetailItem.monthlyFee)}
                      />
                      <DetailLine
                        label="최근 사용"
                        value={`${serviceDetailItem.usageCount}건`}
                      />
                    </DetailPanel>
                  ) : null}
                </>
              ) : (
                <EmptyState message="선택 가능한 부가서비스가 없습니다. 먼저 재고를 선택해 주세요." />
              )}
            </PanelCard>
          </aside>
        </div>
      </div>
    </div>
  );
}
