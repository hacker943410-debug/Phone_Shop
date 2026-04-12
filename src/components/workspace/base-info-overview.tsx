import {
  toggleAddOnServiceActiveAction,
  toggleCarrierActiveAction,
  toggleRatePlanActiveAction,
  upsertAddOnServiceAction,
  upsertCarrierAction,
  upsertRatePlanAction,
} from "@/app/actions/base-info";
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
} from "@/components/workspace/workspace-primitives";
import { formatWon } from "@/lib/formatters";

const editorCardClassName =
  "rounded-[1.35rem] border border-slate-950/8 bg-stone-50/85 p-4 shadow-[0_12px_36px_-30px_rgba(15,23,42,0.35)]";

const formGridClassName = "grid gap-3 md:grid-cols-2";

export interface BaseInfoCarrierRecord {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  ratePlanCount: number;
  addOnServiceCount: number;
}

export interface BaseInfoRatePlanRecord {
  id: string;
  carrierId: string;
  carrierName: string;
  carrierActive: boolean;
  name: string;
  monthlyFee: number;
  description: string | null;
  isActive: boolean;
}

export interface BaseInfoAddOnServiceRecord {
  id: string;
  carrierId: string | null;
  carrierName: string | null;
  carrierActive: boolean | null;
  name: string;
  monthlyFee: number | null;
  description: string | null;
  isActive: boolean;
}

export interface BaseInfoOverviewProps {
  carriers: BaseInfoCarrierRecord[];
  ratePlans: BaseInfoRatePlanRecord[];
  addOnServices: BaseInfoAddOnServiceRecord[];
}

function getCarrierOptionLabel(carrier: BaseInfoCarrierRecord) {
  return carrier.isActive ? carrier.name : `${carrier.name} (비활성)`;
}

export function BaseInfoOverview({
  carriers,
  ratePlans,
  addOnServices,
}: BaseInfoOverviewProps) {
  const activeCarrierCount = carriers.filter((carrier) => carrier.isActive).length;
  const activeRatePlanCount = ratePlans.filter((ratePlan) => ratePlan.isActive).length;
  const activeServiceCount = addOnServices.filter((service) => service.isActive).length;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageIntro
        eyebrow="Base Info"
        title="판매 전 선택값을 실제 DB에서 관리하는 기초정보 허브."
        description="통신사, 요금제, 부가서비스를 관리자 화면에서 바로 등록하고 수정할 수 있게 연결했습니다. 판매 화면에서는 여기서 관리한 활성 데이터만 선택지로 사용합니다."
        actions={
          <>
            <ActionChip label={`활성 통신사 ${activeCarrierCount}`} tone="dark" />
            <ActionChip label="판매 선택값 DB 연동" />
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="통신사"
          value={`${activeCarrierCount}개`}
          helper={`전체 ${carriers.length}개 중 판매에 노출되는 통신사`}
          accent="amber"
        />
        <MetricCard
          label="요금제"
          value={`${activeRatePlanCount}개`}
          helper="통신사별 판매 선택지로 즉시 사용됩니다."
          accent="teal"
        />
        <MetricCard
          label="부가서비스"
          value={`${activeServiceCount}개`}
          helper="공통 또는 통신사 전용 항목을 분리해 관리합니다."
          accent="slate"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Panel
          title="통신사 관리"
          description="코드와 노출명을 함께 관리합니다. 비활성화하면 판매 화면 선택지에서 빠집니다."
        >
          <form
            action={upsertCarrierAction}
            className={`${editorCardClassName} ${formGridClassName}`}
          >
            <FormField
              label="통신사 코드"
              name="code"
              placeholder="예: SKT"
              autoComplete="off"
              required
            />
            <FormField
              label="통신사명"
              name="name"
              placeholder="예: SK텔레콤"
              autoComplete="off"
              required
            />
            <div className="md:col-span-2 flex justify-end">
              <SubmitButton label="통신사 추가" />
            </div>
          </form>

          <div className="mt-5 space-y-3">
            {carriers.length > 0 ? (
              carriers.map((carrier) => (
                <article key={carrier.id} className={editorCardClassName}>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-base font-semibold text-slate-950">
                      {carrier.name}
                    </p>
                    <ActiveStatePill isActive={carrier.isActive} />
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                      {carrier.code}
                    </span>
                  </div>

                  <form
                    action={upsertCarrierAction}
                    className={`mt-4 ${formGridClassName}`}
                  >
                    <input type="hidden" name="id" value={carrier.id} />
                    <FormField
                      label="코드"
                      name="code"
                      defaultValue={carrier.code}
                      autoComplete="off"
                      required
                    />
                    <FormField
                      label="이름"
                      name="name"
                      defaultValue={carrier.name}
                      autoComplete="off"
                      required
                    />
                    <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm text-slate-500">
                        연결된 요금제 {carrier.ratePlanCount}개, 부가서비스{" "}
                        {carrier.addOnServiceCount}개
                      </p>
                      <SubmitButton label="수정 저장" />
                    </div>
                  </form>

                  <div className="mt-3 flex justify-end">
                    <form action={toggleCarrierActiveAction}>
                      <input type="hidden" name="id" value={carrier.id} />
                      <input
                        type="hidden"
                        name="nextActive"
                        value={carrier.isActive ? "false" : "true"}
                      />
                      <ToggleActiveButton isActive={carrier.isActive} />
                    </form>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState message="등록된 통신사가 아직 없습니다." />
            )}
          </div>
        </Panel>

        <Panel
          title="요금제 관리"
          description="통신사와 월 요금을 함께 관리합니다. 판매 입력에서 그대로 선택하게 되는 기준값입니다."
        >
          <form
            action={upsertRatePlanAction}
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
            <FormField
              label="요금제명"
              name="name"
              placeholder="예: 5G 프리미어"
              autoComplete="off"
              required
            />
            <FormField
              label="월 요금"
              name="monthlyFee"
              type="number"
              min="0"
              placeholder="95000"
              required
            />
            <FormTextArea
              label="설명"
              name="description"
              placeholder="판매 화면에서 참고할 요금제 설명"
              rows={3}
            />
            <div className="md:col-span-2 flex justify-end">
              <SubmitButton label="요금제 추가" />
            </div>
          </form>

          <div className="mt-5 space-y-3">
            {ratePlans.length > 0 ? (
              ratePlans.map((ratePlan) => (
                <article key={ratePlan.id} className={editorCardClassName}>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-base font-semibold text-slate-950">
                      {ratePlan.name}
                    </p>
                    <ActiveStatePill isActive={ratePlan.isActive} />
                    <span className="text-sm text-slate-500">
                      {ratePlan.carrierName}
                      {!ratePlan.carrierActive ? " · 통신사 비활성" : ""}
                    </span>
                  </div>

                  <form
                    action={upsertRatePlanAction}
                    className={`mt-4 ${formGridClassName}`}
                  >
                    <input type="hidden" name="id" value={ratePlan.id} />
                    <FormSelect
                      label="통신사"
                      name="carrierId"
                      defaultValue={ratePlan.carrierId}
                      required
                    >
                      {carriers.map((carrier) => (
                        <option key={carrier.id} value={carrier.id}>
                          {getCarrierOptionLabel(carrier)}
                        </option>
                      ))}
                    </FormSelect>
                    <FormField
                      label="요금제명"
                      name="name"
                      defaultValue={ratePlan.name}
                      autoComplete="off"
                      required
                    />
                    <FormField
                      label="월 요금"
                      name="monthlyFee"
                      type="number"
                      min="0"
                      defaultValue={ratePlan.monthlyFee}
                      required
                    />
                    <FormTextArea
                      label="설명"
                      name="description"
                      defaultValue={ratePlan.description ?? ""}
                      rows={3}
                    />
                    <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm text-slate-500">
                        판매 기본요금 {formatWon(ratePlan.monthlyFee)}
                      </p>
                      <SubmitButton label="수정 저장" />
                    </div>
                  </form>

                  <div className="mt-3 flex justify-end">
                    <form action={toggleRatePlanActiveAction}>
                      <input type="hidden" name="id" value={ratePlan.id} />
                      <input
                        type="hidden"
                        name="nextActive"
                        value={ratePlan.isActive ? "false" : "true"}
                      />
                      <ToggleActiveButton isActive={ratePlan.isActive} />
                    </form>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState message="등록된 요금제가 아직 없습니다." />
            )}
          </div>
        </Panel>
      </section>

      <Panel
        title="부가서비스 관리"
        description="통신사 전용 항목과 전체 공통 항목을 함께 관리합니다. 월 요금은 비워 둘 수 있습니다."
      >
        <form
          action={upsertAddOnServiceAction}
          className={`${editorCardClassName} ${formGridClassName}`}
        >
          <FormSelect label="적용 통신사" name="carrierId">
            <option value="">전체 공통</option>
            {carriers.map((carrier) => (
              <option key={carrier.id} value={carrier.id}>
                {getCarrierOptionLabel(carrier)}
              </option>
            ))}
          </FormSelect>
          <FormField
            label="부가서비스명"
            name="name"
            placeholder="예: 단말 보험"
            autoComplete="off"
            required
          />
          <FormField
            label="월 요금"
            name="monthlyFee"
            type="number"
            min="0"
            placeholder="비우면 미정"
          />
          <FormTextArea
            label="설명"
            name="description"
            placeholder="현장에서 참고할 간단한 설명"
            rows={3}
          />
          <div className="md:col-span-2 flex justify-end">
            <SubmitButton label="부가서비스 추가" />
          </div>
        </form>

        <div className="mt-5 grid gap-3 xl:grid-cols-2">
          {addOnServices.length > 0 ? (
            addOnServices.map((service) => (
              <article key={service.id} className={editorCardClassName}>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-base font-semibold text-slate-950">
                    {service.name}
                  </p>
                  <ActiveStatePill isActive={service.isActive} />
                  <span className="text-sm text-slate-500">
                    {service.carrierName ?? "전체 공통"}
                    {service.carrierActive === false ? " · 통신사 비활성" : ""}
                  </span>
                </div>

                <form
                  action={upsertAddOnServiceAction}
                  className={`mt-4 ${formGridClassName}`}
                >
                  <input type="hidden" name="id" value={service.id} />
                  <FormSelect
                    label="적용 통신사"
                    name="carrierId"
                    defaultValue={service.carrierId ?? ""}
                  >
                    <option value="">전체 공통</option>
                    {carriers.map((carrier) => (
                      <option key={carrier.id} value={carrier.id}>
                        {getCarrierOptionLabel(carrier)}
                      </option>
                    ))}
                  </FormSelect>
                  <FormField
                    label="부가서비스명"
                    name="name"
                    defaultValue={service.name}
                    autoComplete="off"
                    required
                  />
                  <FormField
                    label="월 요금"
                    name="monthlyFee"
                    type="number"
                    min="0"
                    defaultValue={service.monthlyFee ?? undefined}
                    placeholder="비우면 미정"
                  />
                  <FormTextArea
                    label="설명"
                    name="description"
                    defaultValue={service.description ?? ""}
                    rows={3}
                  />
                  <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-slate-500">
                      월 요금{" "}
                      {service.monthlyFee !== null
                        ? formatWon(service.monthlyFee)
                        : "미정"}
                    </p>
                    <SubmitButton label="수정 저장" />
                  </div>
                </form>

                <div className="mt-3 flex justify-end">
                  <form action={toggleAddOnServiceActiveAction}>
                    <input type="hidden" name="id" value={service.id} />
                    <input
                      type="hidden"
                      name="nextActive"
                      value={service.isActive ? "false" : "true"}
                    />
                    <ToggleActiveButton isActive={service.isActive} />
                  </form>
                </div>
              </article>
            ))
          ) : (
            <EmptyState message="등록된 부가서비스가 아직 없습니다." />
          )}
        </div>
      </Panel>
    </div>
  );
}
