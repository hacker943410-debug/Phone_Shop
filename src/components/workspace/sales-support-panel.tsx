import { EmptyState } from "@/components/workspace/admin-form-controls";
import type {
  DiscountMethodValue,
  RevenueCalculationMethodValue,
  SalesAvailableInventoryRecord,
  SalesCarrierRecord,
  SalesDiscountPolicyRecord,
  SalesSaleProfitPolicyRecord,
  SalesStaffCommissionPolicyRecord,
} from "@/components/workspace/sales-types";
import { Panel, TonePill } from "@/components/workspace/workspace-primitives";
import { formatWon } from "@/lib/formatters";

const editorCardClassName =
  "rounded-lg border border-stone-200 bg-stone-50 p-4 shadow-[0_1px_3px_rgba(15,23,42,0.05),0_1px_2px_rgba(15,23,42,0.08)]";

function getDiscountValueLabel(
  method: DiscountMethodValue | null,
  value: number | null,
) {
  if (!method || value === null) {
    return "미적용";
  }

  return method === "PERCENTAGE" ? `${value}%` : formatWon(value);
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
  return `${policy.deviceModelName} / ${getDiscountValueLabel(
    policy.discountMethod,
    policy.discountValue,
  )}`;
}

export interface SalesSupportPanelProps {
  carriers: SalesCarrierRecord[];
  saleProfitPolicies: SalesSaleProfitPolicyRecord[];
  staffCommissionPolicies: SalesStaffCommissionPolicyRecord[];
  discountPolicies: SalesDiscountPolicyRecord[];
  availableInventory: SalesAvailableInventoryRecord[];
}

export function SalesSupportPanel({
  carriers,
  saleProfitPolicies,
  staffCommissionPolicies,
  discountPolicies,
  availableInventory,
}: SalesSupportPanelProps) {
  const activeRatePlanCount = carriers.reduce(
    (count, carrier) => count + carrier.ratePlans.length,
    0,
  );
  const activeServiceCount = new Set(
    carriers.flatMap((carrier) =>
      carrier.addOnServices.map((service) => service.id),
    ),
  ).size;
  const totalPolicyCount =
    saleProfitPolicies.length +
    staffCommissionPolicies.length +
    discountPolicies.length;
  const inventoryPreview = availableInventory.slice(0, 12);

  return (
    <Panel title="판매 지원 정보">
      <div className="space-y-4">
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">통신사 선택지</h3>
            <TonePill
              label={`${activeRatePlanCount} 요금제 / ${activeServiceCount} 서비스`}
              tone="teal"
            />
          </div>
          <div className="grid gap-3">
            {carriers.map((carrier) => (
              <article key={carrier.id} className={editorCardClassName}>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-slate-950">
                    {carrier.name}
                  </p>
                  <TonePill label={carrier.code} tone="teal" />
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  요금제 {carrier.ratePlans.length}개 / 부가서비스{" "}
                  {carrier.addOnServices.length}개
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">적용 정책 요약</h3>
            <TonePill label={`${totalPolicyCount}개`} tone="amber" />
          </div>
          <div className="grid gap-3">
            {saleProfitPolicies.slice(0, 3).map((policy) => (
              <article
                key={policy.id}
                className="rounded-lg border border-blue-200 bg-blue-50/80 px-4 py-3 text-sm text-slate-700"
              >
                <p className="font-semibold text-slate-950">{policy.name}</p>
                <p className="mt-1">{policy.carrierName}</p>
                <p className="mt-1 text-slate-500">
                  {getSaleProfitLabel(
                    policy.calculationMethod,
                    policy.calculationValue,
                  )}
                </p>
              </article>
            ))}
            {staffCommissionPolicies.slice(0, 3).map((policy) => (
              <article
                key={policy.id}
                className="rounded-lg border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-slate-700"
              >
                <p className="font-semibold text-slate-950">{policy.staffName}</p>
                <p className="mt-1">@{policy.staffCode}</p>
                <p className="mt-1 text-slate-500">
                  {getSaleProfitLabel(
                    policy.calculationMethod,
                    policy.calculationValue,
                  )}
                </p>
              </article>
            ))}
            {discountPolicies.slice(0, 3).map((policy) => (
              <article
                key={policy.id}
                className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-700"
              >
                <p className="font-semibold text-slate-950">{policy.deviceModelName}</p>
                <p className="mt-1">{getDiscountPolicyLabel(policy)}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">
              판매 가능 재고 미리보기
            </h3>
            <TonePill label={`${availableInventory.length}대`} tone="slate" />
          </div>
          <div className="grid gap-3">
            {inventoryPreview.length > 0 ? (
              inventoryPreview.map((item) => (
                <article
                  key={item.id}
                  className="rounded-lg border border-stone-200 bg-white px-4 py-3"
                >
                  <p className="font-semibold text-slate-950">
                    {item.carrierName} {item.deviceModelName}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {item.color} / {item.capacity}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    S/N {item.serialNumber} / Model No. {item.modelNumber}
                  </p>
                </article>
              ))
            ) : (
              <EmptyState message="현재 판매 가능한 재고가 없습니다." />
            )}
          </div>
        </section>
      </div>
    </Panel>
  );
}
