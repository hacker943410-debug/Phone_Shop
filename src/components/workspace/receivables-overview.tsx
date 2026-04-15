import {
  cancelPaymentAction,
  recordPaymentAction,
} from "@/app/actions/receivables";
import {
  CurrencyField,
  EmptyState,
  FormField,
  FormSelect,
  FormTextArea,
  NoticeBanner,
  SubmitButton,
} from "@/components/workspace/admin-form-controls";
import { ListPaginationControls } from "@/components/workspace/list-pagination-controls";
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
import { ConfirmSubmitButton } from "@/components/workspace/confirm-submit-button";
import {
  dangerButtonClassName,
  formControlClassName,
  secondaryButtonClassName,
} from "@/components/workspace/ui-classnames";
import { formatKstDate } from "@/lib/date-utils";
import { formatWon } from "@/lib/formatters";
import type { PaginationState } from "@/lib/pagination";

const editorCardClassName =
  "rounded-lg border border-stone-200 bg-stone-50 p-4 shadow-[0_1px_3px_rgba(15,23,42,0.05),0_1px_2px_rgba(15,23,42,0.08)]";

const noticeMessageMap: Record<ReceivablesNotice, string> = {
  "invalid-payment-form":
    "수납 입력값이 비어 있거나 잘못되었습니다. 수납일, 금액, 수단을 다시 확인해 주세요.",
  "receivable-not-found":
    "대상 미수금 건을 찾지 못했습니다. 목록에서 다시 선택해 주세요.",
  "payment-not-found":
    "대상 수납 이력을 찾지 못했습니다. 이미 취소되었는지 확인해 주세요.",
  "payment-cancel-reason-required":
    "수납 취소 사유를 입력해야 합니다. 사유를 적은 뒤 다시 시도해 주세요.",
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
      return "부분 수납";
    case "PAID":
      return "완납";
  }
}

function getPaymentStatusLabel(status: ReceivablePaymentRecord["status"]) {
  return status === "COMPLETED" ? "완료" : "취소";
}

function getPaymentAuditSummary(payment: ReceivablePaymentRecord) {
  return `수납일 ${formatKstDate(payment.paymentDate)} / 등록 ${formatKstDate(payment.createdAt)} / 담당 ${payment.staffName}`;
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

function appendReceivablesFilterParams(
  searchParams: URLSearchParams,
  filters: ReceivablesFilters,
) {
  if (filters.q) {
    searchParams.set("q", filters.q);
  }

  if (filters.customerId) {
    searchParams.set("customerId", filters.customerId);
  }

  if (filters.saleId) {
    searchParams.set("saleId", filters.saleId);
  }

  if (filters.status !== "all") {
    searchParams.set("status", filters.status);
  }

  if (filters.dateFrom) {
    searchParams.set("dateFrom", filters.dateFrom);
  }

  if (filters.dateTo) {
    searchParams.set("dateTo", filters.dateTo);
  }
}

function buildReceivablesPageHref(filters: ReceivablesFilters, page: number) {
  const searchParams = new URLSearchParams();

  appendReceivablesFilterParams(searchParams, filters);

  if (page > 1) {
    searchParams.set("page", String(page));
  }

  const query = searchParams.toString();
  return query ? `/receivables?${query}` : "/receivables";
}

function buildReceivablesDetailHref(
  filters: ReceivablesFilters,
  page: number,
  receivableId: string,
) {
  const searchParams = new URLSearchParams();

  appendReceivablesFilterParams(searchParams, filters);

  if (page > 1) {
    searchParams.set("page", String(page));
  }

  searchParams.set("receivableId", receivableId);

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
  pagination: PaginationState;
  metrics: ReceivablesMetrics;
  selectedReceivableId: string | null;
  records: ReceivableRecord[];
}

export function ReceivablesOverview({
  currentUserName,
  defaultPaymentDate,
  notice,
  customers,
  filters,
  pagination,
  metrics,
  selectedReceivableId,
  records,
}: ReceivablesOverviewProps) {
  const selectedRecord =
    records.find((record) => record.id === selectedReceivableId) ?? null;

  return (
    <div className="space-y-5 p-4 sm:p-5 lg:p-6">
      <PageIntro
        eyebrow="Receivables"
        title="미수금 잔액과 수납 이력을 한 화면에서 추적합니다"
        description="판매에서 생성된 미수금의 현재 잔액, 수납 등록, 수납 취소 사유와 담당 이력까지 바로 확인할 수 있습니다. 수납 취소는 사유를 남기고, 취소 시각과 담당자도 함께 기록됩니다."
        actions={
          <>
            <ActionChip label={`담당 ${currentUserName}`} tone="dark" />
            <ActionChip label="수납 감사 추적" />
          </>
        }
      />

      {notice ? <NoticeBanner message={noticeMessageMap[notice]} /> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="전체 미수금"
          value={`${metrics.totalCount}건`}
          helper={`현재 필터 결과 ${metrics.filteredCount}건`}
          accent="amber"
        />
        <MetricCard
          label="잔액 보유 건"
          value={`${metrics.outstandingCount}건`}
          helper={`총 잔액 ${formatWon(metrics.balanceAmount)}`}
          accent="amber"
        />
        <MetricCard
          label="부분 수납"
          value={`${metrics.partiallyPaidCount}건`}
          helper="일부 수납이 등록되어 진행 중인 건"
          accent="teal"
        />
        <MetricCard
          label="완납 처리"
          value={`${metrics.paidCount}건`}
          helper="잔액이 0원으로 닫힌 미수금 건"
          accent="slate"
        />
      </section>

      <Panel
        title="미수금 검색 / 필터"
        description="고객, 상태, 판매일 기간, 검색어 기준으로 목록을 좁혀 볼 수 있습니다."
      >
        <form
          method="get"
          className={`${editorCardClassName} grid gap-3 md:grid-cols-2 xl:grid-cols-3`}
        >
          <FormField
            label="검색어"
            name="q"
            defaultValue={filters.q}
            placeholder="고객명, 연락처, 통신사, 모델명"
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
            <option value="PARTIALLY_PAID">부분 수납</option>
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
                className={`${secondaryButtonClassName} h-10 px-4`}
              >
                필터 초기화
              </a>
              <SubmitButton label="필터 적용" />
            </div>
          </div>
        </form>
      </Panel>

      <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <Panel
          title="미수금 목록"
          description={`현재 조건에 맞는 미수금 ${pagination.totalCount}건을 테이블로 보여 주고, 선택한 건의 수납 이력과 신규 수납 등록은 오른쪽에서 처리합니다.`}
        >
          <div className="space-y-4">
            <ListPaginationControls
              pagination={pagination}
              itemLabel="건"
              buildHref={(page) => buildReceivablesPageHref(filters, page)}
            />

            {records.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-stone-200">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-stone-50 text-[0.7rem] uppercase tracking-[0.18em] text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">고객</th>
                      <th className="px-4 py-3 font-semibold">판매건</th>
                      <th className="px-4 py-3 font-semibold">상태</th>
                      <th className="px-4 py-3 font-semibold">잔액</th>
                      <th className="px-4 py-3 font-semibold">수납</th>
                      <th className="px-4 py-3 text-right font-semibold">상세</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 bg-white">
                    {records.map((record) => {
                      const isSelected = selectedRecord?.id === record.id;

                      return (
                        <tr
                          key={record.id}
                          className={isSelected ? "bg-blue-50/70" : "hover:bg-stone-50/70"}
                        >
                          <td className="px-4 py-3.5 align-top">
                            <div className="space-y-1">
                              <p className="font-semibold text-slate-950">
                                {record.customerName}
                              </p>
                              <p className="text-xs text-slate-500">
                                {record.customerPhone}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 align-top text-slate-600">
                            <div className="space-y-1">
                              <p>{record.saleSummary}</p>
                              <p className="text-xs text-slate-500">
                                {formatKstDate(record.saleDate)} / 담당 {record.staffName}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 align-top">
                            <TonePill
                              label={getReceivableStatusLabel(record.status)}
                              tone={receivableToneMap[record.status]}
                            />
                          </td>
                          <td className="px-4 py-3.5 align-top font-mono text-slate-900 [font-variant-numeric:tabular-nums]">
                            {formatWon(record.balanceAmount)}
                          </td>
                          <td className="px-4 py-3.5 align-top text-slate-600">
                            {record.payments.length}건
                          </td>
                          <td className="px-4 py-3.5 text-right align-top">
                            <a
                              href={buildReceivablesDetailHref(
                                filters,
                                pagination.page,
                                record.id,
                              )}
                              className={[
                                `${secondaryButtonClassName} h-9 px-3.5`,
                                isSelected
                                  ? "border-blue-700 bg-blue-700 text-white hover:border-blue-800 hover:bg-blue-800"
                                  : "",
                              ].join(" ")}
                            >
                              {isSelected ? "열람 중" : "상세 보기"}
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState message="현재 조건에 맞는 미수금 건이 없습니다." />
            )}
          </div>
        </Panel>

        <Panel
          title="미수금 상세 / 수납 처리"
          description="선택한 미수금의 요약, 수납 이력, 수납 취소, 신규 수납 등록을 여기서 처리합니다."
        >
          {selectedRecord ? (
            <div className="space-y-4">
              <article className={editorCardClassName}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-lg font-semibold tracking-[-0.03em] text-slate-950">
                        {selectedRecord.customerName}
                      </p>
                      <TonePill
                        label={getReceivableStatusLabel(selectedRecord.status)}
                        tone={receivableToneMap[selectedRecord.status]}
                      />
                    </div>
                    <p className="text-sm text-slate-500">
                      {selectedRecord.customerPhone}
                    </p>
                    <p className="text-sm text-slate-600">
                      {selectedRecord.saleSummary} / 판매일{" "}
                      {formatKstDate(selectedRecord.saleDate)} / 담당{" "}
                      {selectedRecord.staffName}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <a
                      href={buildCustomerReceivableHref(selectedRecord.customerId)}
                      className={`${secondaryButtonClassName} h-9 px-3.5`}
                    >
                      고객 기준 보기
                    </a>
                    <a
                      href={buildSaleReceivableHref(selectedRecord.saleId)}
                      className={`${secondaryButtonClassName} h-9 px-3.5`}
                    >
                      판매건 기준 보기
                    </a>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                  <div className="rounded-lg border border-stone-200 bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      원금
                    </p>
                    <p className="mt-2 font-mono text-lg font-semibold text-slate-950 [font-variant-numeric:tabular-nums]">
                      {formatWon(selectedRecord.originalAmount)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-stone-200 bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      누적 수납
                    </p>
                    <p className="mt-2 font-mono text-lg font-semibold text-slate-950 [font-variant-numeric:tabular-nums]">
                      {formatWon(selectedRecord.paidAmount)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-stone-200 bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      잔액
                    </p>
                    <p className="mt-2 font-mono text-lg font-semibold text-slate-950 [font-variant-numeric:tabular-nums]">
                      {formatWon(selectedRecord.balanceAmount)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-stone-200 bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      등록일
                    </p>
                    <p className="mt-2 text-base font-semibold text-slate-950">
                      {formatKstDate(selectedRecord.createdAt)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-stone-200 bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      메모
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {selectedRecord.memo ?? "메모 없음"}
                    </p>
                  </div>
                </div>
              </article>

              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">
                    수납 이력
                  </h3>
                  <TonePill label={`${selectedRecord.payments.length}건`} tone="slate" />
                </div>

                {selectedRecord.payments.length > 0 ? (
                  <div className="space-y-3">
                    {selectedRecord.payments.map((payment) => (
                      <article
                        key={payment.id}
                        className="rounded-lg border border-stone-200 bg-white px-4 py-3"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-mono font-medium text-slate-950 [font-variant-numeric:tabular-nums]">
                                {formatWon(payment.amount)}
                              </p>
                              <TonePill
                                label={getPaymentStatusLabel(payment.status)}
                                tone={paymentToneMap[payment.status]}
                              />
                            </div>
                            <p className="text-sm text-slate-500">
                              {paymentMethodLabelMap[payment.method]} /{" "}
                              {getPaymentAuditSummary(payment)}
                            </p>
                            <p className="text-sm leading-6 text-slate-600">
                              {payment.memo ?? "메모 없음"}
                            </p>
                            {payment.status === "CANCELED" ? (
                              <div className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm leading-6 text-slate-600">
                                <p>
                                  취소일{" "}
                                  {payment.canceledAt
                                    ? formatKstDate(payment.canceledAt)
                                    : "-"}
                                </p>
                                <p>
                                  취소 담당{" "}
                                  {payment.canceledByName ?? "확인 불가"}
                                </p>
                                <p>
                                  취소 사유{" "}
                                  {payment.cancellationReason ?? "사유 없음"}
                                </p>
                              </div>
                            ) : null}
                          </div>

                          {payment.status === "COMPLETED" ? (
                            <form
                              action={cancelPaymentAction}
                              className="w-full max-w-xs space-y-2"
                            >
                              <input type="hidden" name="paymentId" value={payment.id} />
                              <input
                                type="text"
                                name="cancellationReason"
                                placeholder="취소 사유(필수)"
                                required
                                className={formControlClassName}
                              />
                              <ConfirmSubmitButton
                                confirmMessage="이 수납 이력을 취소하시겠습니까?"
                                className={`${dangerButtonClassName} h-10 px-4`}
                              >
                                수납 취소
                              </ConfirmSubmitButton>
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
                    label={selectedRecord.balanceAmount > 0 ? "등록 가능" : "완납"}
                    tone={selectedRecord.balanceAmount > 0 ? "teal" : "slate"}
                  />
                </div>

                {selectedRecord.balanceAmount > 0 ? (
                  <form
                    action={recordPaymentAction}
                    className="grid gap-3 rounded-lg border border-stone-200 bg-white px-4 py-4 md:grid-cols-2"
                  >
                    <input type="hidden" name="receivableId" value={selectedRecord.id} />
                    <FormField
                      label="수납일"
                      name="paymentDate"
                      type="date"
                      defaultValue={defaultPaymentDate}
                      required
                    />
                    <FormSelect
                      label="수납 수단"
                      name="method"
                      defaultValue="BANK_TRANSFER"
                    >
                      <option value="BANK_TRANSFER">계좌이체</option>
                      <option value="CARD">카드</option>
                      <option value="CASH">현금</option>
                    </FormSelect>
                    <CurrencyField
                      label="수납 금액"
                      name="amount"
                      max={selectedRecord.balanceAmount}
                      placeholder={String(selectedRecord.balanceAmount)}
                      required
                    />
                    <div className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm leading-6 text-slate-600">
                      현재 잔액 {formatWon(selectedRecord.balanceAmount)}
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
                  <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-4 text-sm leading-6 text-teal-900">
                    이 미수금 건은 완납 처리되었습니다. 수납 취소가 필요하면 위 수납
                    이력에서 완료된 수납건을 취소해 주세요.
                  </div>
                )}
              </section>
            </div>
          ) : (
            <EmptyState message="미수금 건을 선택하면 상세와 수납 처리 UI가 여기 표시됩니다." />
          )}
        </Panel>
      </section>
    </div>
  );
}
