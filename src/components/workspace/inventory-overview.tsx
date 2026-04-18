import {
  toggleInventoryItemHiddenAction,
  upsertInventoryItemAction,
} from "@/app/actions/inventory";
import {
  EmptyState,
  FormField,
  FormSelect,
  FormTextArea,
  ImeiField,
  NoticeBanner,
  SubmitButton,
} from "@/components/workspace/admin-form-controls";
import { ConfirmSubmitButton } from "@/components/workspace/confirm-submit-button";
import { ListPaginationControls } from "@/components/workspace/list-pagination-controls";
import { secondaryButtonClassName } from "@/components/workspace/ui-classnames";
import {
  ActionChip,
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
  "duplicate-imei":
    "같은 IMEI 재고가 이미 존재합니다. 번호를 다시 확인해 주세요.",
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
  color: string;
  capacity: string;
  imei: string;
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
  q: string;
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
  deviceModels: InventoryDeviceModelOption[];
  staffMembers: InventoryStaffOption[];
  items: InventoryItemRecord[];
  selectedItemId: string | null;
  filters: InventoryFilters;
  pagination: PaginationState;
  metrics: InventoryMetrics;
  notice: keyof typeof noticeMessageMap | null;
}

function getStatusLabel(status: InventoryStatusValue) {
  return inventoryStatusLabelMap[status];
}

function getCarrierOptionLabel(carrier: InventoryCarrierOption) {
  return carrier.isActive ? carrier.name : `${carrier.name} (비활성)`;
}

function getStoreOptionLabel(store: InventoryStoreOption) {
  return store.isDefault ? `${store.name} (기본)` : store.name;
}

function getDeviceModelOptionLabel(deviceModel: InventoryDeviceModelOption) {
  const baseLabel = deviceModel.manufacturer
    ? `${deviceModel.manufacturer} ${deviceModel.name}`
    : deviceModel.name;

  return deviceModel.isActive ? baseLabel : `${baseLabel} (비활성)`;
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

function appendInventoryFilterParams(
  searchParams: URLSearchParams,
  filters: InventoryFilters,
) {
  if (filters.q) {
    searchParams.set("q", filters.q);
  }

  if (filters.status !== "ALL") {
    searchParams.set("status", filters.status);
  }

  if (filters.carrierId) {
    searchParams.set("carrierId", filters.carrierId);
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

function buildInventoryItemHref(
  filters: InventoryFilters,
  page: number,
  itemId: string,
) {
  const searchParams = new URLSearchParams();

  appendInventoryFilterParams(searchParams, filters);

  if (page > 1) {
    searchParams.set("page", String(page));
  }

  searchParams.set("itemId", itemId);

  return `/inventory?${searchParams.toString()}`;
}

export function InventoryOverview({
  currentUserId,
  stores,
  carriers,
  deviceModels,
  staffMembers,
  items,
  selectedItemId,
  filters,
  pagination,
  metrics,
  notice,
}: InventoryOverviewProps) {
  const selectedItem = items.find((item) => item.id === selectedItemId) ?? null;

  return (
    <div className="flex flex-col gap-4 p-3 sm:p-4 2xl:p-5">
      <PageIntro
        eyebrow="Inventory"
        title="재고 관리"
        className="shrink-0"
        actions={
          <>
            <ActionChip label={`판매 가능 ${metrics.availableCount}대`} tone="dark" />
            <ActionChip label={`숨김 ${metrics.hiddenCount}대`} />
          </>
        }
      />

      <section className="grid shrink-0 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="전체 재고"
          value={`${metrics.totalCount}대`}
          helper="등록된 전체 단말 수"
          accent="amber"
        />
        <MetricCard
          label="판매 가능"
          value={`${metrics.availableCount}대`}
          helper="즉시 판매 가능한 재고"
          accent="teal"
        />
        <MetricCard
          label="예약 / 판매"
          value={`${metrics.reservedCount + metrics.soldCount}대`}
          helper={`예약 ${metrics.reservedCount}대 / 판매 ${metrics.soldCount}대`}
          accent="slate"
        />
        <MetricCard
          label="숨김 처리"
          value={`${metrics.hiddenCount}대`}
          helper="판매 화면에서 제외된 재고"
          accent="slate"
        />
        <MetricCard
          label="장기 보유"
          value={`${metrics.longHeldCount}대`}
          helper="14일 이상 미판매 재고"
          accent="amber"
        />
      </section>

      {notice ? <NoticeBanner message={noticeMessageMap[notice]} /> : null}

      <Panel title="필터" className="relative z-20 shrink-0">
        <div className={`${surfaceClassName} space-y-3`}>
          <div className="flex flex-wrap gap-2">
            {filters.q ? <TonePill label={`검색 ${filters.q}`} tone="slate" /> : null}
            {filters.status !== "ALL" ? (
              <TonePill label={`상태 ${getStatusLabel(filters.status)}`} tone="amber" />
            ) : null}
            {filters.carrierId ? (
              <TonePill label="통신사 필터 적용" tone="teal" />
            ) : null}
            {filters.assigneeId ? (
              <TonePill label="담당자 필터 적용" tone="teal" />
            ) : null}
            {filters.visibility !== "all" ? (
              <TonePill
                label={filters.visibility === "hidden" ? "숨김만" : "표시만"}
                tone="slate"
              />
            ) : null}
          </div>

          <form
            method="get"
            className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.2fr)_repeat(4,minmax(0,0.8fr))_auto]"
          >
            <FormField
              label="검색어"
              name="q"
              defaultValue={filters.q}
              placeholder="IMEI, 기종, 색상"
              autoComplete="off"
            />
            <FormSelect label="상태" name="status" defaultValue={filters.status}>
              <option value="ALL">전체 상태</option>
              <option value="IN_STOCK">입고</option>
              <option value="RESERVED">예약</option>
              <option value="SOLD">판매</option>
              <option value="RETURNED">반품</option>
              <option value="DISCARDED">폐기</option>
            </FormSelect>
            <FormSelect
              label="통신사"
              name="carrierId"
              defaultValue={filters.carrierId}
            >
              <option value="">전체 통신사</option>
              {carriers.map((carrier) => (
                <option key={carrier.id} value={carrier.id}>
                  {carrier.name}
                </option>
              ))}
            </FormSelect>
            <FormSelect
              label="담당자"
              name="assigneeId"
              defaultValue={filters.assigneeId}
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
            >
              <option value="all">전체</option>
              <option value="visible">표시만</option>
              <option value="hidden">숨김만</option>
            </FormSelect>
            <div className="flex flex-wrap items-end justify-end gap-2">
              <a href="/inventory" className={`${secondaryButtonClassName} h-10 px-4`}>
                초기화
              </a>
              <SubmitButton label="적용" />
            </div>
          </form>
        </div>
      </Panel>

      <details className="group shrink-0 rounded-[1.4rem] border border-stone-200 bg-white/90 shadow-[0_16px_32px_-30px_rgba(15,23,42,0.22)]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-sm font-semibold text-slate-900 marker:hidden sm:px-5">
          <span>신규 재고 등록</span>
          <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[0.7rem] font-semibold text-slate-500 transition group-open:bg-amber-50 group-open:text-amber-800">
            펼치기
          </span>
        </summary>
        <div className="border-t border-stone-200 px-4 pb-4 pt-4 sm:px-5">
          <form
            action={upsertInventoryItemAction}
            className={`${surfaceClassName} ${formGridClassName}`}
          >
            <FormSelect label="매장" name="storeId" required defaultValue={stores[0]?.id ?? ""}>
              <option value="">매장을 선택해 주세요</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {getStoreOptionLabel(store)}
                </option>
              ))}
            </FormSelect>
            <FormSelect label="통신사" name="carrierId" required>
              <option value="">통신사를 선택해 주세요</option>
              {carriers.map((carrier) => (
                <option key={carrier.id} value={carrier.id}>
                  {getCarrierOptionLabel(carrier)}
                </option>
              ))}
            </FormSelect>
            <FormSelect label="기종" name="deviceModelId" required>
              <option value="">기종을 선택해 주세요</option>
              {deviceModels.map((deviceModel) => (
                <option key={deviceModel.id} value={deviceModel.id}>
                  {getDeviceModelOptionLabel(deviceModel)}
                </option>
              ))}
            </FormSelect>
            <FormField label="색상" name="color" placeholder="Titanium Gray" autoComplete="off" required />
            <FormField label="용량" name="capacity" placeholder="256GB" autoComplete="off" required />
            <ImeiField label="IMEI" name="imei" placeholder="숫자만 입력" autoComplete="off" required />
            <FormField
              label="입고가"
              name="costAmount"
              type="number"
              min="0"
              placeholder="912000"
              required
            />
            <FormSelect label="상태" name="status" defaultValue="IN_STOCK" required>
              <option value="IN_STOCK">입고</option>
              <option value="RESERVED">예약</option>
              <option value="SOLD">판매</option>
              <option value="RETURNED">반품</option>
              <option value="DISCARDED">폐기</option>
            </FormSelect>
            <FormField
              label="입고일"
              name="receivedAt"
              type="date"
              defaultValue={formatKstDate(new Date())}
              required
            />
            <FormSelect
              label="담당자"
              name="assigneeId"
              defaultValue={currentUserId}
            >
              <option value="">미배정</option>
              {staffMembers.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.displayName} / {staff.roleLabel}
                </option>
              ))}
            </FormSelect>
            <FormTextArea
              label="메모"
              name="notes"
              wrapperClassName="md:col-span-2"
              placeholder="박스 이상 유무, 진열 메모"
              rows={3}
            />
            <div className="md:col-span-2 flex justify-end">
              <SubmitButton label="재고 등록" />
            </div>
          </form>
        </div>
      </details>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] xl:items-start">
        <Panel
          title="재고 목록"
          contentClassName="space-y-3"
        >
          <ListPaginationControls
            pagination={pagination}
            itemLabel="대"
            buildHref={(page) => buildInventoryHref(filters, page)}
          />

          {items.length > 0 ? (
            <div className="overflow-x-auto rounded-[1.1rem] border border-stone-200">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-stone-50 text-[0.7rem] uppercase tracking-[0.18em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">재고</th>
                    <th className="px-4 py-3 font-semibold">상태</th>
                    <th className="px-4 py-3 font-semibold">IMEI</th>
                    <th className="px-4 py-3 font-semibold">담당자</th>
                    <th className="px-4 py-3 font-semibold">입고일</th>
                    <th className="px-4 py-3 text-right font-semibold">선택</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 bg-white">
                  {items.map((item) => {
                    const isSelected = selectedItem?.id === item.id;

                    return (
                      <tr
                        key={item.id}
                        className={
                          isSelected ? "bg-blue-50/70" : "hover:bg-stone-50/70"
                        }
                      >
                        <td className="px-4 py-3.5 align-top">
                          <div className="space-y-1">
                            <p className="font-semibold text-slate-950">
                              {item.carrierName} / {item.deviceModelName}
                            </p>
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
                          {item.imei}
                        </td>
                        <td className="px-4 py-3.5 align-top text-slate-600">
                          {item.assigneeName ?? "미배정"}
                        </td>
                        <td className="px-4 py-3.5 align-top text-slate-600">
                          {formatKstDate(item.receivedAt)}
                        </td>
                        <td className="px-4 py-3.5 text-right align-top">
                          <a
                            href={buildInventoryItemHref(filters, pagination.page, item.id)}
                            className={[
                              `${secondaryButtonClassName} h-9 px-3.5`,
                              isSelected
                                ? "border-blue-700 bg-blue-700 text-white hover:border-blue-800 hover:bg-blue-800"
                                : "",
                            ].join(" ")}
                          >
                            {isSelected ? "선택됨" : "보기"}
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState message="현재 조건에 맞는 재고가 없습니다." />
          )}
        </Panel>

        <Panel
          title="재고 상세 / 수정"
          contentClassName="space-y-4"
        >
          {selectedItem ? (
            <div className="space-y-4">
              <article className={surfaceClassName}>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-semibold text-slate-950">
                    {selectedItem.carrierName} / {selectedItem.deviceModelName}
                  </p>
                  <TonePill
                    label={getStatusLabel(selectedItem.status)}
                    tone={inventoryToneMap[selectedItem.status]}
                  />
                  <TonePill
                    label={getAvailabilityLabel(selectedItem)}
                    tone={getAvailabilityTone(selectedItem)}
                  />
                  {selectedItem.isHidden ? <TonePill label="숨김" tone="slate" /> : null}
                </div>
                <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                  <p>매장 {selectedItem.storeName}</p>
                  <p>IMEI {selectedItem.imei}</p>
                  <p>입고일 {formatKstDate(selectedItem.receivedAt)}</p>
                  <p>
                    출고 기록{" "}
                    {selectedItem.dispatchedAt
                      ? formatKstDate(selectedItem.dispatchedAt)
                      : "없음"}
                  </p>
                  <p>담당자 {selectedItem.assigneeName ?? "미배정"}</p>
                  <p>입고가 {formatWon(selectedItem.costAmount)}</p>
                </div>
              </article>

              <form
                action={upsertInventoryItemAction}
                className={`${surfaceClassName} ${formGridClassName}`}
              >
                <input type="hidden" name="id" value={selectedItem.id} />
                <FormSelect
                  label="매장"
                  name="storeId"
                  defaultValue={selectedItem.storeId ?? stores[0]?.id ?? ""}
                  required
                >
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {getStoreOptionLabel(store)}
                    </option>
                  ))}
                </FormSelect>
                <FormSelect
                  label="통신사"
                  name="carrierId"
                  defaultValue={selectedItem.carrierId}
                  required
                >
                  {carriers.map((carrier) => (
                    <option key={carrier.id} value={carrier.id}>
                      {getCarrierOptionLabel(carrier)}
                    </option>
                  ))}
                </FormSelect>
                <FormSelect
                  label="기종"
                  name="deviceModelId"
                  defaultValue={selectedItem.deviceModelId}
                  required
                >
                  {deviceModels.map((deviceModel) => (
                    <option key={deviceModel.id} value={deviceModel.id}>
                      {getDeviceModelOptionLabel(deviceModel)}
                    </option>
                  ))}
                </FormSelect>
                <FormField
                  label="색상"
                  name="color"
                  defaultValue={selectedItem.color}
                  autoComplete="off"
                  required
                />
                <FormField
                  label="용량"
                  name="capacity"
                  defaultValue={selectedItem.capacity}
                  autoComplete="off"
                  required
                />
                <ImeiField
                  label="IMEI"
                  name="imei"
                  defaultValue={selectedItem.imei}
                  autoComplete="off"
                  required
                />
                <FormField
                  label="입고가"
                  name="costAmount"
                  type="number"
                  min="0"
                  defaultValue={selectedItem.costAmount}
                  required
                />
                <FormSelect
                  label="상태"
                  name="status"
                  defaultValue={selectedItem.status}
                  required
                >
                  <option value="IN_STOCK">입고</option>
                  <option value="RESERVED">예약</option>
                  <option value="SOLD">판매</option>
                  <option value="RETURNED">반품</option>
                  <option value="DISCARDED">폐기</option>
                </FormSelect>
                <FormField
                  label="입고일"
                  name="receivedAt"
                  type="date"
                  defaultValue={formatKstDate(selectedItem.receivedAt)}
                  required
                />
                <FormSelect
                  label="담당자"
                  name="assigneeId"
                  defaultValue={selectedItem.assigneeId ?? ""}
                >
                  <option value="">미배정</option>
                  {staffMembers.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.displayName} / {staff.roleLabel}
                    </option>
                  ))}
                </FormSelect>
                <FormTextArea
                  label="메모"
                  name="notes"
                  wrapperClassName="md:col-span-2"
                  defaultValue={selectedItem.notes ?? ""}
                  rows={3}
                />
                <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-slate-500">
                    판매 화면 {selectedItem.status === "IN_STOCK" && !selectedItem.isHidden ? "노출" : "제외"}
                  </p>
                  <SubmitButton label="수정 저장" />
                </div>
              </form>

              <div className="flex justify-end">
                <form action={toggleInventoryItemHiddenAction}>
                  <input type="hidden" name="id" value={selectedItem.id} />
                  <input
                    type="hidden"
                    name="nextHidden"
                    value={selectedItem.isHidden ? "false" : "true"}
                  />
                  <ConfirmSubmitButton
                    confirmMessage={
                      selectedItem.isHidden
                        ? "이 재고를 다시 판매 화면에 노출하시겠습니까?"
                        : "이 재고를 판매 화면에서 숨기시겠습니까?"
                    }
                    className={`${secondaryButtonClassName} h-10 px-4`}
                  >
                    {selectedItem.isHidden ? "숨김 해제" : "판매 화면에서 숨기기"}
                  </ConfirmSubmitButton>
                </form>
              </div>
            </div>
          ) : (
            <EmptyState message="목록에서 재고를 선택해 주세요." />
          )}
        </Panel>
      </section>
    </div>
  );
}
