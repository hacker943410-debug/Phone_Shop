import { cancelSaleAction } from "@/app/actions/sales";
import { EmptyState } from "@/components/workspace/admin-form-controls";
import { SalesEntryForm } from "@/components/workspace/sales-entry-form";
import type {
  DiscountMethodValue,
  RevenueCalculationMethodValue,
  SalesAvailableInventoryRecord,
  SalesCarrierRecord,
  SalesCustomerRecord,
  SalesDiscountPolicyRecord,
  SalesNotice,
  SalesRebatePolicyRecord,
  SalesRecord,
  SalesSaleProfitPolicyRecord,
} from "@/components/workspace/sales-types";
import {
  ActionChip,
  MetricCard,
  PageIntro,
  Panel,
  TonePill,
} from "@/components/workspace/workspace-primitives";
import { formatKstDate, formatKstDateRange } from "@/lib/date-utils";
import { formatWon } from "@/lib/formatters";

const noticeMessageMap: Record<SalesNotice, string> = {
  "invalid-sale-form":
    "판매 등록 값이 비어 있거나 잘못되었습니다. 고객, 재고, 금액 입력값을 다시 확인하세요.",
  "sale-customer-not-found":
    "선택한 고객을 찾지 못했습니다. 고객 목록에서 다시 선택한 뒤 시도하세요.",
  "sale-inventory-unavailable":
    "선택한 재고를 지금은 판매할 수 없습니다. 이미 판매되었거나 숨김 처리되었는지 확인하세요.",
  "sale-rate-plan-mismatch":
    "선택한 요금제가 현재 재고 통신사와 맞지 않습니다.",
  "sale-service-mismatch":
    "선택한 부가서비스 중 현재 통신사에서 사용할 수 없는 항목이 있습니다.",
  "sale-overpayment":
    "수납 금액 합계가 최종 판매가를 초과했습니다. 결제 입력값을 다시 확인하세요.",
  "sale-discount-rule-missing":
    "할인 적용을 선택했지만 매칭 정책이나 수동 할인값이 없습니다.",
  "sale-not-found":
    "대상 판매 건을 찾지 못했습니다. 목록을 새로고침한 뒤 다시 시도하세요.",
  "sale-cancel-blocked":
    "수납 이력이 있는 판매 건은 취소할 수 없습니다.",
};

const editorCardClassName =
  "rounded-[1.35rem] border border-slate-950/8 bg-stone-50/85 p-4 shadow-[0_12px_36px_-30px_rgba(15,23,42,0.35)]";

function toDate(value: string) {
  return new Date(value);
}

function getDiscountValueLabel(
  method: DiscountMethodValue | null,
  value: number | null,
) {
  if (!method || value === null) {
    return "미적용";
  }

  return method === "PERCENTAGE" ? `${value}%` : formatWon(value);
}

function getSaleDiscountLabel(sale: SalesRecord) {
  if (!sale.discountApplied) {
    return "미적용";
  }

  return getDiscountValueLabel(sale.discountMethod, sale.discountValue);
}

function getSaleProfitLabel(
  method: RevenueCalculationMethodValue,
  value: number,
) {
  switch (method) {
    case "PERCENTAGE":
      return `판매가 ${value}%`;
    case "FIXED_AMOUNT":
      return formatWon(value);
    default:
      return "없음";
  }
}

function getDiscountPolicyLabel(policy: SalesDiscountPolicyRecord) {
  const targetLabel =
    policy.target === "CARRIER"
      ? (policy.carrierName ?? "통신사 기준")
      : (policy.deviceModelName ?? "단말 기준");

  return `${targetLabel} / ${getDiscountValueLabel(
    policy.discountMethod,
    policy.discountValue,
  )}`;
}

function getSaleStatusTone(status: SalesRecord["status"]) {
  return status === "COMPLETED" ? "teal" : "rose";
}

function getSaleStatusLabel(status: SalesRecord["status"]) {
  return status === "COMPLETED" ? "완료" : "취소";
}

function getReceivableTone(status: SalesRecord["receivableStatus"]) {
  switch (status) {
    case "UNPAID":
      return "rose";
    case "PARTIALLY_PAID":
      return "amber";
    case "PAID":
      return "teal";
    default:
      return "slate";
  }
}

function getReceivableLabel(status: SalesRecord["receivableStatus"]) {
  switch (status) {
    case "UNPAID":
      return "미납";
    case "PARTIALLY_PAID":
      return "부분수납";
    case "PAID":
      return "완납";
    default:
      return "없음";
  }
}

export interface SalesOverviewProps {
  currentUserName: string;
  defaultSaleDate: string;
  notice: SalesNotice | null;
  customers: SalesCustomerRecord[];
  carriers: SalesCarrierRecord[];
  rebatePolicies: SalesRebatePolicyRecord[];
  saleProfitPolicies: SalesSaleProfitPolicyRecord[];
  discountPolicies: SalesDiscountPolicyRecord[];
  availableInventory: SalesAvailableInventoryRecord[];
  sales: SalesRecord[];
}

export function SalesOverview({
  currentUserName,
  defaultSaleDate,
  notice,
  customers,
  carriers,
  rebatePolicies,
  saleProfitPolicies,
  discountPolicies,
  availableInventory,
  sales,
}: SalesOverviewProps) {
  const activeRatePlanCount = carriers.reduce(
    (count, carrier) => count + carrier.ratePlans.length,
    0,
  );
  const activeServiceCount = new Set(
    carriers.flatMap((carrier) => carrier.addOnServices.map((service) => service.id)),
  ).size;
  const totalPolicyCount =
    rebatePolicies.length + saleProfitPolicies.length + discountPolicies.length;
  const completedSales = sales.filter((sale) => sale.status === "COMPLETED");
  const recentRevenue = completedSales.reduce(
    (total, sale) => total + sale.finalSalePrice,
    0,
  );
  const outstandingSalesCount = sales.filter(
    (sale) => sale.receivableBalance > 0,
  ).length;
  const inventoryPreview = availableInventory.slice(0, 12);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageIntro
        eyebrow="Sales"
        title="판매 입력, 할인 계산, 취소 처리까지 같은 흐름으로 묶었습니다."
        description="판매 등록 시 고객, 재고, 통신사 기준 정책을 함께 확인하고 최종 판매가, 미수금, 정책 수익을 즉시 계산합니다. 저장 시에는 서버가 같은 계산식으로 다시 검증해 재고와 고객 상태를 함께 갱신합니다."
        actions={
          <>
            <ActionChip label={`담당 ${currentUserName}`} tone="dark" />
            <ActionChip label={`정책 ${totalPolicyCount}건`} />
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
          label="판매 가능 재고"
          value={`${availableInventory.length}대`}
          helper="숨김 처리되지 않은 입고 상태 재고만 판매 폼에 노출합니다."
          accent="amber"
        />
        <MetricCard
          label="활성 요금제 / 서비스"
          value={`${activeRatePlanCount} / ${activeServiceCount}`}
          helper="통신사 기준 선택값과 공통 부가서비스를 함께 보여줍니다."
          accent="teal"
        />
        <MetricCard
          label="최근 완료 매출"
          value={formatWon(recentRevenue)}
          helper={`최근 목록 완료 건 ${completedSales.length}건 기준 합계입니다.`}
          accent="slate"
        />
        <MetricCard
          label="미수금 진행 건"
          value={`${outstandingSalesCount}건`}
          helper="부분 수납 또는 미납 상태가 남아 있는 판매 건 수입니다."
          accent="amber"
        />
      </section>

      <Panel
        title="판매 등록"
        description="고객, 재고, 정책 매칭을 기준으로 새 판매를 저장합니다. 미수금이 남으면 자동으로 receivable이 생성되고, 재고와 고객 현재 통신사도 함께 갱신됩니다."
      >
        <SalesEntryForm
          currentUserName={currentUserName}
          defaultSaleDate={defaultSaleDate}
          customers={customers}
          carriers={carriers}
          availableInventory={availableInventory}
          discountPolicies={discountPolicies}
          rebatePolicies={rebatePolicies}
          saleProfitPolicies={saleProfitPolicies}
        />
      </Panel>

      <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <Panel
          title="판매 선택값"
          description="통신사별 실제 활성 요금제와 부가서비스를 한 번에 확인할 수 있습니다."
        >
          <div className="space-y-4">
            {carriers.map((carrier) => (
              <article key={carrier.id} className={editorCardClassName}>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-base font-semibold text-slate-950">
                    {carrier.name}
                  </p>
                  <TonePill label={carrier.code} tone="teal" />
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      요금제
                    </p>
                    <ul className="space-y-2">
                      {carrier.ratePlans.length > 0 ? (
                        carrier.ratePlans.map((ratePlan) => (
                          <li
                            key={ratePlan.id}
                            className="rounded-[1rem] border border-white/70 bg-white px-3 py-2 text-sm text-slate-700"
                          >
                            <span className="font-medium text-slate-900">
                              {ratePlan.name}
                            </span>
                            <span className="ml-2 text-slate-500">
                              {formatWon(ratePlan.monthlyFee)}
                            </span>
                          </li>
                        ))
                      ) : (
                        <li className="rounded-[1rem] border border-dashed border-slate-300 bg-white px-3 py-2 text-sm text-slate-500">
                          활성 요금제가 없습니다.
                        </li>
                      )}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      부가서비스
                    </p>
                    <ul className="space-y-2">
                      {carrier.addOnServices.length > 0 ? (
                        carrier.addOnServices.map((service) => (
                          <li
                            key={service.id}
                            className="rounded-[1rem] border border-white/70 bg-white px-3 py-2 text-sm text-slate-700"
                          >
                            <span className="font-medium text-slate-900">
                              {service.name}
                            </span>
                            <span className="ml-2 text-slate-500">
                              {service.monthlyFee !== null
                                ? formatWon(service.monthlyFee)
                                : "요금 미정"}
                            </span>
                          </li>
                        ))
                      ) : (
                        <li className="rounded-[1rem] border border-dashed border-slate-300 bg-white px-3 py-2 text-sm text-slate-500">
                          활성 부가서비스가 없습니다.
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </Panel>

        <Panel
          title="현재 등록된 정책"
          description="리베이트, 판매 수익, 할인 정책을 같은 화면에서 검토하고 판매 입력 시 자동 매칭합니다."
        >
          <div className="space-y-4">
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">
                  리베이트 정책
                </h3>
                <TonePill label={`${rebatePolicies.length}건`} tone="amber" />
              </div>
              {rebatePolicies.map((policy) => (
                <article
                  key={policy.id}
                  className="rounded-[1rem] border border-slate-950/8 bg-amber-50/70 px-4 py-3 text-sm text-slate-700"
                >
                  <p className="font-semibold text-slate-950">{policy.name}</p>
                  <p className="mt-1">
                    {policy.carrierName} / {policy.deviceModelName}
                  </p>
                  <p className="mt-1 text-slate-500">
                    {formatWon(policy.defaultRebateAmount)} /{" "}
                    {formatKstDateRange(
                      toDate(policy.startsAt),
                      toDate(policy.endsAt),
                    )}
                  </p>
                </article>
              ))}
            </section>

            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">
                  판매수익 정책
                </h3>
                <TonePill label={`${saleProfitPolicies.length}건`} tone="teal" />
              </div>
              {saleProfitPolicies.map((policy) => (
                <article
                  key={policy.id}
                  className="rounded-[1rem] border border-slate-950/8 bg-teal-50/70 px-4 py-3 text-sm text-slate-700"
                >
                  <p className="font-semibold text-slate-950">{policy.name}</p>
                  <p className="mt-1">{policy.carrierName}</p>
                  <p className="mt-1 text-slate-500">
                    {getSaleProfitLabel(
                      policy.calculationMethod,
                      policy.calculationValue,
                    )}{" "}
                    /{" "}
                    {formatKstDateRange(
                      toDate(policy.startsAt),
                      toDate(policy.endsAt),
                    )}
                  </p>
                </article>
              ))}
            </section>

            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">
                  할인 정책
                </h3>
                <TonePill label={`${discountPolicies.length}건`} tone="slate" />
              </div>
              {discountPolicies.map((policy) => (
                <article
                  key={policy.id}
                  className="rounded-[1rem] border border-slate-950/8 bg-slate-50/85 px-4 py-3 text-sm text-slate-700"
                >
                  <p className="font-semibold text-slate-950">{policy.name}</p>
                  <p className="mt-1">{getDiscountPolicyLabel(policy)}</p>
                  <p className="mt-1 text-slate-500">
                    {formatKstDateRange(
                      toDate(policy.startsAt),
                      toDate(policy.endsAt),
                    )}
                  </p>
                </article>
              ))}
            </section>
          </div>
        </Panel>
      </section>

      <Panel
        title="판매 가능 재고"
        description={`현재 판매 가능한 재고 ${availableInventory.length}대 중 최근 입고 순으로 최대 12대를 보여줍니다.`}
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {inventoryPreview.length > 0 ? (
            inventoryPreview.map((item) => (
              <article
                key={item.id}
                className="rounded-[1.15rem] border border-slate-950/8 bg-stone-50/80 px-4 py-3"
              >
                <p className="font-semibold text-slate-950">
                  {item.carrierName} {item.deviceModelName}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {item.color} / {item.capacity}
                </p>
                <p className="mt-1 text-xs text-slate-500">IMEI {item.imei}</p>
                <p className="mt-1 text-xs text-slate-500">
                  원가 {formatWon(item.costAmount)}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  입고일 {formatKstDate(toDate(item.receivedAt))}
                </p>
              </article>
            ))
          ) : (
            <EmptyState message="현재 판매 가능한 재고가 없습니다." />
          )}
        </div>
      </Panel>

      <Panel
        title="최근 판매 이력"
        description="완료/취소 상태, 할인 적용, 리베이트, 정책 수익, 미수금 현재 잔액을 함께 확인합니다. 수납 이력이 없는 완료 건만 취소할 수 있습니다."
      >
        {sales.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.2em] text-slate-400">
                <tr>
                  <th className="pb-3 font-semibold">판매일 / 상태</th>
                  <th className="pb-3 font-semibold">고객 / 담당</th>
                  <th className="pb-3 font-semibold">상품</th>
                  <th className="pb-3 font-semibold">최종 판매가</th>
                  <th className="pb-3 font-semibold">할인</th>
                  <th className="pb-3 font-semibold">리베이트 / 수익</th>
                  <th className="pb-3 font-semibold">미수금</th>
                  <th className="pb-3 font-semibold">취소 처리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80">
                {sales.map((sale) => (
                  <tr key={sale.id}>
                    <td className="py-4 pr-4 align-top text-slate-500">
                      <p>{formatKstDate(toDate(sale.saleDate))}</p>
                      <div className="mt-2">
                        <TonePill
                          label={getSaleStatusLabel(sale.status)}
                          tone={getSaleStatusTone(sale.status)}
                        />
                      </div>
                    </td>
                    <td className="py-4 pr-4 align-top">
                      <p className="font-semibold text-slate-950">
                        {sale.customerName}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        담당 {sale.staffName}
                      </p>
                    </td>
                    <td className="py-4 pr-4 align-top">
                      <p className="font-medium text-slate-800">
                        {sale.carrierName} {sale.deviceModelName}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {sale.ratePlanName ?? "요금제 미선택"}
                        {sale.selectedServices.length > 0
                          ? ` / ${sale.selectedServices.join(", ")}`
                          : ""}
                      </p>
                    </td>
                    <td className="py-4 pr-4 align-top font-medium text-slate-900">
                      {formatWon(sale.finalSalePrice)}
                    </td>
                    <td className="py-4 pr-4 align-top text-slate-600">
                      <p>{getSaleDiscountLabel(sale)}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {sale.appliedDiscountPolicyName ?? "수동 입력 또는 미적용"}
                      </p>
                    </td>
                    <td className="py-4 pr-4 align-top">
                      <p className="font-medium text-amber-800">
                        리베이트 {formatWon(sale.rebateAmount)}
                      </p>
                      <p className="mt-1 font-medium text-teal-800">
                        정책 수익 {formatWon(sale.policyRevenueAmount)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {sale.appliedRebatePolicyName ?? "리베이트 정책 없음"}
                        {" / "}
                        {sale.appliedSaleProfitPolicyName ?? "판매수익 정책 없음"}
                      </p>
                    </td>
                    <td className="py-4 pr-4 align-top">
                      <p className="font-medium text-slate-900">
                        {formatWon(sale.receivableBalance)}
                      </p>
                      <div className="mt-2">
                        <TonePill
                          label={getReceivableLabel(sale.receivableStatus)}
                          tone={getReceivableTone(sale.receivableStatus)}
                        />
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        원시 미수 {formatWon(sale.receivableAmount)}
                      </p>
                    </td>
                    <td className="py-4 align-top">
                      {sale.status === "COMPLETED" ? (
                        sale.canCancel ? (
                          <form action={cancelSaleAction} className="space-y-2">
                            <input type="hidden" name="saleId" value={sale.id} />
                            <input
                              type="text"
                              name="cancellationReason"
                              placeholder="취소 사유(선택)"
                              className="w-full rounded-[0.95rem] border border-slate-950/12 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
                            />
                            <button
                              type="submit"
                              className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-900 transition hover:bg-rose-100"
                            >
                              판매 취소
                            </button>
                          </form>
                        ) : (
                          <p className="text-sm leading-6 text-slate-500">
                            {sale.hasPayments
                              ? "수납 이력이 있어 취소할 수 없습니다."
                              : "취소할 수 없는 상태입니다."}
                          </p>
                        )
                      ) : (
                        <div className="space-y-1 text-sm leading-6 text-slate-500">
                          <p>취소 완료</p>
                          <p>
                            {sale.canceledAt
                              ? formatKstDate(toDate(sale.canceledAt))
                              : "-"}
                          </p>
                          <p>{sale.cancellationReason ?? "사유 없음"}</p>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="최근 판매 이력이 아직 없습니다." />
        )}
      </Panel>
    </div>
  );
}
