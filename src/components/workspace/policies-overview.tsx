import {
  toggleDiscountPolicyActiveAction,
  toggleRebatePolicyActiveAction,
  toggleSaleProfitPolicyActiveAction,
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
  ToggleActiveButton,
} from "@/components/workspace/admin-form-controls";
import {
  ActionChip,
  MetricCard,
  PageIntro,
  Panel,
  TonePill,
} from "@/components/workspace/workspace-primitives";
import { formatKstDate, formatKstDateRange } from "@/lib/date-utils";
import { formatWon } from "@/lib/formatters";

const editorCardClassName =
  "rounded-[1.35rem] border border-slate-950/8 bg-stone-50/85 p-4 shadow-[0_12px_36px_-30px_rgba(15,23,42,0.35)]";

const formGridClassName = "grid gap-3 md:grid-cols-2";

type DiscountMethodValue = "PERCENTAGE" | "FIXED_AMOUNT";
type DiscountTargetValue = "CARRIER" | "DEVICE";
type RevenueCalculationMethodValue = "NONE" | "FIXED_AMOUNT" | "PERCENTAGE";

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

export interface PoliciesOverviewProps {
  carriers: PolicyCarrierOption[];
  deviceModels: PolicyDeviceModelOption[];
  rebatePolicies: RebatePolicyRecord[];
  saleProfitPolicies: SaleProfitPolicyRecord[];
  discountPolicies: DiscountPolicyRecord[];
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
  return target === "CARRIER" ? "통신사" : "단말기";
}

export function PoliciesOverview({
  carriers,
  deviceModels,
  rebatePolicies,
  saleProfitPolicies,
  discountPolicies,
}: PoliciesOverviewProps) {
  const activeRebateCount = rebatePolicies.filter((policy) => policy.isActive).length;
  const activeSaleProfitCount = saleProfitPolicies.filter(
    (policy) => policy.isActive,
  ).length;
  const activeDiscountCount = discountPolicies.filter((policy) => policy.isActive).length;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageIntro
        eyebrow="Policies"
        title="리베이트, 할인, 판매수익 규칙을 실제 데이터로 관리합니다."
        description="정책은 판매 시점의 적용값과 분리해 기준 데이터로 관리합니다. 활성 상태와 적용기간을 함께 저장해 판매 화면에서 선택 기준으로 바로 읽어 오도록 정리했습니다."
        actions={
          <>
            <ActionChip
              label={`활성 정책 ${activeRebateCount + activeSaleProfitCount + activeDiscountCount}개`}
              tone="dark"
            />
            <ActionChip label="기간 + 활성 상태 반영" />
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="리베이트"
          value={`${activeRebateCount}개`}
          helper="통신사 + 단말 조합 기준 기본 리베이트"
          accent="amber"
        />
        <MetricCard
          label="판매수익"
          value={`${activeSaleProfitCount}개`}
          helper="통신사별 고정 금액 또는 비율 규칙"
          accent="teal"
        />
        <MetricCard
          label="할인"
          value={`${activeDiscountCount}개`}
          helper="통신사 또는 단말기 기준 할인 정책"
          accent="slate"
        />
      </section>

      <Panel
        title="리베이트 정책"
        description="통신사와 단말기 조합에 따라 기본 리베이트를 관리합니다."
      >
        <form
          action={upsertRebatePolicyAction}
          className={`${editorCardClassName} ${formGridClassName}`}
        >
          <FormField
            label="정책명"
            name="name"
            placeholder="예: KT iPhone 16 리베이트"
            autoComplete="off"
            required
          />
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
            label="기본 리베이트"
            name="defaultRebateAmount"
            type="number"
            min="0"
            placeholder="310000"
            required
          />
          <FormField label="시작일" name="startsAt" type="date" required />
          <FormField label="종료일" name="endsAt" type="date" required />
          <FormTextArea
            label="메모"
            name="memo"
            wrapperClassName="md:col-span-2"
            placeholder="정책 운영 메모"
            rows={3}
          />
          <div className="md:col-span-2 flex justify-end">
            <SubmitButton label="리베이트 정책 추가" />
          </div>
        </form>

        <div className="mt-5 space-y-3">
          {rebatePolicies.length > 0 ? (
            rebatePolicies.map((policy) => (
              <article key={policy.id} className={editorCardClassName}>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-base font-semibold text-slate-950">
                    {policy.name}
                  </p>
                  <ActiveStatePill isActive={policy.isActive} />
                  <TonePill
                    label={`${policy.carrierName} · ${policy.deviceModelName}`}
                    tone="amber"
                  />
                </div>

                <form
                  action={upsertRebatePolicyAction}
                  className={`mt-4 ${formGridClassName}`}
                >
                  <input type="hidden" name="id" value={policy.id} />
                  <FormField
                    label="정책명"
                    name="name"
                    defaultValue={policy.name}
                    autoComplete="off"
                    required
                  />
                  <FormSelect
                    label="통신사"
                    name="carrierId"
                    defaultValue={policy.carrierId}
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
                    defaultValue={policy.deviceModelId}
                    required
                  >
                    {deviceModels.map((deviceModel) => (
                      <option key={deviceModel.id} value={deviceModel.id}>
                        {getDeviceModelOptionLabel(deviceModel)}
                      </option>
                    ))}
                  </FormSelect>
                  <FormField
                    label="기본 리베이트"
                    name="defaultRebateAmount"
                    type="number"
                    min="0"
                    defaultValue={policy.defaultRebateAmount}
                    required
                  />
                  <FormField
                    label="시작일"
                    name="startsAt"
                    type="date"
                    defaultValue={formatKstDate(policy.startsAt)}
                    required
                  />
                  <FormField
                    label="종료일"
                    name="endsAt"
                    type="date"
                    defaultValue={formatKstDate(policy.endsAt)}
                    required
                  />
                  <FormTextArea
                    label="메모"
                    name="memo"
                    wrapperClassName="md:col-span-2"
                    defaultValue={policy.memo ?? ""}
                    rows={3}
                  />
                  <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-slate-500">
                      적용기간 {formatKstDateRange(policy.startsAt, policy.endsAt)} ·{" "}
                      {formatWon(policy.defaultRebateAmount)}
                    </p>
                    <SubmitButton label="수정 저장" />
                  </div>
                </form>

                <div className="mt-3 flex justify-end">
                  <form action={toggleRebatePolicyActiveAction}>
                    <input type="hidden" name="id" value={policy.id} />
                    <input
                      type="hidden"
                      name="nextActive"
                      value={policy.isActive ? "false" : "true"}
                    />
                    <ToggleActiveButton isActive={policy.isActive} />
                  </form>
                </div>
              </article>
            ))
          ) : (
            <EmptyState message="등록된 리베이트 정책이 아직 없습니다." />
          )}
        </div>
      </Panel>

      <section className="grid gap-6 xl:grid-cols-2">
        <Panel
          title="판매수익 정책"
          description="통신사별 판매수익 계산 기준을 고정 금액, 비율, 미반영 중 하나로 관리합니다."
        >
          <form
            action={upsertSaleProfitPolicyAction}
            className={`${editorCardClassName} ${formGridClassName}`}
          >
            <FormField
              label="정책명"
              name="name"
              placeholder="예: SKT 판매수익 기본 정책"
              autoComplete="off"
              required
            />
            <FormSelect label="통신사" name="carrierId" required>
              <option value="">통신사를 선택하세요</option>
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
            <FormField
              label="계산 값"
              name="calculationValue"
              type="number"
              min="0"
              placeholder="예: 70000 또는 5"
            />
            <FormField label="시작일" name="startsAt" type="date" required />
            <FormField label="종료일" name="endsAt" type="date" required />
            <FormTextArea
              label="메모"
              name="memo"
              wrapperClassName="md:col-span-2"
              placeholder="계산 방식 설명"
              rows={3}
            />
            <div className="md:col-span-2 flex justify-end">
              <SubmitButton label="판매수익 정책 추가" />
            </div>
          </form>

          <div className="mt-5 space-y-3">
            {saleProfitPolicies.length > 0 ? (
              saleProfitPolicies.map((policy) => (
                <article key={policy.id} className={editorCardClassName}>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-base font-semibold text-slate-950">
                      {policy.name}
                    </p>
                    <ActiveStatePill isActive={policy.isActive} />
                    <TonePill label={policy.carrierName} tone="teal" />
                  </div>

                  <form
                    action={upsertSaleProfitPolicyAction}
                    className={`mt-4 ${formGridClassName}`}
                  >
                    <input type="hidden" name="id" value={policy.id} />
                    <FormField
                      label="정책명"
                      name="name"
                      defaultValue={policy.name}
                      autoComplete="off"
                      required
                    />
                    <FormSelect
                      label="통신사"
                      name="carrierId"
                      defaultValue={policy.carrierId}
                      required
                    >
                      {carriers.map((carrier) => (
                        <option key={carrier.id} value={carrier.id}>
                          {getCarrierOptionLabel(carrier)}
                        </option>
                      ))}
                    </FormSelect>
                    <FormSelect
                      label="계산 방식"
                      name="calculationMethod"
                      defaultValue={policy.calculationMethod}
                      required
                    >
                      <option value="NONE">미반영</option>
                      <option value="FIXED_AMOUNT">고정 금액</option>
                      <option value="PERCENTAGE">판매가 비율</option>
                    </FormSelect>
                    <FormField
                      label="계산 값"
                      name="calculationValue"
                      type="number"
                      min="0"
                      defaultValue={policy.calculationValue}
                    />
                    <FormField
                      label="시작일"
                      name="startsAt"
                      type="date"
                      defaultValue={formatKstDate(policy.startsAt)}
                      required
                    />
                    <FormField
                      label="종료일"
                      name="endsAt"
                      type="date"
                      defaultValue={formatKstDate(policy.endsAt)}
                      required
                    />
                    <FormTextArea
                      label="메모"
                      name="memo"
                      wrapperClassName="md:col-span-2"
                      defaultValue={policy.memo ?? ""}
                      rows={3}
                    />
                    <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm text-slate-500">
                        {getCalculationMethodLabel(policy.calculationMethod)} ·{" "}
                        {getCalculationValueLabel(
                          policy.calculationMethod,
                          policy.calculationValue,
                        )}{" "}
                        · {formatKstDateRange(policy.startsAt, policy.endsAt)}
                      </p>
                      <SubmitButton label="수정 저장" />
                    </div>
                  </form>

                  <div className="mt-3 flex justify-end">
                    <form action={toggleSaleProfitPolicyActiveAction}>
                      <input type="hidden" name="id" value={policy.id} />
                      <input
                        type="hidden"
                        name="nextActive"
                        value={policy.isActive ? "false" : "true"}
                      />
                      <ToggleActiveButton isActive={policy.isActive} />
                    </form>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState message="등록된 판매수익 정책이 아직 없습니다." />
            )}
          </div>
        </Panel>

        <Panel
          title="할인 정책"
          description="통신사 할인과 단말기 할인 정책을 분리해 관리합니다. 판매 화면에서는 이 목록을 기준으로 할인 제안값을 계산하게 됩니다."
        >
          <form
            action={upsertDiscountPolicyAction}
            className={`${editorCardClassName} ${formGridClassName}`}
          >
            <FormField
              label="정책명"
              name="name"
              placeholder="예: 갤럭시 S25 단말기 할인"
              autoComplete="off"
              required
            />
            <FormSelect label="정책 대상" name="target" required>
              <option value="CARRIER">통신사</option>
              <option value="DEVICE">단말기</option>
            </FormSelect>
            <FormSelect label="통신사" name="carrierId">
              <option value="">선택 안 함</option>
              {carriers.map((carrier) => (
                <option key={carrier.id} value={carrier.id}>
                  {getCarrierOptionLabel(carrier)}
                </option>
              ))}
            </FormSelect>
            <FormSelect label="단말기" name="deviceModelId">
              <option value="">선택 안 함</option>
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
            <FormField
              label="할인 값"
              name="discountValue"
              type="number"
              min="0"
              placeholder="예: 8 또는 80000"
              required
            />
            <FormField label="시작일" name="startsAt" type="date" required />
            <FormField label="종료일" name="endsAt" type="date" required />
            <FormTextArea
              label="메모"
              name="memo"
              wrapperClassName="md:col-span-2"
              placeholder="우선순위나 운영 메모"
              rows={3}
            />
            <div className="md:col-span-2 flex justify-end">
              <SubmitButton label="할인 정책 추가" />
            </div>
          </form>

          <div className="mt-5 space-y-3">
            {discountPolicies.length > 0 ? (
              discountPolicies.map((policy) => (
                <article key={policy.id} className={editorCardClassName}>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-base font-semibold text-slate-950">
                      {policy.name}
                    </p>
                    <ActiveStatePill isActive={policy.isActive} />
                    <TonePill
                      label={getDiscountTargetLabel(policy.target)}
                      tone="slate"
                    />
                  </div>

                  <form
                    action={upsertDiscountPolicyAction}
                    className={`mt-4 ${formGridClassName}`}
                  >
                    <input type="hidden" name="id" value={policy.id} />
                    <FormField
                      label="정책명"
                      name="name"
                      defaultValue={policy.name}
                      autoComplete="off"
                      required
                    />
                    <FormSelect
                      label="정책 대상"
                      name="target"
                      defaultValue={policy.target}
                      required
                    >
                      <option value="CARRIER">통신사</option>
                      <option value="DEVICE">단말기</option>
                    </FormSelect>
                    <FormSelect
                      label="통신사"
                      name="carrierId"
                      defaultValue={policy.carrierId ?? ""}
                    >
                      <option value="">선택 안 함</option>
                      {carriers.map((carrier) => (
                        <option key={carrier.id} value={carrier.id}>
                          {getCarrierOptionLabel(carrier)}
                        </option>
                      ))}
                    </FormSelect>
                    <FormSelect
                      label="단말기"
                      name="deviceModelId"
                      defaultValue={policy.deviceModelId ?? ""}
                    >
                      <option value="">선택 안 함</option>
                      {deviceModels.map((deviceModel) => (
                        <option key={deviceModel.id} value={deviceModel.id}>
                          {getDeviceModelOptionLabel(deviceModel)}
                        </option>
                      ))}
                    </FormSelect>
                    <FormSelect
                      label="할인 방식"
                      name="discountMethod"
                      defaultValue={policy.discountMethod}
                      required
                    >
                      <option value="PERCENTAGE">비율</option>
                      <option value="FIXED_AMOUNT">고정 금액</option>
                    </FormSelect>
                    <FormField
                      label="할인 값"
                      name="discountValue"
                      type="number"
                      min="0"
                      defaultValue={policy.discountValue}
                      required
                    />
                    <FormField
                      label="시작일"
                      name="startsAt"
                      type="date"
                      defaultValue={formatKstDate(policy.startsAt)}
                      required
                    />
                    <FormField
                      label="종료일"
                      name="endsAt"
                      type="date"
                      defaultValue={formatKstDate(policy.endsAt)}
                      required
                    />
                    <FormTextArea
                      label="메모"
                      name="memo"
                      wrapperClassName="md:col-span-2"
                      defaultValue={policy.memo ?? ""}
                      rows={3}
                    />
                    <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm text-slate-500">
                        {policy.carrierName ?? "통신사 미지정"}
                        {policy.deviceModelName ? ` · ${policy.deviceModelName}` : ""}
                        {" · "}
                        {getDiscountMethodLabel(policy.discountMethod)}
                        {" · "}
                        {getDiscountValueLabel(
                          policy.discountMethod,
                          policy.discountValue,
                        )}
                        {" · "}
                        {formatKstDateRange(policy.startsAt, policy.endsAt)}
                      </p>
                      <SubmitButton label="수정 저장" />
                    </div>
                  </form>

                  <div className="mt-3 flex justify-end">
                    <form action={toggleDiscountPolicyActiveAction}>
                      <input type="hidden" name="id" value={policy.id} />
                      <input
                        type="hidden"
                        name="nextActive"
                        value={policy.isActive ? "false" : "true"}
                      />
                      <ToggleActiveButton isActive={policy.isActive} />
                    </form>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState message="등록된 할인 정책이 아직 없습니다." />
            )}
          </div>
        </Panel>
      </section>
    </div>
  );
}
