"use client";

import { useRef, useState, type ReactNode } from "react";

import {
  toggleInventoryItemHiddenAction,
  upsertInventoryItemAction,
} from "@/app/actions/inventory";
import {
  CurrencyField,
  EmptyState,
  FormField,
  ModelNumberField,
  FormSelect,
  FormTextArea,
  NoticeBanner,
  SubmitButton,
} from "@/components/workspace/admin-form-controls";
import { ConfirmSubmitButton } from "@/components/workspace/confirm-submit-button";
import { ListPaginationControls } from "@/components/workspace/list-pagination-controls";
import {
  joinClassNames,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/workspace/ui-classnames";
import { WorkspaceModalShell } from "@/components/workspace/workspace-modal-shell";
import {
  ActionChip,
  CarrierInlineLabel,
  MetricCard,
  PageIntro,
  Panel,
  TonePill,
} from "@/components/workspace/workspace-primitives";
import { formatKstDate } from "@/lib/date-utils";
import { formatWon } from "@/lib/formatters";
import type { PaginationState } from "@/lib/pagination";

type InventoryStatusValue =
  | "IN_STOCK"
  | "RESERVED"
  | "SOLD"
  | "RETURNED"
  | "DISCARDED";

type InventoryVisibilityFilter = "all" | "visible" | "hidden";

type InventoryModalState =
  | { mode: "create" }
  | { mode: "detail" | "edit"; itemId: string }
  | null;

const surfaceClassName =
  "rounded-[1.25rem] border border-stone-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(245,243,239,0.96)_100%)] p-4 shadow-[0_18px_38px_-34px_rgba(15,23,42,0.24)]";

const formGridClassName = "grid gap-3 md:grid-cols-2";

const inventoryToneMap = {
  IN_STOCK: "teal",
  RESERVED: "amber",
  SOLD: "slate",
  RETURNED: "rose",
  DISCARDED: "slate",
} as const;

const inventoryStatusLabelMap = {
  IN_STOCK: "입고",
  RESERVED: "예약",
  SOLD: "판매",
  RETURNED: "반품",
  DISCARDED: "폐기",
} as const;

const noticeMessageMap = {
  "duplicate-serial":
    "같은 S/N 재고가 이미 존재합니다. 번호를 다시 확인해 주세요.",
  "invalid-inventory-form":
    "재고 등록 또는 수정에 필요한 값이 비어 있습니다.",
  "inventory-not-found":
    "대상 재고를 찾지 못했습니다. 목록에서 다시 선택해 주세요.",
} as const;

export interface InventoryCarrierOption {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

export interface InventoryColorOption {
  id: string;
  name: string;
  isActive: boolean;
}

export interface InventoryStoreOption {
  id: string;
  code: string;
  name: string;
  isDefault: boolean;
}

export interface InventoryDeviceModelOption {
  id: string;
  name: string;
  manufacturer: string | null;
  isActive: boolean;
}

export interface InventoryStaffOption {
  id: string;
  displayName: string;
  roleLabel: string;
}

export interface InventoryItemRecord {
  id: string;
  storeId: string | null;
  storeName: string;
  carrierId: string;
  carrierName: string;
  deviceModelId: string;
  deviceModelName: string;
  deviceManufacturer: string | null;
  color: string;
  capacity: string;
  serialNumber: string;
  modelNumber: string;
  costAmount: number;
  status: InventoryStatusValue;
  receivedAt: Date;
  dispatchedAt: Date | null;
  assigneeId: string | null;
  assigneeName: string | null;
  notes: string | null;
  isHidden: boolean;
}

export interface InventoryFilters {
  manufacturer: string;
  status: "ALL" | InventoryStatusValue;
  carrierId: string;
  assigneeId: string;
  visibility: InventoryVisibilityFilter;
}

export interface InventoryMetrics {
  totalCount: number;
  availableCount: number;
  reservedCount: number;
  soldCount: number;
  hiddenCount: number;
  longHeldCount: number;
}

export interface InventoryOverviewProps {
  currentUserId: string;
  stores: InventoryStoreOption[];
  carriers: InventoryCarrierOption[];
  colors: InventoryColorOption[];
  deviceModels: InventoryDeviceModelOption[];
  staffMembers: InventoryStaffOption[];
  items: InventoryItemRecord[];
  filters: InventoryFilters;
  pagination: PaginationState;
  metrics: InventoryMetrics;
  notice: keyof typeof noticeMessageMap | null;
}

const inventoryCapacityOptions = [
  "8GB",
  "16GB",
  "32GB",
  "64GB",
  "128GB",
  "256GB",
  "512GB",
  "1TB",
] as const;

function getStatusLabel(status: InventoryStatusValue) {
  return inventoryStatusLabelMap[status];
}

function getCarrierOptionLabel(carrier: InventoryCarrierOption) {
  return carrier.isActive ? carrier.name : `${carrier.name} (비활성)`;
}

function getStoreOptionLabel(store: InventoryStoreOption) {
  return store.isDefault ? `${store.name} (기본)` : store.name;
}

function getColorOptionLabel(color: InventoryColorOption & { isLegacy?: boolean }) {
  if (color.isLegacy) {
    return `${color.name} (현재 저장값)`;
  }

  return color.isActive ? color.name : `${color.name} (비활성)`;
}

function getDeviceModelOptionLabel(deviceModel: InventoryDeviceModelOption) {
  const baseLabel = deviceModel.manufacturer
    ? `${deviceModel.manufacturer} ${deviceModel.name}`
    : deviceModel.name;

  return deviceModel.isActive ? baseLabel : `${baseLabel} (비활성)`;
}

function getItemModelLabel(item: InventoryItemRecord) {
  return item.deviceManufacturer
    ? `${item.deviceManufacturer} ${item.deviceModelName}`
    : item.deviceModelName;
}

function getAvailabilityLabel(item: InventoryItemRecord) {
  if (item.isHidden) {
    return "화면 제외";
  }

  return item.status === "IN_STOCK" ? "판매 가능" : "판매 불가";
}

function getAvailabilityTone(item: InventoryItemRecord) {
  if (item.isHidden) {
    return "slate";
  }

  return item.status === "IN_STOCK" ? "teal" : "amber";
}

function getManufacturerOptions(deviceModels: InventoryDeviceModelOption[]) {
  return Array.from(
    new Set(
      deviceModels
        .map((deviceModel) => deviceModel.manufacturer?.trim() ?? "")
        .filter((manufacturer) => manufacturer.length > 0),
    ),
  ).sort((left, right) => left.localeCompare(right, "ko"));
}

function buildColorOptions(
  colors: InventoryColorOption[],
  currentColor: string | null | undefined,
) {
  const optionMap = new Map(
    colors.map((color) => [
      color.name,
      {
        ...color,
        isLegacy: false,
      },
    ]),
  );

  const normalizedCurrentColor = currentColor?.trim();

  if (normalizedCurrentColor && !optionMap.has(normalizedCurrentColor)) {
    optionMap.set(normalizedCurrentColor, {
      id: `legacy:${normalizedCurrentColor}`,
      name: normalizedCurrentColor,
      isActive: true,
      isLegacy: true,
    });
  }

  return [...optionMap.values()];
}

function buildCapacityOptions(currentCapacity: string | null | undefined) {
  const optionSet = new Set<string>(inventoryCapacityOptions);
  const normalizedCurrentCapacity = currentCapacity?.trim();

  if (normalizedCurrentCapacity) {
    optionSet.add(normalizedCurrentCapacity);
  }

  return [...optionSet];
}

function appendInventoryFilterParams(
  searchParams: URLSearchParams,
  filters: InventoryFilters,
) {
  if (filters.carrierId) {
    searchParams.set("carrierId", filters.carrierId);
  }

  if (filters.manufacturer) {
    searchParams.set("manufacturer", filters.manufacturer);
  }

  if (filters.status !== "ALL") {
    searchParams.set("status", filters.status);
  }

  if (filters.assigneeId) {
    searchParams.set("assigneeId", filters.assigneeId);
  }

  if (filters.visibility !== "all") {
    searchParams.set("visibility", filters.visibility);
  }
}

function buildInventoryHref(filters: InventoryFilters, page: number) {
  const searchParams = new URLSearchParams();

  appendInventoryFilterParams(searchParams, filters);

  if (page > 1) {
    searchParams.set("page", String(page));
  }

  const query = searchParams.toString();
  return query ? `/inventory?${query}` : "/inventory";
}

function LegendIcon({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={joinClassNames(
        "inline-flex h-8 w-8 items-center justify-center rounded-full border",
        className,
      )}
    >
      {children}
    </span>
  );
}

function DetailIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 20 20">
      <path
        d="M10 4.5c-4 0-6.83 3.15-7.75 5.5.92 2.35 3.75 5.5 7.75 5.5s6.83-3.15 7.75-5.5c-.92-2.35-3.75-5.5-7.75-5.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
      <circle cx="10" cy="10" r="2.25" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 20 20">
      <path
        d="M13.75 4.75a1.768 1.768 0 1 1 2.5 2.5L8.5 15H6v-2.5l7.75-7.75Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
      <path
        d="M11.75 6.75 14.25 9.25"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function ActionIconButton({
  icon,
  label,
  onClick,
  tone,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  tone: "amber" | "teal";
}) {
  const toneClassName =
    tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300 hover:bg-amber-100"
      : "border-teal-200 bg-teal-50 text-teal-700 hover:border-teal-300 hover:bg-teal-100";

  return (
    <button
      aria-label={label}
      className={joinClassNames(
        "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border transition duration-150 hover:-translate-y-px",
        toneClassName,
      )}
      onClick={onClick}
      title={label}
      type="button"
    >
      {icon}
      <span className="sr-only">{label}</span>
    </button>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-stone-100 py-2 last:border-b-0 last:pb-0 first:pt-0">
      <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </span>
      <span className="max-w-[68%] text-right text-sm leading-6 text-slate-700">
        {value}
      </span>
    </div>
  );
}

function InventoryLegend() {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3 rounded-[1rem] border border-stone-200 bg-stone-50/90 px-3 py-2">
      <span className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
        범례
      </span>
      <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-600">
        <LegendIcon className="border-amber-200 bg-amber-50 text-amber-700">
          <DetailIcon />
        </LegendIcon>
        상세 보기
      </span>
      <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-600">
        <LegendIcon className="border-teal-200 bg-teal-50 text-teal-700">
          <EditIcon />
        </LegendIcon>
        수정
      </span>
    </div>
  );
}

interface InventoryItemFormProps {
  currentUserId: string;
  stores: InventoryStoreOption[];
  carriers: InventoryCarrierOption[];
  colors: InventoryColorOption[];
  deviceModels: InventoryDeviceModelOption[];
  staffMembers: InventoryStaffOption[];
  initialItem?: InventoryItemRecord | null;
  submitLabel: string;
}

function InventoryItemForm({
  currentUserId,
  stores,
  carriers,
  colors,
  deviceModels,
  staffMembers,
  initialItem = null,
  submitLabel,
}: InventoryItemFormProps) {
  const defaultStoreId = initialItem?.storeId ?? stores[0]?.id ?? "";
  const defaultReceivedAt = initialItem
    ? formatKstDate(initialItem.receivedAt)
    : formatKstDate(new Date());
  const colorOptions = buildColorOptions(colors, initialItem?.color);
  const capacityOptions = buildCapacityOptions(initialItem?.capacity);

  return (
    <form action={upsertInventoryItemAction} className={`${surfaceClassName} ${formGridClassName}`}>
      {initialItem ? <input name="id" type="hidden" value={initialItem.id} /> : null}

      <FormSelect label="매장" name="storeId" defaultValue={defaultStoreId} required>
        <option value="">매장을 선택해 주세요</option>
        {stores.map((store) => (
          <option key={store.id} value={store.id}>
            {getStoreOptionLabel(store)}
          </option>
        ))}
      </FormSelect>
      <FormSelect
        label="통신사"
        name="carrierId"
        defaultValue={initialItem?.carrierId ?? ""}
        required
      >
        <option value="">통신사를 선택해 주세요</option>
        {carriers.map((carrier) => (
          <option key={carrier.id} value={carrier.id}>
            {getCarrierOptionLabel(carrier)}
          </option>
        ))}
      </FormSelect>
      <FormSelect
        label="기종"
        name="deviceModelId"
        defaultValue={initialItem?.deviceModelId ?? ""}
        required
      >
        <option value="">기종을 선택해 주세요</option>
        {deviceModels.map((deviceModel) => (
          <option key={deviceModel.id} value={deviceModel.id}>
            {getDeviceModelOptionLabel(deviceModel)}
          </option>
        ))}
      </FormSelect>
      <FormSelect
        defaultValue={initialItem?.color ?? ""}
        helper="색상은 기초정보 > 색상 관리에서 등록할 수 있습니다."
        label="색상"
        name="color"
        required
      >
        <option value="">
          {colorOptions.length > 0 ? "색상을 선택해 주세요" : "먼저 색상을 등록해 주세요"}
        </option>
        {colorOptions.map((color) => (
          <option key={color.id} value={color.name}>
            {getColorOptionLabel(color)}
          </option>
        ))}
      </FormSelect>
      <FormSelect
        defaultValue={initialItem?.capacity ?? ""}
        label="용량"
        name="capacity"
        required
      >
        <option value="">용량을 선택해 주세요</option>
        {capacityOptions.map((capacity) => (
          <option key={capacity} value={capacity}>
            {capacity}
          </option>
        ))}
      </FormSelect>
      <FormField
        autoComplete="off"
        defaultValue={initialItem?.serialNumber ?? ""}
        label="S/N"
        name="serialNumber"
        placeholder="SN-S25-001"
        required
      />
      <ModelNumberField
        autoComplete="off"
        defaultValue={initialItem?.modelNumber ?? ""}
        label="Model No."
        name="modelNumber"
        placeholder="SM-3028RKSPEW"
        required
      />
      <CurrencyField
        defaultValue={initialItem?.costAmount ?? ""}
        label="입고가"
        name="costAmount"
        placeholder="912000"
        required
      />
      <FormSelect
        label="상태"
        name="status"
        defaultValue={initialItem?.status ?? "IN_STOCK"}
        required
      >
        <option value="IN_STOCK">입고</option>
        <option value="RESERVED">예약</option>
        <option value="SOLD">판매</option>
        <option value="RETURNED">반품</option>
        <option value="DISCARDED">폐기</option>
      </FormSelect>
      <FormField
        defaultValue={defaultReceivedAt}
        label="입고일"
        name="receivedAt"
        required
        type="date"
      />
      <FormSelect
        label="담당자"
        name="assigneeId"
        defaultValue={initialItem ? (initialItem.assigneeId ?? "") : currentUserId}
      >
        <option value="">미배정</option>
        {staffMembers.map((staff) => (
          <option key={staff.id} value={staff.id}>
            {staff.displayName} / {staff.roleLabel}
          </option>
        ))}
      </FormSelect>
      <FormTextArea
        defaultValue={initialItem?.notes ?? ""}
        label="메모"
        name="notes"
        placeholder="박스 이상 유무, 진열 메모"
        rows={3}
        wrapperClassName="md:col-span-2"
      />
      <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {initialItem
            ? `판매 화면 ${
                initialItem.status === "IN_STOCK" && !initialItem.isHidden
                  ? "노출"
                  : "제외"
              }`
            : "필수 항목 저장 후 목록에 즉시 반영됩니다."}
        </p>
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}

function InventoryVisibilityToggle({ item }: { item: InventoryItemRecord }) {
  return (
    <div className="flex justify-end">
      <form action={toggleInventoryItemHiddenAction}>
        <input name="id" type="hidden" value={item.id} />
        <input
          name="nextHidden"
          type="hidden"
          value={item.isHidden ? "false" : "true"}
        />
        <ConfirmSubmitButton
          className={`${secondaryButtonClassName} h-10 px-4`}
          confirmMessage={
            item.isHidden
              ? "이 재고를 다시 판매 화면에 노출하시겠습니까?"
              : "이 재고를 판매 화면에서 숨기시겠습니까?"
          }
        >
          {item.isHidden ? "숨김 해제" : "판매 화면에서 숨기기"}
        </ConfirmSubmitButton>
      </form>
    </div>
  );
}

export function InventoryOverview({
  currentUserId,
  stores,
  carriers,
  colors,
  deviceModels,
  staffMembers,
  items,
  filters,
  pagination,
  metrics,
  notice,
}: InventoryOverviewProps) {
  const [modalState, setModalState] = useState<InventoryModalState>(null);
  const filterFormRef = useRef<HTMLFormElement | null>(null);

  const manufacturerOptions = getManufacturerOptions(deviceModels);
  const activeItem =
    modalState && modalState.mode !== "create"
      ? items.find((item) => item.id === modalState.itemId) ?? null
      : null;

  function closeModal() {
    setModalState(null);
  }

  function submitFilters() {
    filterFormRef.current?.requestSubmit();
  }

  return (
    <div className="flex flex-col gap-4 p-3 sm:p-4 2xl:p-5">
      <PageIntro
        eyebrow="Inventory"
        title="재고 관리"
        className="shrink-0"
        actions={
          <>
            <button
              className={`${primaryButtonClassName} h-10 px-4`}
              onClick={() => setModalState({ mode: "create" })}
              type="button"
            >
              신규 재고 등록
            </button>
            <ActionChip label={`판매 가능 ${metrics.availableCount}대`} tone="dark" />
            <ActionChip label={`숨김 ${metrics.hiddenCount}대`} />
          </>
        }
      />

      <section className="grid shrink-0 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          accent="amber"
          helper="등록된 전체 단말 수"
          label="전체 재고"
          value={`${metrics.totalCount}대`}
        />
        <MetricCard
          accent="teal"
          helper="즉시 판매 가능한 재고"
          label="판매 가능"
          value={`${metrics.availableCount}대`}
        />
        <MetricCard
          accent="slate"
          helper={`예약 ${metrics.reservedCount}대 / 판매 ${metrics.soldCount}대`}
          label="예약 / 판매"
          value={`${metrics.reservedCount + metrics.soldCount}대`}
        />
        <MetricCard
          accent="slate"
          helper="판매 화면에서 제외된 재고"
          label="숨김 처리"
          value={`${metrics.hiddenCount}대`}
        />
        <MetricCard
          accent="amber"
          helper="14일 이상 미판매 재고"
          label="장기 보유"
          value={`${metrics.longHeldCount}대`}
        />
      </section>

      {notice ? <NoticeBanner message={noticeMessageMap[notice]} /> : null}

      <Panel title="필터" className="relative z-20 shrink-0">
        <div className={`${surfaceClassName} space-y-3`}>
          <div className="flex flex-wrap gap-2">
            {filters.carrierId ? (
              <TonePill label="통신사 필터 적용" tone="teal" />
            ) : null}
            {filters.manufacturer ? (
              <TonePill label={`제조사 ${filters.manufacturer}`} tone="teal" />
            ) : null}
            {filters.status !== "ALL" ? (
              <TonePill label={`상태 ${getStatusLabel(filters.status)}`} tone="amber" />
            ) : null}
            {filters.assigneeId ? (
              <TonePill
                label={
                  filters.assigneeId === "unassigned"
                    ? "담당자 미배정"
                    : "담당자 필터 적용"
                }
                tone="slate"
              />
            ) : null}
            {filters.visibility !== "all" ? (
              <TonePill
                label={filters.visibility === "hidden" ? "숨김만" : "표시만"}
                tone="slate"
              />
            ) : null}
          </div>

          <form
            ref={filterFormRef}
            method="get"
            className="grid gap-3 md:grid-cols-2 xl:grid-cols-[repeat(5,minmax(0,0.9fr))_auto]"
          >
            <FormSelect
              label="통신사"
              name="carrierId"
              defaultValue={filters.carrierId}
              onChange={submitFilters}
            >
              <option value="">전체 통신사</option>
              {carriers.map((carrier) => (
                <option key={carrier.id} value={carrier.id}>
                  {carrier.name}
                </option>
              ))}
            </FormSelect>
            <FormSelect
              label="제조사"
              name="manufacturer"
              defaultValue={filters.manufacturer}
              onChange={submitFilters}
            >
              <option value="">전체 제조사</option>
              {manufacturerOptions.map((manufacturer) => (
                <option key={manufacturer} value={manufacturer}>
                  {manufacturer}
                </option>
              ))}
            </FormSelect>
            <FormSelect
              label="상태"
              name="status"
              defaultValue={filters.status}
              onChange={submitFilters}
            >
              <option value="ALL">전체 상태</option>
              <option value="IN_STOCK">입고</option>
              <option value="RESERVED">예약</option>
              <option value="SOLD">판매</option>
              <option value="RETURNED">반품</option>
              <option value="DISCARDED">폐기</option>
            </FormSelect>
            <FormSelect
              label="담당자"
              name="assigneeId"
              defaultValue={filters.assigneeId}
              onChange={submitFilters}
            >
              <option value="">전체 담당자</option>
              <option value="unassigned">미배정</option>
              {staffMembers.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.displayName}
                </option>
              ))}
            </FormSelect>
            <FormSelect
              label="가시성"
              name="visibility"
              defaultValue={filters.visibility}
              onChange={submitFilters}
            >
              <option value="all">전체</option>
              <option value="visible">표시만</option>
              <option value="hidden">숨김만</option>
            </FormSelect>
            <div className="hidden xl:block" aria-hidden="true" />
          </form>
        </div>
      </Panel>

      <Panel title="재고 목록" actions={<InventoryLegend />} contentClassName="space-y-3">
        <ListPaginationControls
          buildHref={(page) => buildInventoryHref(filters, page)}
          itemLabel="대"
          pagination={pagination}
        />

        {items.length > 0 ? (
          <div className="overflow-x-auto rounded-[1.1rem] border border-stone-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-stone-50 text-[0.7rem] uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">재고</th>
                  <th className="px-4 py-3 font-semibold">상태</th>
                  <th className="px-4 py-3 font-semibold">S/N</th>
                  <th className="px-4 py-3 font-semibold">Model No.</th>
                  <th className="px-4 py-3 font-semibold">담당자</th>
                  <th className="px-4 py-3 font-semibold">입고일</th>
                  <th className="px-4 py-3 text-right font-semibold">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 bg-white">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-stone-50/70">
                    <td className="px-4 py-3.5 align-top">
                      <div className="space-y-1">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <CarrierInlineLabel className="shrink-0" label={item.carrierName} />
                          <p className="min-w-0 truncate font-semibold text-slate-950">
                            {getItemModelLabel(item)}
                          </p>
                        </div>
                        <p className="text-xs text-slate-500">
                          {item.storeName} / {item.color} / {item.capacity}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 align-top">
                      <div className="flex flex-wrap gap-2">
                        <TonePill
                          label={getStatusLabel(item.status)}
                          tone={inventoryToneMap[item.status]}
                        />
                        <TonePill
                          label={getAvailabilityLabel(item)}
                          tone={getAvailabilityTone(item)}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3.5 align-top font-mono text-slate-700 [font-variant-numeric:tabular-nums]">
                      {item.serialNumber}
                    </td>
                    <td className="px-4 py-3.5 align-top text-slate-600">
                      {item.modelNumber}
                    </td>
                    <td className="px-4 py-3.5 align-top text-slate-600">
                      {item.assigneeName ?? "미배정"}
                    </td>
                    <td className="px-4 py-3.5 align-top text-slate-600">
                      {formatKstDate(item.receivedAt)}
                    </td>
                    <td className="px-4 py-3.5 align-top">
                      <div className="flex justify-end gap-2">
                        <ActionIconButton
                          icon={<DetailIcon />}
                          label={`${getItemModelLabel(item)} 상세 보기`}
                          onClick={() =>
                            setModalState({ mode: "detail", itemId: item.id })
                          }
                          tone="amber"
                        />
                        <ActionIconButton
                          icon={<EditIcon />}
                          label={`${getItemModelLabel(item)} 수정`}
                          onClick={() =>
                            setModalState({ mode: "edit", itemId: item.id })
                          }
                          tone="teal"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="현재 조건에 맞는 재고가 없습니다." />
        )}
      </Panel>

      {modalState?.mode === "create" ? (
        <WorkspaceModalShell
          contentClassName="sm:px-6"
          maxWidthClassName="max-w-4xl"
          onClose={closeModal}
          subtitle="New Inventory"
          title="신규 재고 등록"
        >
          <InventoryItemForm
            carriers={carriers}
            colors={colors}
            currentUserId={currentUserId}
            deviceModels={deviceModels}
            staffMembers={staffMembers}
            stores={stores}
            submitLabel="재고 등록"
          />
        </WorkspaceModalShell>
      ) : null}

      {modalState?.mode === "detail" && activeItem ? (
        <WorkspaceModalShell
          contentClassName="sm:px-6"
          maxWidthClassName="max-w-3xl"
          onClose={closeModal}
          subtitle="Inventory Detail"
          title="재고 상세 보기"
        >
          <div className="space-y-4">
            <article className={surfaceClassName}>
              <div className="flex flex-wrap items-center gap-2">
                <CarrierInlineLabel label={activeItem.carrierName} />
                <p className="text-lg font-semibold text-slate-950">
                  {getItemModelLabel(activeItem)}
                </p>
                <TonePill
                  label={getStatusLabel(activeItem.status)}
                  tone={inventoryToneMap[activeItem.status]}
                />
                <TonePill
                  label={getAvailabilityLabel(activeItem)}
                  tone={getAvailabilityTone(activeItem)}
                />
                {activeItem.isHidden ? <TonePill label="숨김" tone="slate" /> : null}
              </div>

              <div className="mt-4 rounded-[1rem] border border-stone-200 bg-white/90 px-4 py-3">
                <InfoRow label="매장" value={activeItem.storeName} />
                <InfoRow label="S/N" value={activeItem.serialNumber} />
                <InfoRow label="Model No." value={activeItem.modelNumber} />
                <InfoRow label="입고일" value={formatKstDate(activeItem.receivedAt)} />
                <InfoRow
                  label="출고 기록"
                  value={
                    activeItem.dispatchedAt
                      ? formatKstDate(activeItem.dispatchedAt)
                      : "없음"
                  }
                />
                <InfoRow
                  label="담당자"
                  value={activeItem.assigneeName ?? "미배정"}
                />
                <InfoRow label="입고가" value={formatWon(activeItem.costAmount)} />
                <InfoRow
                  label="메모"
                  value={activeItem.notes?.trim() ? activeItem.notes : "없음"}
                />
              </div>
            </article>

            <div className="flex justify-end">
              <button
                className={`${secondaryButtonClassName} h-10 px-4`}
                onClick={() => setModalState({ mode: "edit", itemId: activeItem.id })}
                type="button"
              >
                이 재고 수정
              </button>
            </div>
          </div>
        </WorkspaceModalShell>
      ) : null}

      {modalState?.mode === "edit" && activeItem ? (
        <WorkspaceModalShell
          contentClassName="sm:px-6"
          maxWidthClassName="max-w-4xl"
          onClose={closeModal}
          subtitle="Inventory Edit"
          title="재고 수정"
        >
          <div className="space-y-4">
            <InventoryItemForm
              carriers={carriers}
              colors={colors}
              currentUserId={currentUserId}
              deviceModels={deviceModels}
              initialItem={activeItem}
              staffMembers={staffMembers}
              stores={stores}
              submitLabel="수정 저장"
            />
            <InventoryVisibilityToggle item={activeItem} />
          </div>
        </WorkspaceModalShell>
      ) : null}
    </div>
  );
}
