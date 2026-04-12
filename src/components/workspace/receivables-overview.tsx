import {
  cancelPaymentAction,
  recordPaymentAction,
} from "@/app/actions/receivables";
import {
  EmptyState,
  FormField,
  FormSelect,
  FormTextArea,
  SubmitButton,
} from "@/components/workspace/admin-form-controls";
import type {
  PaymentMethodValue,
  ReceivablePaymentRecord,
  ReceivableRecord,
  ReceivablesFilters,
  ReceivablesMetrics,
  ReceivablesNotice,
} from "@/components/workspace/receivables-types";
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

const noticeMessageMap: Record<ReceivablesNotice, string> = {
  "invalid-payment-form":
    "수납 입력값이 비어 있거나 잘못되었습니다. 수납일, 금액, 수단을 다시 확인하세요.",
  "receivable-not-found":
    "대상 미수금 건을 찾지 못했습니다. 목록을 새로고침한 뒤 다시 시도하세요.",
  "payment-not-found":
    "대상 수납 이력을 찾지 못했습니다. 이미 취소되었는지 확인하세요.",
  "payment-over-balance":
    "현재 잔액을 초과하는 수납은 등록할 수 없습니다.",
};

const receivableToneMap = {
  UNPAID: "rose",
  PARTIALLY_PAID: "amber",
  PAID: "teal",
} as const;

const paymentToneMap = {
  COMPLETED: "teal",
  CANCELED: "slate",
} as const;

const paymentMethodLabelMap: Record<PaymentMethodValue, string> = {
  CASH: "현금",
  CARD: "카드",
  BANK_TRANSFER: "계좌이체",
};

function getReceivableStatusLabel(status: ReceivableRecord["status"]) {
  switch (status) {
    case "UNPAID":
      return "미납";
    case "PARTIALLY_PAID":
      return "부분수납";
    case "PAID":
      return "완납";
  }
}

function getPaymentStatusLabel(status: ReceivablePaymentRecord["status"]) {
  return status === "COMPLETED" ? "완료" : "취소";
}

function buildCustomerReceivableHref(customerId: string) {
  const searchParams = new URLSearchParams();
  searchParams.set("customerId", customerId);
  return `/receivables?${searchParams.toString()}`;
}

function buildSaleReceivableHref(saleId: string) {
  const searchParams = new URLSearchParams();
  searchParams.set("saleId", saleId);
  return `/receivables?${searchParams.toString()}`;
}

export interface ReceivablesOverviewProps {
  currentUserName: string;
  defaultPaymentDate: string;
  notice: ReceivablesNotice | null;
  customers: Array<{
    id: string;
    name: string;
    phone: string;
  }>;
  filters: ReceivablesFilters;
  metrics: ReceivablesMetrics;
  records: ReceivableRecord[];
}

export function ReceivablesOverview({
  currentUserName,
  defaultPaymentDate,
  notice,
  customers,
  filters,
  metrics,
  records,
}: ReceivablesOverviewProps) {
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageIntro
        eyebrow="Receivables"
        title="미수금 잔액과 수납 이력을 한 화면에서 추적합니다."
        description="판매에서 생성된 미수금을 고객, 기간, 상태 기준으로 모아보고 각 건마다 바로 수납을 등록하거나 취소할 수 있습니다. 잔액과 상태는 서버에서 다시 계산해 초과 수납을 막습니다."
        actions={
          <>
            <ActionChip label={`담당 ${currentUserName}`} tone="dark" />
            <ActionChip label="부분 수납 지원" />
          </>
        }
      />

      {notice ? (
        <section className="rounded-[1.4rem] border border-rose-200 bg-rose-50/85 px-5 py-4 text-sm leading-6 text-rose-900">
          {noticeMessageMap[notice]}
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="전체 미수금"
          value={`${metrics.totalCount}건`}
          helper={`현재 필터 결과 ${metrics.filteredCount}건`}
          accent="amber"
        />
        <MetricCard
          label="잔액 남은 건"
          value={`${metrics.outstandingCount}건`}
          helper={`총 잔액 ${formatWon(metrics.balanceAmount)}`}
          accent="amber"
        />
        <MetricCard
          label="부분 수납"
          value={`${metrics.partiallyPaidCount}건`}
          helper="일부 수납이 등록된 진행 건 수"
          accent="teal"
        />
        <MetricCard
          label="완납 처리"
          value={`${metrics.paidCount}건`}
          helper="잔액이 0으로 닫힌 미수금 건 수"
          accent="slate"
        />
      </section>

      <Panel
        title="미수금 검색 / 필터"
        description="고객, 상태, 판매일 범위, 검색어 기준으로 목록을 좁힐 수 있습니다."
      >
        <form method="get" className={`${editorCardClassName} grid gap-3 md:grid-cols-2 xl:grid-cols-3`}>
          <FormField
            label="검색어"
            name="q"
            defaultValue={filters.q}
            placeholder="고객명, 연락처, 통신사, 단말명"
            autoComplete="off"
          />
          <FormSelect
            label="고객"
            name="customerId"
            defaultValue={filters.customerId}
          >
            <option value="">전체 고객</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name} / {customer.phone}
              </option>
            ))}
          </FormSelect>
          <FormSelect label="상태" name="status" defaultValue={filters.status}>
            <option value="all">전체</option>
            <option value="UNPAID">미납</option>
            <option value="PARTIALLY_PAID">부분수납</option>
            <option value="PAID">완납</option>
          </FormSelect>
          <FormField
            label="판매일 시작"
            name="dateFrom"
            type="date"
            defaultValue={filters.dateFrom}
          />
          <FormField
            label="판매일 종료"
            name="dateTo"
            type="date"
            defaultValue={filters.dateTo}
          />
          {filters.saleId ? (
            <input type="hidden" name="saleId" value={filters.saleId} />
          ) : null}
          <div className="md:col-span-2 xl:col-span-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {filters.saleId ? (
                <TonePill label="특정 판매건 필터 적용 중" tone="amber" />
              ) : null}
              {filters.customerId ? (
                <TonePill label="특정 고객 필터 적용 중" tone="teal" />
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href="/receivables"
                className="inline-flex items-center justify-center rounded-full border border-slate-950/12 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                필터 초기화
              </a>
              <SubmitButton label="필터 적용" />
            </div>
          </div>
        </form>
      </Panel>

      <Panel
        title="미수금 목록"
        description="각 미수금 건에서 현재 잔액, 수납 이력, 새 수납 등록을 바로 처리할 수 있습니다."
      >
        <div className="space-y-4">
          {records.length > 0 ? (
            records.map((record) => (
              <article key={record.id} className={editorCardClassName}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-lg font-semibold tracking-[-0.03em] text-slate-950">
                        {record.customerName}
                      </p>
                      <TonePill
                        label={getReceivableStatusLabel(record.status)}
                        tone={receivableToneMap[record.status]}
                      />
                    </div>
                    <p className="text-sm text-slate-500">{record.customerPhone}</p>
                    <p className="text-sm text-slate-600">
                      {record.saleSummary} / 판매일 {formatKstDate(record.saleDate)} / 담당{" "}
                      {record.staffName}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <a
                      href={buildCustomerReceivableHref(record.customerId)}
                      className="inline-flex items-center justify-center rounded-full border border-slate-950/12 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      고객 기준 보기
                    </a>
                    <a
                      href={buildSaleReceivableHref(record.saleId)}
                      className="inline-flex items-center justify-center rounded-full border border-slate-950/12 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      판매건 기준 보기
                    </a>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                  <div className="rounded-[1rem] border border-white/70 bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      원금
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">
                      {formatWon(record.originalAmount)}
                    </p>
                  </div>
                  <div className="rounded-[1rem] border border-white/70 bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      누적 수납
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">
                      {formatWon(record.paidAmount)}
                    </p>
                  </div>
                  <div className="rounded-[1rem] border border-white/70 bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      잔액
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">
                      {formatWon(record.balanceAmount)}
                    </p>
                  </div>
                  <div className="rounded-[1rem] border border-white/70 bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      등록일
                    </p>
                    <p className="mt-2 text-base font-semibold text-slate-950">
                      {formatKstDate(record.createdAt)}
                    </p>
                  </div>
                  <div className="rounded-[1rem] border border-white/70 bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      메모
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {record.memo ?? "없음"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
                  <section className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-900">
                        수납 이력
                      </h3>
                      <TonePill label={`${record.payments.length}건`} tone="slate" />
                    </div>

                    {record.payments.length > 0 ? (
                      <div className="space-y-3">
                        {record.payments.map((payment) => (
                          <article
                            key={payment.id}
                            className="rounded-[1rem] border border-white/70 bg-white px-4 py-3"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-medium text-slate-950">
                                    {formatWon(payment.amount)}
                                  </p>
                                  <TonePill
                                    label={getPaymentStatusLabel(payment.status)}
                                    tone={paymentToneMap[payment.status]}
                                  />
                                </div>
                                <p className="text-sm text-slate-500">
                                  {formatKstDate(payment.paymentDate)} /{" "}
                                  {paymentMethodLabelMap[payment.method]} / 담당{" "}
                                  {payment.staffName}
                                </p>
                                <p className="text-sm leading-6 text-slate-600">
                                  {payment.memo ?? "메모 없음"}
                                </p>
                              </div>

                              {payment.status === "COMPLETED" ? (
                                <form action={cancelPaymentAction}>
                                  <input
                                    type="hidden"
                                    name="paymentId"
                                    value={payment.id}
                                  />
                                  <button
                                    type="submit"
                                    className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-900 transition hover:bg-rose-100"
                                  >
                                    수납 취소
                                  </button>
                                </form>
                              ) : null}
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <EmptyState message="아직 수납 이력이 없습니다." />
                    )}
                  </section>

                  <section className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-900">
                        수납 등록
                      </h3>
                      <TonePill
                        label={record.balanceAmount > 0 ? "등록 가능" : "완납"}
                        tone={record.balanceAmount > 0 ? "teal" : "slate"}
                      />
                    </div>

                    {record.balanceAmount > 0 ? (
                      <form
                        action={recordPaymentAction}
                        className="grid gap-3 rounded-[1rem] border border-white/70 bg-white px-4 py-4 md:grid-cols-2"
                      >
                        <input type="hidden" name="receivableId" value={record.id} />
                        <FormField
                          label="수납일"
                          name="paymentDate"
                          type="date"
                          defaultValue={defaultPaymentDate}
                          required
                        />
                        <FormSelect label="수납 수단" name="method" defaultValue="BANK_TRANSFER">
                          <option value="BANK_TRANSFER">계좌이체</option>
                          <option value="CARD">카드</option>
                          <option value="CASH">현금</option>
                        </FormSelect>
                        <FormField
                          label="수납 금액"
                          name="amount"
                          type="number"
                          min="1"
                          max={record.balanceAmount}
                          placeholder={String(record.balanceAmount)}
                          required
                        />
                        <div className="rounded-[1rem] border border-slate-100 bg-stone-50 px-4 py-3 text-sm leading-6 text-slate-600">
                          현재 잔액 {formatWon(record.balanceAmount)}
                          <br />
                          잔액을 초과하면 서버에서 차단합니다.
                        </div>
                        <FormTextArea
                          label="메모"
                          name="memo"
                          wrapperClassName="md:col-span-2"
                          placeholder="부분 수납 약속, 입금 확인 메모"
                          rows={3}
                        />
                        <div className="md:col-span-2 flex justify-end">
                          <SubmitButton label="수납 등록" />
                        </div>
                      </form>
                    ) : (
                      <div className="rounded-[1rem] border border-teal-200 bg-teal-50 px-4 py-4 text-sm leading-6 text-teal-900">
                        이 미수금 건은 완납 처리되었습니다. 수납 취소가 필요하면 왼쪽 수납 이력에서 완료된 수납을 취소하세요.
                      </div>
                    )}
                  </section>
                </div>
              </article>
            ))
          ) : (
            <EmptyState message="현재 조건에 맞는 미수금 건이 없습니다." />
          )}
        </div>
      </Panel>
    </div>
  );
}
