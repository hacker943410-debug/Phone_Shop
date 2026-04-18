import {
  toggleCarrierActivationRuleActiveAction,
  toggleDiscountPolicyActiveAction,
  toggleRebatePolicyActiveAction,
  toggleSaleProfitPolicyActiveAction,
  upsertCarrierActivationRuleAction,
  upsertDiscountPolicyAction,
  upsertRebatePolicyAction,
  upsertSaleProfitPolicyAction,
} from "@/app/actions/policies";
import {
  ActiveStatePill,
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
import { ConfirmSubmitButton } from "@/components/workspace/confirm-submit-button";
import { secondaryButtonClassName } from "@/components/workspace/ui-classnames";
import { formatActivationRuleLabel } from "@/lib/activation-rules";
import { formatKstDate, formatKstDateRange } from "@/lib/date-utils";
import { formatWon } from "@/lib/formatters";

const surfaceClassName =
  "rounded-[1.25rem] border border-stone-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(245,243,239,0.96)_100%)] p-4 shadow-[0_18px_38px_-34px_rgba(15,23,42,0.24)]";

const formGridClassName = "grid gap-3 md:grid-cols-2";

type DiscountMethodValue = "PERCENTAGE" | "FIXED_AMOUNT";
type DiscountTargetValue = "CARRIER" | "DEVICE";
type RevenueCalculationMethodValue = "NONE" | "FIXED_AMOUNT" | "PERCENTAGE";
type ActivationCountUnitValue = "DAY" | "MONTH";
type ActivationMonthCountModeValue =
  | "INCLUDE_CURRENT_MONTH"
  | "EXCLUDE_CURRENT_MONTH";

export interface PolicyCarrierOption {
  id: string;
  name: string;
  isActive: boolean;
}

export interface PolicyDeviceModelOption {
  id: string;
  name: string;
  manufacturer: string | null;
  isActive: boolean;
}

export interface RebatePolicyRecord {
  id: string;
  name: string;
  carrierId: string;
  carrierName: string;
  deviceModelId: string;
  deviceModelName: string;
  startsAt: Date;
  endsAt: Date;
  defaultRebateAmount: number;
  memo: string | null;
  isActive: boolean;
}

export interface SaleProfitPolicyRecord {
  id: string;
  name: string;
  carrierId: string;
  carrierName: string;
  startsAt: Date;
  endsAt: Date;
  calculationMethod: RevenueCalculationMethodValue;
  calculationValue: number;
  memo: string | null;
  isActive: boolean;
}

export interface DiscountPolicyRecord {
  id: string;
  name: string;
  target: DiscountTargetValue;
  carrierId: string | null;
  carrierName: string | null;
  deviceModelId: string | null;
  deviceModelName: string | null;
  startsAt: Date;
  endsAt: Date;
  discountMethod: DiscountMethodValue;
  discountValue: number;
  memo: string | null;
  isActive: boolean;
}

export interface CarrierActivationRuleRecord {
  id: string;
  carrierId: string;
  carrierName: string;
  countUnit: ActivationCountUnitValue;
  countValue: number;
  monthCountMode: ActivationMonthCountModeValue | null;
  memo: string | null;
  isActive: boolean;
}

export interface PoliciesOverviewProps {
  carriers: PolicyCarrierOption[];
  deviceModels: PolicyDeviceModelOption[];
  rebatePolicies: RebatePolicyRecord[];
  saleProfitPolicies: SaleProfitPolicyRecord[];
  discountPolicies: DiscountPolicyRecord[];
  carrierActivationRules: CarrierActivationRuleRecord[];
}

function getCarrierOptionLabel(carrier: PolicyCarrierOption) {
  return carrier.isActive ? carrier.name : `${carrier.name} (비활성)`;
}

function getDeviceModelOptionLabel(deviceModel: PolicyDeviceModelOption) {
  const baseLabel = deviceModel.manufacturer
    ? `${deviceModel.manufacturer} ${deviceModel.name}`
    : deviceModel.name;

  return deviceModel.isActive ? baseLabel : `${baseLabel} (비활성)`;
}

function getCalculationMethodLabel(method: RevenueCalculationMethodValue) {
  switch (method) {
    case "PERCENTAGE":
      return "판매가 비율";
    case "FIXED_AMOUNT":
      return "고정 금액";
    default:
      return "미반영";
  }
}

function getCalculationValueLabel(
  method: RevenueCalculationMethodValue,
  value: number,
) {
  switch (method) {
    case "PERCENTAGE":
      return `${value}%`;
    case "FIXED_AMOUNT":
      return formatWon(value);
    default:
      return "0";
  }
}

function getDiscountMethodLabel(method: DiscountMethodValue) {
  return method === "PERCENTAGE" ? "비율" : "고정 금액";
}

function getDiscountValueLabel(method: DiscountMethodValue, value: number) {
  return method === "PERCENTAGE" ? `${value}%` : formatWon(value);
}

function getDiscountTargetLabel(target: DiscountTargetValue) {
  return target === "CARRIER" ? "통신사" : "기종";
}

function getActivationCountUnitLabel(unit: ActivationCountUnitValue) {
  return unit === "DAY" ? "일수 기준" : "개월 기준";
}

function CreateToggle({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[0.7rem] font-semibold text-slate-500">
      {label}
    </span>
  );
}

export function PoliciesOverview({
  carriers,
  deviceModels,
  rebatePolicies,
  saleProfitPolicies,
  discountPolicies,
  carrierActivationRules,
}: PoliciesOverviewProps) {
  const activeRebateCount = rebatePolicies.filter((policy) => policy.isActive).length;
  const activeSaleProfitCount = saleProfitPolicies.filter(
    (policy) => policy.isActive,
  ).length;
  const activeDiscountCount = discountPolicies.filter((policy) => policy.isActive).length;
  const activeActivationRuleCount = carrierActivationRules.filter(
    (rule) => rule.isActive,
  ).length;

  return (
    <div className="flex flex-col gap-4 p-3 sm:p-4 2xl:p-5">
      <PageIntro
        eyebrow="Policies"
        title="정책 관리"
        className="shrink-0"
        actions={
          <>
            <ActionChip
              label={`활성 정책 ${activeRebateCount + activeSaleProfitCount + activeDiscountCount + activeActivationRuleCount}개`}
              tone="dark"
            />
            <ActionChip label={`리베이트 ${activeRebateCount} / 할인 ${activeDiscountCount}`} />
          </>
        }
      />

      <section className="grid shrink-0 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="리베이트"
          value={`${activeRebateCount}개`}
          helper="통신사와 기종 조합 기준"
          accent="amber"
        />
        <MetricCard
          label="판매 수익"
          value={`${activeSaleProfitCount}개`}
          helper="고정 금액 또는 비율 기준"
          accent="teal"
        />
        <MetricCard
          label="할인"
          value={`${activeDiscountCount}개`}
          helper="통신사 또는 기종 기준 할인"
          accent="slate"
        />
        <MetricCard
          label="개통 가능 규칙"
          value={`${activeActivationRuleCount}개`}
          helper="대시보드 집계 기준"
          accent="amber"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="리베이트 정책"
          contentClassName="space-y-3"
          actions={<CreateToggle label={`목록 ${rebatePolicies.length}개`} />}
        >
          <details className="rounded-[1.1rem] border border-stone-200 bg-white/90">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-900 marker:hidden">
              새 리베이트 정책 추가
            </summary>
            <div className="border-t border-stone-200 px-4 pb-4 pt-4">
              <form action={upsertRebatePolicyAction} className={`${surfaceClassName} ${formGridClassName}`}>
                <FormField label="정책명" name="name" placeholder="KT iPhone 16 리베이트" autoComplete="off" required />
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
                <FormField label="기본 리베이트" name="defaultRebateAmount" type="number" min="0" placeholder="310000" required />
                <FormField label="시작일" name="startsAt" type="date" required />
                <FormField label="종료일" name="endsAt" type="date" required />
                <FormTextArea label="메모" name="memo" wrapperClassName="md:col-span-2" placeholder="정책 운영 메모" rows={3} />
                <div className="flex justify-end md:col-span-2">
                  <SubmitButton label="리베이트 정책 추가" />
                </div>
              </form>
            </div>
          </details>

          {rebatePolicies.length > 0 ? (
            <div className="space-y-3">
              {rebatePolicies.map((policy) => (
                <article key={policy.id} className={surfaceClassName}>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold text-slate-950">{policy.name}</p>
                    <ActiveStatePill isActive={policy.isActive} />
                    <TonePill label={`${policy.carrierName} / ${policy.deviceModelName}`} tone="amber" />
                  </div>

                  <form action={upsertRebatePolicyAction} className={`mt-4 ${formGridClassName}`}>
                    <input type="hidden" name="id" value={policy.id} />
                    <FormField label="정책명" name="name" defaultValue={policy.name} autoComplete="off" required />
                    <FormSelect label="통신사" name="carrierId" defaultValue={policy.carrierId} required>
                      {carriers.map((carrier) => (
                        <option key={carrier.id} value={carrier.id}>
                          {getCarrierOptionLabel(carrier)}
                        </option>
                      ))}
                    </FormSelect>
                    <FormSelect label="기종" name="deviceModelId" defaultValue={policy.deviceModelId} required>
                      {deviceModels.map((deviceModel) => (
                        <option key={deviceModel.id} value={deviceModel.id}>
                          {getDeviceModelOptionLabel(deviceModel)}
                        </option>
                      ))}
                    </FormSelect>
                    <FormField label="기본 리베이트" name="defaultRebateAmount" type="number" min="0" defaultValue={policy.defaultRebateAmount} required />
                    <FormField label="시작일" name="startsAt" type="date" defaultValue={formatKstDate(policy.startsAt)} required />
                    <FormField label="종료일" name="endsAt" type="date" defaultValue={formatKstDate(policy.endsAt)} required />
                    <FormTextArea label="메모" name="memo" wrapperClassName="md:col-span-2" defaultValue={policy.memo ?? ""} rows={3} />
                    <div className="flex flex-wrap items-center justify-between gap-3 md:col-span-2">
                      <p className="text-sm text-slate-500">
                        {formatKstDateRange(policy.startsAt, policy.endsAt)} / {formatWon(policy.defaultRebateAmount)}
                      </p>
                      <SubmitButton label="저장" />
                    </div>
                  </form>

                  <div className="mt-3 flex justify-end">
                    <form action={toggleRebatePolicyActiveAction}>
                      <input type="hidden" name="id" value={policy.id} />
                      <input type="hidden" name="nextActive" value={policy.isActive ? "false" : "true"} />
                      <ConfirmSubmitButton
                        confirmMessage={policy.isActive ? "이 리베이트 정책을 비활성화하시겠습니까?" : "이 리베이트 정책을 다시 활성화하시겠습니까?"}
                        className={`${secondaryButtonClassName} h-10 px-4`}
                      >
                        {policy.isActive ? "비활성화" : "활성화"}
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState message="등록된 리베이트 정책이 아직 없습니다." />
          )}
        </Panel>

        <Panel
          title="판매 수익 정책"
          contentClassName="space-y-3"
          actions={<CreateToggle label={`목록 ${saleProfitPolicies.length}개`} />}
        >
          <details className="rounded-[1.1rem] border border-stone-200 bg-white/90">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-900 marker:hidden">
              새 수익 정책 추가
            </summary>
            <div className="border-t border-stone-200 px-4 pb-4 pt-4">
              <form action={upsertSaleProfitPolicyAction} className={`${surfaceClassName} ${formGridClassName}`}>
                <FormField label="정책명" name="name" placeholder="SKT 판매 수익 기본 정책" autoComplete="off" required />
                <FormSelect label="통신사" name="carrierId" required>
                  <option value="">통신사를 선택해 주세요</option>
                  {carriers.map((carrier) => (
                    <option key={carrier.id} value={carrier.id}>
                      {getCarrierOptionLabel(carrier)}
                    </option>
                  ))}
                </FormSelect>
                <FormSelect label="계산 방식" name="calculationMethod" required>
                  <option value="NONE">미반영</option>
                  <option value="FIXED_AMOUNT">고정 금액</option>
                  <option value="PERCENTAGE">판매가 비율</option>
                </FormSelect>
                <FormField label="계산 값" name="calculationValue" type="number" min="0" placeholder="70000 또는 5" />
                <FormField label="시작일" name="startsAt" type="date" required />
                <FormField label="종료일" name="endsAt" type="date" required />
                <FormTextArea label="메모" name="memo" wrapperClassName="md:col-span-2" placeholder="계산 방식 운영 메모" rows={3} />
                <div className="flex justify-end md:col-span-2">
                  <SubmitButton label="수익 정책 추가" />
                </div>
              </form>
            </div>
          </details>

          {saleProfitPolicies.length > 0 ? (
            <div className="space-y-3">
              {saleProfitPolicies.map((policy) => (
                <article key={policy.id} className={surfaceClassName}>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold text-slate-950">{policy.name}</p>
                    <ActiveStatePill isActive={policy.isActive} />
                    <TonePill label={policy.carrierName} tone="teal" />
                  </div>

                  <form action={upsertSaleProfitPolicyAction} className={`mt-4 ${formGridClassName}`}>
                    <input type="hidden" name="id" value={policy.id} />
                    <FormField label="정책명" name="name" defaultValue={policy.name} autoComplete="off" required />
                    <FormSelect label="통신사" name="carrierId" defaultValue={policy.carrierId} required>
                      {carriers.map((carrier) => (
                        <option key={carrier.id} value={carrier.id}>
                          {getCarrierOptionLabel(carrier)}
                        </option>
                      ))}
                    </FormSelect>
                    <FormSelect label="계산 방식" name="calculationMethod" defaultValue={policy.calculationMethod} required>
                      <option value="NONE">미반영</option>
                      <option value="FIXED_AMOUNT">고정 금액</option>
                      <option value="PERCENTAGE">판매가 비율</option>
                    </FormSelect>
                    <FormField label="계산 값" name="calculationValue" type="number" min="0" defaultValue={policy.calculationValue} />
                    <FormField label="시작일" name="startsAt" type="date" defaultValue={formatKstDate(policy.startsAt)} required />
                    <FormField label="종료일" name="endsAt" type="date" defaultValue={formatKstDate(policy.endsAt)} required />
                    <FormTextArea label="메모" name="memo" wrapperClassName="md:col-span-2" defaultValue={policy.memo ?? ""} rows={3} />
                    <div className="flex flex-wrap items-center justify-between gap-3 md:col-span-2">
                      <p className="text-sm text-slate-500">
                        {getCalculationMethodLabel(policy.calculationMethod)} / {getCalculationValueLabel(policy.calculationMethod, policy.calculationValue)} / {formatKstDateRange(policy.startsAt, policy.endsAt)}
                      </p>
                      <SubmitButton label="저장" />
                    </div>
                  </form>

                  <div className="mt-3 flex justify-end">
                    <form action={toggleSaleProfitPolicyActiveAction}>
                      <input type="hidden" name="id" value={policy.id} />
                      <input type="hidden" name="nextActive" value={policy.isActive ? "false" : "true"} />
                      <ConfirmSubmitButton
                        confirmMessage={policy.isActive ? "이 수익 정책을 비활성화하시겠습니까?" : "이 수익 정책을 다시 활성화하시겠습니까?"}
                        className={`${secondaryButtonClassName} h-10 px-4`}
                      >
                        {policy.isActive ? "비활성화" : "활성화"}
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState message="등록된 판매 수익 정책이 아직 없습니다." />
          )}
        </Panel>

        <Panel
          title="할인 정책"
          contentClassName="space-y-3"
          actions={<CreateToggle label={`목록 ${discountPolicies.length}개`} />}
        >
          <details className="rounded-[1.1rem] border border-stone-200 bg-white/90">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-900 marker:hidden">
              새 할인 정책 추가
            </summary>
            <div className="border-t border-stone-200 px-4 pb-4 pt-4">
              <form action={upsertDiscountPolicyAction} className={`${surfaceClassName} ${formGridClassName}`}>
                <FormField label="정책명" name="name" placeholder="갤럭시 S25 기종 할인" autoComplete="off" required />
                <FormSelect label="정책 대상" name="target" required>
                  <option value="CARRIER">통신사</option>
                  <option value="DEVICE">기종</option>
                </FormSelect>
                <FormSelect label="통신사" name="carrierId">
                  <option value="">선택 없음</option>
                  {carriers.map((carrier) => (
                    <option key={carrier.id} value={carrier.id}>
                      {getCarrierOptionLabel(carrier)}
                    </option>
                  ))}
                </FormSelect>
                <FormSelect label="기종" name="deviceModelId">
                  <option value="">선택 없음</option>
                  {deviceModels.map((deviceModel) => (
                    <option key={deviceModel.id} value={deviceModel.id}>
                      {getDeviceModelOptionLabel(deviceModel)}
                    </option>
                  ))}
                </FormSelect>
                <FormSelect label="할인 방식" name="discountMethod" required>
                  <option value="PERCENTAGE">비율</option>
                  <option value="FIXED_AMOUNT">고정 금액</option>
                </FormSelect>
                <FormField label="할인 값" name="discountValue" type="number" min="0" placeholder="8 또는 80000" required />
                <FormField label="시작일" name="startsAt" type="date" required />
                <FormField label="종료일" name="endsAt" type="date" required />
                <FormTextArea label="메모" name="memo" wrapperClassName="md:col-span-2" placeholder="우선순위 또는 운영 메모" rows={3} />
                <div className="flex justify-end md:col-span-2">
                  <SubmitButton label="할인 정책 추가" />
                </div>
              </form>
            </div>
          </details>

          {discountPolicies.length > 0 ? (
            <div className="space-y-3">
              {discountPolicies.map((policy) => (
                <article key={policy.id} className={surfaceClassName}>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold text-slate-950">{policy.name}</p>
                    <ActiveStatePill isActive={policy.isActive} />
                    <TonePill label={getDiscountTargetLabel(policy.target)} tone="slate" />
                  </div>

                  <form action={upsertDiscountPolicyAction} className={`mt-4 ${formGridClassName}`}>
                    <input type="hidden" name="id" value={policy.id} />
                    <FormField label="정책명" name="name" defaultValue={policy.name} autoComplete="off" required />
                    <FormSelect label="정책 대상" name="target" defaultValue={policy.target} required>
                      <option value="CARRIER">통신사</option>
                      <option value="DEVICE">기종</option>
                    </FormSelect>
                    <FormSelect label="통신사" name="carrierId" defaultValue={policy.carrierId ?? ""}>
                      <option value="">선택 없음</option>
                      {carriers.map((carrier) => (
                        <option key={carrier.id} value={carrier.id}>
                          {getCarrierOptionLabel(carrier)}
                        </option>
                      ))}
                    </FormSelect>
                    <FormSelect label="기종" name="deviceModelId" defaultValue={policy.deviceModelId ?? ""}>
                      <option value="">선택 없음</option>
                      {deviceModels.map((deviceModel) => (
                        <option key={deviceModel.id} value={deviceModel.id}>
                          {getDeviceModelOptionLabel(deviceModel)}
                        </option>
                      ))}
                    </FormSelect>
                    <FormSelect label="할인 방식" name="discountMethod" defaultValue={policy.discountMethod} required>
                      <option value="PERCENTAGE">비율</option>
                      <option value="FIXED_AMOUNT">고정 금액</option>
                    </FormSelect>
                    <FormField label="할인 값" name="discountValue" type="number" min="0" defaultValue={policy.discountValue} required />
                    <FormField label="시작일" name="startsAt" type="date" defaultValue={formatKstDate(policy.startsAt)} required />
                    <FormField label="종료일" name="endsAt" type="date" defaultValue={formatKstDate(policy.endsAt)} required />
                    <FormTextArea label="메모" name="memo" wrapperClassName="md:col-span-2" defaultValue={policy.memo ?? ""} rows={3} />
                    <div className="flex flex-wrap items-center justify-between gap-3 md:col-span-2">
                      <p className="text-sm text-slate-500">
                        {policy.carrierName ?? "통신사 미지정"}
                        {policy.deviceModelName ? ` / ${policy.deviceModelName}` : ""}
                        {" / "}
                        {getDiscountMethodLabel(policy.discountMethod)}
                        {" / "}
                        {getDiscountValueLabel(policy.discountMethod, policy.discountValue)}
                        {" / "}
                        {formatKstDateRange(policy.startsAt, policy.endsAt)}
                      </p>
                      <SubmitButton label="저장" />
                    </div>
                  </form>

                  <div className="mt-3 flex justify-end">
                    <form action={toggleDiscountPolicyActiveAction}>
                      <input type="hidden" name="id" value={policy.id} />
                      <input type="hidden" name="nextActive" value={policy.isActive ? "false" : "true"} />
                      <ConfirmSubmitButton
                        confirmMessage={policy.isActive ? "이 할인 정책을 비활성화하시겠습니까?" : "이 할인 정책을 다시 활성화하시겠습니까?"}
                        className={`${secondaryButtonClassName} h-10 px-4`}
                      >
                        {policy.isActive ? "비활성화" : "활성화"}
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState message="등록된 할인 정책이 아직 없습니다." />
          )}
        </Panel>

        <Panel
          title="개통 가능 규칙"
          contentClassName="space-y-3"
          actions={<CreateToggle label={`목록 ${carrierActivationRules.length}개`} />}
        >
          <details className="rounded-[1.1rem] border border-stone-200 bg-white/90">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-900 marker:hidden">
              새 개통 규칙 추가
            </summary>
            <div className="border-t border-stone-200 px-4 pb-4 pt-4">
              <form action={upsertCarrierActivationRuleAction} className={`${surfaceClassName} ${formGridClassName}`}>
                <FormSelect label="통신사" name="carrierId" required>
                  <option value="">통신사를 선택해 주세요</option>
                  {carriers.map((carrier) => (
                    <option key={carrier.id} value={carrier.id}>
                      {getCarrierOptionLabel(carrier)}
                    </option>
                  ))}
                </FormSelect>
                <FormSelect label="계산 기준" name="countUnit" required>
                  <option value="DAY">일수 기준</option>
                  <option value="MONTH">개월 기준</option>
                </FormSelect>
                <FormField label="기준 값" name="countValue" type="number" min="1" placeholder="127 또는 4" required />
                <FormSelect label="개월 카운팅" name="monthCountMode">
                  <option value="">일수 기준일 때 사용 안 함</option>
                  <option value="INCLUDE_CURRENT_MONTH">당월 포함</option>
                  <option value="EXCLUDE_CURRENT_MONTH">당월 미포함</option>
                </FormSelect>
                <FormTextArea label="메모" name="memo" wrapperClassName="md:col-span-2" placeholder="예: KT 개통 후 127일 기준" rows={3} />
                <div className="flex justify-end md:col-span-2">
                  <SubmitButton label="개통 규칙 저장" />
                </div>
              </form>
            </div>
          </details>

          {carrierActivationRules.length > 0 ? (
            <div className="space-y-3">
              {carrierActivationRules.map((rule) => (
                <article key={rule.id} className={surfaceClassName}>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold text-slate-950">{rule.carrierName}</p>
                    <ActiveStatePill isActive={rule.isActive} />
                    <TonePill label={getActivationCountUnitLabel(rule.countUnit)} tone="amber" />
                  </div>

                  <form action={upsertCarrierActivationRuleAction} className={`mt-4 ${formGridClassName}`}>
                    <input type="hidden" name="id" value={rule.id} />
                    <FormSelect label="통신사" name="carrierId" defaultValue={rule.carrierId} required>
                      {carriers.map((carrier) => (
                        <option key={carrier.id} value={carrier.id}>
                          {getCarrierOptionLabel(carrier)}
                        </option>
                      ))}
                    </FormSelect>
                    <FormSelect label="계산 기준" name="countUnit" defaultValue={rule.countUnit} required>
                      <option value="DAY">일수 기준</option>
                      <option value="MONTH">개월 기준</option>
                    </FormSelect>
                    <FormField label="기준 값" name="countValue" type="number" min="1" defaultValue={rule.countValue} required />
                    <FormSelect label="개월 카운팅" name="monthCountMode" defaultValue={rule.monthCountMode ?? ""}>
                      <option value="">일수 기준일 때 사용 안 함</option>
                      <option value="INCLUDE_CURRENT_MONTH">당월 포함</option>
                      <option value="EXCLUDE_CURRENT_MONTH">당월 미포함</option>
                    </FormSelect>
                    <FormTextArea label="메모" name="memo" wrapperClassName="md:col-span-2" defaultValue={rule.memo ?? ""} rows={3} />
                    <div className="flex flex-wrap items-center justify-between gap-3 md:col-span-2">
                      <p className="text-sm text-slate-500">
                        {formatActivationRuleLabel({
                          countUnit: rule.countUnit,
                          countValue: rule.countValue,
                          monthCountMode: rule.monthCountMode,
                        })}
                      </p>
                      <SubmitButton label="저장" />
                    </div>
                  </form>

                  <div className="mt-3 flex justify-end">
                    <form action={toggleCarrierActivationRuleActiveAction}>
                      <input type="hidden" name="id" value={rule.id} />
                      <input type="hidden" name="nextActive" value={rule.isActive ? "false" : "true"} />
                      <ConfirmSubmitButton
                        confirmMessage={rule.isActive ? "이 개통 규칙을 비활성화하시겠습니까?" : "이 개통 규칙을 다시 활성화하시겠습니까?"}
                        className={`${secondaryButtonClassName} h-10 px-4`}
                      >
                        {rule.isActive ? "비활성화" : "활성화"}
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState message="등록된 개통 가능 규칙이 아직 없습니다." />
          )}
        </Panel>
      </section>
    </div>
  );
}
