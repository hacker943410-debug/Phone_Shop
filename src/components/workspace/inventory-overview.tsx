import {
  toggleInventoryItemHiddenAction,
  upsertInventoryItemAction,
} from "@/app/actions/inventory";
import {
  EmptyState,
  FormField,
  FormSelect,
  FormTextArea,
  SubmitButton,
} from "@/components/workspace/admin-form-controls";
import {
  ActionChip,
  MetricCard,
  PageIntro,
  Panel,
  TonePill,
} from "@/components/workspace/workspace-primitives";
import { formatKstDate } from "@/lib/date-utils";
import { formatWon } from "@/lib/formatters";

type InventoryStatusValue =
  | "IN_STOCK"
  | "RESERVED"
  | "SOLD"
  | "RETURNED"
  | "DISCARDED";

type InventoryVisibilityFilter = "all" | "visible" | "hidden";

const editorCardClassName =
  "rounded-[1.35rem] border border-slate-950/8 bg-stone-50/85 p-4 shadow-[0_12px_36px_-30px_rgba(15,23,42,0.35)]";

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
  "duplicate-imei": "같은 IMEI 재고가 이미 존재합니다. 번호를 다시 확인해 주세요.",
  "invalid-inventory-form": "재고 등록/수정에 필요한 값이 비어 있습니다.",
  "inventory-not-found": "대상 재고를 찾지 못했습니다. 목록을 새로고침한 뒤 다시 시도해 주세요.",
} as const;

export interface InventoryCarrierOption {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
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
  carriers: InventoryCarrierOption[];
  deviceModels: InventoryDeviceModelOption[];
  staffMembers: InventoryStaffOption[];
  items: InventoryItemRecord[];
  filters: InventoryFilters;
  metrics: InventoryMetrics;
  notice: keyof typeof noticeMessageMap | null;
}

function getStatusLabel(status: InventoryStatusValue) {
  return inventoryStatusLabelMap[status];
}

function getCarrierOptionLabel(carrier: InventoryCarrierOption) {
  return carrier.isActive ? carrier.name : `${carrier.name} (비활성)`;
}

function getDeviceModelOptionLabel(deviceModel: InventoryDeviceModelOption) {
  const baseLabel = deviceModel.manufacturer
    ? `${deviceModel.manufacturer} ${deviceModel.name}`
    : deviceModel.name;

  return deviceModel.isActive ? baseLabel : `${baseLabel} (비활성)`;
}

function getAvailabilityLabel(item: InventoryItemRecord) {
  if (item.isHidden) {
    return "판매 화면 제외";
  }

  return item.status === "IN_STOCK" ? "판매 가능" : "판매 불가";
}

function getAvailabilityTone(item: InventoryItemRecord) {
  if (item.isHidden) {
    return "slate";
  }

  return item.status === "IN_STOCK" ? "teal" : "amber";
}

export function InventoryOverview({
  currentUserId,
  carriers,
  deviceModels,
  staffMembers,
  items,
  filters,
  metrics,
  notice,
}: InventoryOverviewProps) {
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageIntro
        eyebrow="Inventory"
        title="IMEI 기준 재고를 실제로 등록하고 판매 가능 상태만 분리합니다."
        description="재고 등록, 검색, 상태 관리, 숨김 처리를 실제 DB에 연결했습니다. 판매 화면은 이제 숨기지 않은 `입고` 상태 재고만 선택 기준으로 읽어 올 준비가 되어 있습니다."
        actions={
          <>
            <ActionChip label={`판매 가능 ${metrics.availableCount}대`} tone="dark" />
            <ActionChip label="IMEI 중복 방지" />
          </>
        }
      />

      {notice ? (
        <section className="rounded-[1.4rem] border border-rose-200 bg-rose-50/85 px-5 py-4 text-sm leading-6 text-rose-900">
          {noticeMessageMap[notice]}
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="전체 재고"
          value={`${metrics.totalCount}대`}
          helper="숨김 여부와 관계없이 등록된 재고 수"
          accent="amber"
        />
        <MetricCard
          label="판매 가능"
          value={`${metrics.availableCount}대`}
          helper="판매 화면 선택 대상: 숨김 아님 + 입고 상태"
          accent="teal"
        />
        <MetricCard
          label="예약 / 판매"
          value={`${metrics.reservedCount + metrics.soldCount}대`}
          helper={`예약 ${metrics.reservedCount}대, 판매/반품/폐기 ${metrics.soldCount}대`}
          accent="slate"
        />
        <MetricCard
          label="숨김 처리"
          value={`${metrics.hiddenCount}대`}
          helper="장부 이력은 유지하되 판매 화면에서는 제외된 재고"
          accent="slate"
        />
        <MetricCard
          label="장기 보유"
          value={`${metrics.longHeldCount}대`}
          helper="14일 이상 판매되지 않은 가용 재고"
          accent="amber"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <Panel
          title="재고 등록"
          description="새 단말을 등록할 때는 IMEI, 입고일, 상태를 먼저 확정합니다."
        >
          <form
            action={upsertInventoryItemAction}
            className={`${editorCardClassName} ${formGridClassName}`}
          >
            <FormSelect label="통신사" name="carrierId" required>
              <option value="">통신사를 선택하세요</option>
              {carriers.map((carrier) => (
                <option key={carrier.id} value={carrier.id}>
                  {getCarrierOptionLabel(carrier)}
                </option>
              ))}
            </FormSelect>
            <FormSelect label="단말기" name="deviceModelId" required>
              <option value="">단말기를 선택하세요</option>
              {deviceModels.map((deviceModel) => (
                <option key={deviceModel.id} value={deviceModel.id}>
                  {getDeviceModelOptionLabel(deviceModel)}
                </option>
              ))}
            </FormSelect>
            <FormField
              label="색상"
              name="color"
              placeholder="예: Titanium Gray"
              autoComplete="off"
              required
            />
            <FormField
              label="용량"
              name="capacity"
              placeholder="예: 256GB"
              autoComplete="off"
              required
            />
            <FormField
              label="IMEI"
              name="imei"
              inputMode="numeric"
              placeholder="숫자만 입력"
              autoComplete="off"
              required
            />
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
              <option value="">미지정</option>
              {staffMembers.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.displayName} · {staff.roleLabel}
                </option>
              ))}
            </FormSelect>
            <FormTextArea
              label="메모"
              name="notes"
              wrapperClassName="md:col-span-2"
              placeholder="박스 손상 여부, 진열 메모 등"
              rows={3}
            />
            <div className="md:col-span-2 flex justify-end">
              <SubmitButton label="재고 등록" />
            </div>
          </form>
        </Panel>

        <Panel
          title="재고 검색 / 필터"
          description="IMEI, 모델명, 통신사, 담당자, 상태 기준으로 현재 목록을 걸러 봅니다."
        >
          <form method="get" className={`${editorCardClassName} ${formGridClassName}`}>
            <FormField
              label="검색어"
              name="q"
              defaultValue={filters.q}
              placeholder="IMEI, 모델, 통신사"
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
              <option value="unassigned">미지정</option>
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
            <div className="md:col-span-2 flex flex-wrap items-center justify-end gap-2">
              <a
                href="/inventory"
                className="inline-flex items-center justify-center rounded-full border border-slate-950/12 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                필터 초기화
              </a>
              <SubmitButton label="필터 적용" />
            </div>
          </form>
        </Panel>
      </section>

      <Panel
        title="재고 목록"
        description={`현재 조건에 맞는 재고 ${items.length}대를 보여줍니다. 수정 저장 시 상태에 따라 판매 가능 여부가 바로 바뀝니다.`}
      >
        <div className="space-y-3">
          {items.length > 0 ? (
            items.map((item) => (
              <article key={item.id} className={editorCardClassName}>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-base font-semibold text-slate-950">
                    {item.carrierName} · {item.deviceModelName}
                  </p>
                  <TonePill
                    label={getStatusLabel(item.status)}
                    tone={inventoryToneMap[item.status]}
                  />
                  <TonePill
                    label={getAvailabilityLabel(item)}
                    tone={getAvailabilityTone(item)}
                  />
                  {item.isHidden ? <TonePill label="숨김" tone="slate" /> : null}
                </div>

                <div className="mt-3 grid gap-3 text-sm text-slate-500 md:grid-cols-2 xl:grid-cols-4">
                  <p>IMEI {item.imei}</p>
                  <p>입고일 {formatKstDate(item.receivedAt)}</p>
                  <p>
                    출고기록 {item.dispatchedAt ? formatKstDate(item.dispatchedAt) : "없음"}
                  </p>
                  <p>담당 {item.assigneeName ?? "미지정"}</p>
                </div>

                <form
                  action={upsertInventoryItemAction}
                  className={`mt-4 ${formGridClassName}`}
                >
                  <input type="hidden" name="id" value={item.id} />
                  <FormSelect
                    label="통신사"
                    name="carrierId"
                    defaultValue={item.carrierId}
                    required
                  >
                    {carriers.map((carrier) => (
                      <option key={carrier.id} value={carrier.id}>
                        {getCarrierOptionLabel(carrier)}
                      </option>
                    ))}
                  </FormSelect>
                  <FormSelect
                    label="단말기"
                    name="deviceModelId"
                    defaultValue={item.deviceModelId}
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
                    defaultValue={item.color}
                    autoComplete="off"
                    required
                  />
                  <FormField
                    label="용량"
                    name="capacity"
                    defaultValue={item.capacity}
                    autoComplete="off"
                    required
                  />
                  <FormField
                    label="IMEI"
                    name="imei"
                    defaultValue={item.imei}
                    inputMode="numeric"
                    autoComplete="off"
                    required
                  />
                  <FormField
                    label="입고가"
                    name="costAmount"
                    type="number"
                    min="0"
                    defaultValue={item.costAmount}
                    required
                  />
                  <FormSelect
                    label="상태"
                    name="status"
                    defaultValue={item.status}
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
                    defaultValue={formatKstDate(item.receivedAt)}
                    required
                  />
                  <FormSelect
                    label="담당자"
                    name="assigneeId"
                    defaultValue={item.assigneeId ?? ""}
                  >
                    <option value="">미지정</option>
                    {staffMembers.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.displayName} · {staff.roleLabel}
                      </option>
                    ))}
                  </FormSelect>
                  <FormTextArea
                    label="메모"
                    name="notes"
                    wrapperClassName="md:col-span-2"
                    defaultValue={item.notes ?? ""}
                    rows={3}
                  />
                  <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-slate-500">
                      입고가 {formatWon(item.costAmount)} · 판매 화면{" "}
                      {item.status === "IN_STOCK" && !item.isHidden ? "노출" : "제외"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <SubmitButton label="수정 저장" />
                    </div>
                  </div>
                </form>

                <div className="mt-3 flex justify-end">
                  <form action={toggleInventoryItemHiddenAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <input
                      type="hidden"
                      name="nextHidden"
                      value={item.isHidden ? "false" : "true"}
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center rounded-full border border-slate-950/12 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      {item.isHidden ? "숨김 해제" : "판매 화면에서 숨기기"}
                    </button>
                  </form>
                </div>
              </article>
            ))
          ) : (
            <EmptyState message="현재 조건에 맞는 재고가 없습니다." />
          )}
        </div>
      </Panel>
    </div>
  );
}
