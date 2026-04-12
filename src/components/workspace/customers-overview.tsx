import { upsertCustomerAction } from "@/app/actions/customers";
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

const editorCardClassName =
  "rounded-[1.35rem] border border-slate-950/8 bg-stone-50/85 p-4 shadow-[0_12px_36px_-30px_rgba(15,23,42,0.35)]";

const formGridClassName = "grid gap-3 md:grid-cols-2";

const noticeMessageMap = {
  "duplicate-phone": "같은 연락처의 고객이 이미 존재합니다. 기존 고객을 선택해 이력을 이어 주세요.",
  "invalid-customer-form": "고객명과 연락처는 필수입니다. 입력값을 다시 확인해 주세요.",
} as const;

const receivableToneMap = {
  UNPAID: "rose",
  PARTIALLY_PAID: "amber",
  PAID: "teal",
} as const;

const receivableStatusLabelMap = {
  UNPAID: "미납",
  PARTIALLY_PAID: "부분수납",
  PAID: "완납",
} as const;

export interface CustomerCarrierOption {
  id: string;
  name: string;
  isActive: boolean;
}

export interface CustomerListRecord {
  id: string;
  name: string;
  phone: string;
  currentCarrierId: string | null;
  currentCarrierName: string | null;
  salesCount: number;
  receivableBalance: number;
  lastVisitAt: Date | null;
}

export interface CustomerSaleRecord {
  id: string;
  saleDate: Date;
  carrierName: string;
  deviceModelName: string;
  ratePlanName: string | null;
  finalSalePrice: number;
  receivableAmount: number;
  staffName: string;
}

export interface CustomerReceivableRecord {
  id: string;
  createdAt: Date;
  originalAmount: number;
  balanceAmount: number;
  status: "UNPAID" | "PARTIALLY_PAID" | "PAID";
  memo: string | null;
  saleDate: Date;
  saleSummary: string;
}

export interface SelectedCustomerRecord {
  id: string;
  name: string;
  phone: string;
  currentCarrierId: string | null;
  currentCarrierName: string | null;
  birthDate: Date | null;
  address: string | null;
  memo: string | null;
  createdAt: Date;
  sales: CustomerSaleRecord[];
  receivables: CustomerReceivableRecord[];
}

export interface CustomerFilters {
  q: string;
  carrierId: string;
  receivable: "all" | "outstanding" | "clear";
}

export interface CustomerMetrics {
  totalCount: number;
  filteredCount: number;
  outstandingCount: number;
  repeatCustomerCount: number;
  receivableBalance: number;
}

export interface CustomersOverviewProps {
  carriers: CustomerCarrierOption[];
  customers: CustomerListRecord[];
  selectedCustomer: SelectedCustomerRecord | null;
  filters: CustomerFilters;
  metrics: CustomerMetrics;
  notice: keyof typeof noticeMessageMap | null;
}

function getCarrierOptionLabel(carrier: CustomerCarrierOption) {
  return carrier.isActive ? carrier.name : `${carrier.name} (비활성)`;
}

function getReceivableStatusLabel(
  status: CustomerReceivableRecord["status"],
) {
  return receivableStatusLabelMap[status];
}

function buildCustomerHref(filters: CustomerFilters, customerId: string) {
  const searchParams = new URLSearchParams();

  if (filters.q) {
    searchParams.set("q", filters.q);
  }

  if (filters.carrierId) {
    searchParams.set("carrierId", filters.carrierId);
  }

  if (filters.receivable !== "all") {
    searchParams.set("receivable", filters.receivable);
  }

  searchParams.set("customerId", customerId);

  return `/customers?${searchParams.toString()}`;
}

export function CustomersOverview({
  carriers,
  customers,
  selectedCustomer,
  filters,
  metrics,
  notice,
}: CustomersOverviewProps) {
  const selectedCustomerBalance =
    selectedCustomer?.receivables.reduce(
      (total, receivable) => total + receivable.balanceAmount,
      0,
    ) ?? 0;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageIntro
        eyebrow="Customers"
        title="연락처 기준 고객 장부를 묶고 판매·미수금 이력을 함께 봅니다."
        description="고객 검색, 등록, 수정과 동시에 판매 이력과 미수금 흐름을 한 화면에서 확인하도록 연결했습니다. 이후 판매 등록 화면에서는 이 연락처 기준 데이터를 그대로 고객 선택 기준으로 사용할 수 있습니다."
        actions={
          <>
            <ActionChip label={`등록 고객 ${metrics.totalCount}명`} tone="dark" />
            <ActionChip label="연락처 중복 방지" />
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
          label="등록 고객"
          value={`${metrics.totalCount}명`}
          helper={`현재 조건에 맞는 결과 ${metrics.filteredCount}명`}
          accent="amber"
        />
        <MetricCard
          label="재방문 고객"
          value={`${metrics.repeatCustomerCount}명`}
          helper="판매 이력이 2건 이상 누적된 고객"
          accent="teal"
        />
        <MetricCard
          label="미수 고객 / 잔액"
          value={`${metrics.outstandingCount}명`}
          helper={`총 잔액 ${formatWon(metrics.receivableBalance)}`}
          accent="slate"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <Panel
          title={selectedCustomer ? "고객 수정" : "고객 등록"}
          description="판매 등록 전에 고객 정보를 먼저 정리하거나, 기존 고객 이력을 수정할 수 있습니다."
        >
          <form
            action={upsertCustomerAction}
            className={`${editorCardClassName} ${formGridClassName}`}
          >
            {selectedCustomer ? (
              <input type="hidden" name="id" value={selectedCustomer.id} />
            ) : null}
            <FormField
              label="고객명"
              name="name"
              defaultValue={selectedCustomer?.name ?? ""}
              autoComplete="off"
              required
            />
            <FormField
              label="연락처"
              name="phone"
              defaultValue={selectedCustomer?.phone ?? ""}
              inputMode="tel"
              placeholder="010-1234-5678"
              autoComplete="off"
              required
            />
            <FormSelect
              label="현재 통신사"
              name="currentCarrierId"
              defaultValue={selectedCustomer?.currentCarrierId ?? ""}
            >
              <option value="">미지정</option>
              {carriers.map((carrier) => (
                <option key={carrier.id} value={carrier.id}>
                  {getCarrierOptionLabel(carrier)}
                </option>
              ))}
            </FormSelect>
            <FormField
              label="생년월일"
              name="birthDate"
              type="date"
              defaultValue={
                selectedCustomer?.birthDate
                  ? formatKstDate(selectedCustomer.birthDate)
                  : ""
              }
            />
            <FormField
              label="주소"
              name="address"
              wrapperClassName="md:col-span-2"
              defaultValue={selectedCustomer?.address ?? ""}
              autoComplete="off"
              placeholder="상세 주소는 메모에 보충 가능"
            />
            <FormTextArea
              label="메모"
              name="memo"
              wrapperClassName="md:col-span-2"
              defaultValue={selectedCustomer?.memo ?? ""}
              placeholder="선호 기종, 상담 메모, 방문 메모"
              rows={4}
            />
            <div className="md:col-span-2 flex flex-wrap items-center justify-end gap-2">
              {selectedCustomer ? (
                <a
                  href="/customers"
                  className="inline-flex items-center justify-center rounded-full border border-slate-950/12 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  신규 등록 모드
                </a>
              ) : null}
              <SubmitButton label={selectedCustomer ? "고객 수정 저장" : "고객 등록"} />
            </div>
          </form>
        </Panel>

        <Panel
          title="고객 검색 / 필터"
          description="연락처, 이름, 현재 통신사, 미수금 보유 여부로 목록을 줄일 수 있습니다."
        >
          <form method="get" className={`${editorCardClassName} ${formGridClassName}`}>
            <FormField
              label="검색어"
              name="q"
              defaultValue={filters.q}
              placeholder="이름 또는 연락처"
              autoComplete="off"
            />
            <FormSelect
              label="현재 통신사"
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
              label="미수금 상태"
              name="receivable"
              defaultValue={filters.receivable}
            >
              <option value="all">전체</option>
              <option value="outstanding">미수 보유</option>
              <option value="clear">미수 없음</option>
            </FormSelect>
            <div className="md:col-span-2 flex flex-wrap items-center justify-end gap-2">
              <a
                href="/customers"
                className="inline-flex items-center justify-center rounded-full border border-slate-950/12 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                필터 초기화
              </a>
              <SubmitButton label="필터 적용" />
            </div>
          </form>
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel
          title="고객 목록"
          description="선택한 고객의 판매 이력과 미수금 이력이 오른쪽 상세에 바로 연결됩니다."
        >
          <div className="space-y-3">
            {customers.length > 0 ? (
              customers.map((customer) => (
                <article key={customer.id} className={editorCardClassName}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-slate-950">
                        {customer.name}
                      </p>
                      <p className="text-sm text-slate-500">{customer.phone}</p>
                    </div>
                    <a
                      href={buildCustomerHref(filters, customer.id)}
                      className={[
                        "inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold transition",
                        selectedCustomer?.id === customer.id
                          ? "border-slate-950 bg-slate-950 text-white"
                          : "border-slate-950/12 text-slate-700 hover:bg-slate-100",
                      ].join(" ")}
                    >
                      {selectedCustomer?.id === customer.id ? "열람 중" : "상세 보기"}
                    </a>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-4">
                    <p>통신사 {customer.currentCarrierName ?? "미지정"}</p>
                    <p>판매 이력 {customer.salesCount}건</p>
                    <p>미수 잔액 {formatWon(customer.receivableBalance)}</p>
                    <p>
                      최근 방문{" "}
                      {customer.lastVisitAt
                        ? customer.lastVisitAt.toLocaleDateString("ko-KR")
                        : "없음"}
                    </p>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState message="현재 조건에 맞는 고객이 없습니다." />
            )}
          </div>
        </Panel>

        <Panel
          title="고객 상세"
          description="고객별 판매 이력과 미수금 흐름을 함께 확인합니다."
        >
          {selectedCustomer ? (
            <div className="space-y-5">
              <article className={editorCardClassName}>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-lg font-semibold text-slate-950">
                    {selectedCustomer.name}
                  </p>
                  <TonePill
                    label={selectedCustomer.currentCarrierName ?? "통신사 미지정"}
                    tone="teal"
                  />
                </div>
                <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                  <p>연락처 {selectedCustomer.phone}</p>
                  <p>
                    생년월일{" "}
                    {selectedCustomer.birthDate
                      ? formatKstDate(selectedCustomer.birthDate)
                      : "미입력"}
                  </p>
                  <p>등록일 {selectedCustomer.createdAt.toLocaleDateString("ko-KR")}</p>
                  <p>미수 잔액 {formatWon(selectedCustomerBalance)}</p>
                </div>
                <div className="mt-4 space-y-2 text-sm leading-6 text-slate-600">
                  <p>주소 {selectedCustomer.address ?? "미입력"}</p>
                  <p>메모 {selectedCustomer.memo ?? "없음"}</p>
                </div>
              </article>

              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">
                    판매 이력
                  </h3>
                  <TonePill
                    label={`${selectedCustomer.sales.length}건`}
                    tone="amber"
                  />
                </div>
                {selectedCustomer.sales.length > 0 ? (
                  selectedCustomer.sales.map((sale) => (
                    <article key={sale.id} className={editorCardClassName}>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="font-semibold text-slate-950">
                          {sale.carrierName} {sale.deviceModelName}
                        </p>
                        <span className="text-sm text-slate-500">
                          {sale.saleDate.toLocaleDateString("ko-KR")}
                        </span>
                      </div>
                      <div className="mt-3 grid gap-3 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-4">
                        <p>요금제 {sale.ratePlanName ?? "미지정"}</p>
                        <p>판매가 {formatWon(sale.finalSalePrice)}</p>
                        <p>미수금 {formatWon(sale.receivableAmount)}</p>
                        <p>담당 {sale.staffName}</p>
                      </div>
                    </article>
                  ))
                ) : (
                  <EmptyState message="판매 이력이 아직 없습니다." />
                )}
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">
                    미수금 이력
                  </h3>
                  <TonePill
                    label={`${selectedCustomer.receivables.length}건`}
                    tone="slate"
                  />
                </div>
                {selectedCustomer.receivables.length > 0 ? (
                  selectedCustomer.receivables.map((receivable) => (
                    <article key={receivable.id} className={editorCardClassName}>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="font-semibold text-slate-950">
                          {receivable.saleSummary}
                        </p>
                        <TonePill
                          label={getReceivableStatusLabel(receivable.status)}
                          tone={receivableToneMap[receivable.status]}
                        />
                      </div>
                      <div className="mt-3 grid gap-3 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-4">
                        <p>판매일 {receivable.saleDate.toLocaleDateString("ko-KR")}</p>
                        <p>원금 {formatWon(receivable.originalAmount)}</p>
                        <p>잔액 {formatWon(receivable.balanceAmount)}</p>
                        <p>등록일 {receivable.createdAt.toLocaleDateString("ko-KR")}</p>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-500">
                        메모 {receivable.memo ?? "없음"}
                      </p>
                    </article>
                  ))
                ) : (
                  <EmptyState message="미수금 이력이 아직 없습니다." />
                )}
              </section>
            </div>
          ) : (
            <EmptyState message="고객을 선택하면 판매 이력과 미수금 이력이 여기에 표시됩니다." />
          )}
        </Panel>
      </section>
    </div>
  );
}
