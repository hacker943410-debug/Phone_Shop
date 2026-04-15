import {
  toggleAddOnServiceActiveAction,
  toggleCarrierActiveAction,
  toggleRatePlanActiveAction,
  toggleStoreActiveAction,
  upsertStoreAction,
  upsertAddOnServiceAction,
  upsertCarrierAction,
  upsertRatePlanAction,
  setDefaultStoreAction,
} from "@/app/actions/base-info";
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
import { formatWon } from "@/lib/formatters";

const editorCardClassName =
  "rounded-lg border border-stone-200 bg-stone-50 p-4 shadow-[0_1px_3px_rgba(15,23,42,0.05),0_1px_2px_rgba(15,23,42,0.08)]";

const formGridClassName = "grid gap-3 md:grid-cols-2";

export interface BaseInfoCarrierRecord {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  ratePlanCount: number;
  addOnServiceCount: number;
}

export interface BaseInfoStoreRecord {
  id: string;
  code: string;
  name: string;
  region: string | null;
  isActive: boolean;
  isDefault: boolean;
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
  stores: BaseInfoStoreRecord[];
  carriers: BaseInfoCarrierRecord[];
  ratePlans: BaseInfoRatePlanRecord[];
  addOnServices: BaseInfoAddOnServiceRecord[];
}

function getCarrierOptionLabel(carrier: BaseInfoCarrierRecord) {
  return carrier.isActive ? carrier.name : `${carrier.name} (비활성)`;
}

export function BaseInfoOverview({
  stores,
  carriers,
  ratePlans,
  addOnServices,
}: BaseInfoOverviewProps) {
  const activeStoreCount = stores.filter((store) => store.isActive).length;
  const activeCarrierCount = carriers.filter((carrier) => carrier.isActive).length;
  const activeRatePlanCount = ratePlans.filter((ratePlan) => ratePlan.isActive).length;
  const activeServiceCount = addOnServices.filter((service) => service.isActive).length;

  return (
    <div className="space-y-5 p-4 sm:p-5 lg:p-6">
      <PageIntro
        eyebrow="Base Info"
        title="통신사, 요금제, 부가서비스 기준 데이터를 이 화면에서 관리합니다"
        description="판매 입력에서 사용하는 기준 데이터를 여기서 직접 갱신합니다. 상단 등록 폼으로 빠르게 추가하고, 하단 목록에서 수정과 활성 상태를 함께 관리하도록 정리했습니다."
        actions={
          <>
            <ActionChip label={`활성 매장 ${activeStoreCount}`} tone="dark" />
            <ActionChip label="판매 선택지 + 매장 운영 기준 데이터" />
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="매장"
          value={`${activeStoreCount}개`}
          helper={`전체 ${stores.length}개 중 운영 가능한 매장 수`}
          accent="amber"
        />
        <MetricCard
          label="통신사"
          value={`${activeCarrierCount}개`}
          helper={`전체 ${carriers.length}개 중 판매 화면에 노출되는 통신사`}
          accent="amber"
        />
        <MetricCard
          label="요금제"
          value={`${activeRatePlanCount}개`}
          helper="통신사별 판매 선택지에서 바로 노출되는 요금제"
          accent="teal"
        />
        <MetricCard
          label="부가서비스"
          value={`${activeServiceCount}개`}
          helper="공통 서비스와 통신사 전용 서비스를 포함한 활성 항목 수"
          accent="slate"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Panel
          title="매장 관리"
          description="대시보드 매장별 실적과 재고 기본 귀속 기준을 여기서 관리합니다."
        >
          <div className="space-y-4">
            <form
              action={upsertStoreAction}
              className={`${editorCardClassName} ${formGridClassName}`}
            >
              <FormField
                label="매장 코드"
                name="code"
                placeholder="MAIN"
                autoComplete="off"
                required
              />
              <FormField
                label="매장명"
                name="name"
                placeholder="본점"
                autoComplete="off"
                required
              />
              <FormField
                label="권역"
                name="region"
                placeholder="수원"
                autoComplete="off"
              />
              <div className="flex justify-end md:col-span-2">
                <SubmitButton label="매장 추가" />
              </div>
            </form>

            <div className="space-y-3">
              {stores.length > 0 ? (
                stores.map((store) => (
                  <article key={store.id} className={editorCardClassName}>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-slate-950">
                        {store.name}
                      </p>
                      <ActiveStatePill isActive={store.isActive} />
                      <TonePill label={store.code} tone="slate" />
                      {store.isDefault ? <TonePill label="기본 매장" tone="teal" /> : null}
                    </div>

                    <form
                      action={upsertStoreAction}
                      className={`mt-4 ${formGridClassName}`}
                    >
                      <input type="hidden" name="id" value={store.id} />
                      <FormField
                        label="매장 코드"
                        name="code"
                        defaultValue={store.code}
                        autoComplete="off"
                        required
                      />
                      <FormField
                        label="매장명"
                        name="name"
                        defaultValue={store.name}
                        autoComplete="off"
                        required
                      />
                      <FormField
                        label="권역"
                        name="region"
                        defaultValue={store.region ?? ""}
                        autoComplete="off"
                      />
                      <div className="flex flex-wrap items-center justify-between gap-3 md:col-span-2">
                        <p className="text-sm text-slate-500">
                          {store.region ? `권역 ${store.region}` : "권역 미지정"} /{" "}
                          {store.isDefault ? "기본 귀속 매장" : "보조 매장"}
                        </p>
                        <SubmitButton label="매장 저장" />
                      </div>
                    </form>

                    <div className="mt-3 flex flex-wrap justify-end gap-2">
                      {!store.isDefault ? (
                        <form action={setDefaultStoreAction}>
                          <input type="hidden" name="id" value={store.id} />
                          <ConfirmSubmitButton
                            confirmMessage="이 매장을 기본 매장으로 설정하시겠습니까?"
                            className={`${secondaryButtonClassName} h-10 px-4`}
                          >
                            기본 매장 지정
                          </ConfirmSubmitButton>
                        </form>
                      ) : null}
                      <form action={toggleStoreActiveAction}>
                        <input type="hidden" name="id" value={store.id} />
                        <input
                          type="hidden"
                          name="nextActive"
                          value={store.isActive ? "false" : "true"}
                        />
                        <ConfirmSubmitButton
                          confirmMessage={
                            store.isActive
                              ? "이 매장을 비활성화하시겠습니까?"
                              : "이 매장을 다시 활성화하시겠습니까?"
                          }
                          className={`${secondaryButtonClassName} h-10 px-4`}
                        >
                          {store.isActive ? "비활성화" : "활성화"}
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  </article>
                ))
              ) : (
                <EmptyState message="등록된 매장이 아직 없습니다." />
              )}
            </div>
          </div>
        </Panel>

        <Panel
          title="통신사 관리"
          description="코드와 노출명을 등록하고, 아래 목록에서 수정과 활성 상태를 함께 관리합니다."
        >
          <div className="space-y-4">
            <form
              action={upsertCarrierAction}
              className={`${editorCardClassName} ${formGridClassName}`}
            >
              <FormField
                label="통신사 코드"
                name="code"
                placeholder="SKT"
                autoComplete="off"
                required
              />
              <FormField
                label="통신사명"
                name="name"
                placeholder="SK텔레콤"
                autoComplete="off"
                required
              />
              <div className="flex justify-end md:col-span-2">
                <SubmitButton label="통신사 추가" />
              </div>
            </form>

            <div className="space-y-3">
              {carriers.length > 0 ? (
                carriers.map((carrier) => (
                  <article key={carrier.id} className={editorCardClassName}>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-slate-950">
                        {carrier.name}
                      </p>
                      <ActiveStatePill isActive={carrier.isActive} />
                      <TonePill label={carrier.code} tone="slate" />
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
                      <div className="flex flex-wrap items-center justify-between gap-3 md:col-span-2">
                        <p className="text-sm text-slate-500">
                          연결 요금제 {carrier.ratePlanCount}개 / 부가서비스{" "}
                          {carrier.addOnServiceCount}개
                        </p>
                        <SubmitButton label="통신사 저장" />
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
                        <ConfirmSubmitButton
                          confirmMessage={
                            carrier.isActive
                              ? "이 통신사를 비활성화하시겠습니까?"
                              : "이 통신사를 다시 활성화하시겠습니까?"
                          }
                          className={`${secondaryButtonClassName} h-10 px-4`}
                        >
                          {carrier.isActive ? "비활성화" : "활성화"}
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  </article>
                ))
              ) : (
                <EmptyState message="등록된 통신사가 아직 없습니다." />
              )}
            </div>
          </div>
        </Panel>

        <Panel
          title="요금제 관리"
          description="상단에서 새 요금제를 등록하고, 하단에서 통신사 매핑과 월 요금 정보를 수정합니다."
        >
          <div className="space-y-4">
            <form
              action={upsertRatePlanAction}
              className={`${editorCardClassName} ${formGridClassName}`}
            >
              <FormSelect label="통신사" name="carrierId" required>
                <option value="">통신사를 선택해 주세요</option>
                {carriers.map((carrier) => (
                  <option key={carrier.id} value={carrier.id}>
                    {getCarrierOptionLabel(carrier)}
                  </option>
                ))}
              </FormSelect>
              <FormField
                label="요금제명"
                name="name"
                placeholder="5G 프리미어"
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
                placeholder="판매 화면 참고용 설명"
                rows={3}
              />
              <div className="flex justify-end md:col-span-2">
                <SubmitButton label="요금제 추가" />
              </div>
            </form>

            <div className="space-y-3">
              {ratePlans.length > 0 ? (
                ratePlans.map((ratePlan) => (
                  <article key={ratePlan.id} className={editorCardClassName}>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-slate-950">
                        {ratePlan.name}
                      </p>
                      <ActiveStatePill isActive={ratePlan.isActive} />
                      <span className="text-sm text-slate-500">
                        {ratePlan.carrierName}
                        {!ratePlan.carrierActive ? " / 통신사 비활성" : ""}
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
                      <div className="flex flex-wrap items-center justify-between gap-3 md:col-span-2">
                        <p className="text-sm text-slate-500">
                          기준 월 요금 {formatWon(ratePlan.monthlyFee)}
                        </p>
                        <SubmitButton label="요금제 저장" />
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
                        <ConfirmSubmitButton
                          confirmMessage={
                            ratePlan.isActive
                              ? "이 요금제를 비활성화하시겠습니까?"
                              : "이 요금제를 다시 활성화하시겠습니까?"
                          }
                          className={`${secondaryButtonClassName} h-10 px-4`}
                        >
                          {ratePlan.isActive ? "비활성화" : "활성화"}
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  </article>
                ))
              ) : (
                <EmptyState message="등록된 요금제가 아직 없습니다." />
              )}
            </div>
          </div>
        </Panel>

        <Panel
          title="부가서비스 관리"
          description="공통 항목과 통신사 전용 항목을 같은 화면에서 관리합니다."
        >
          <div className="space-y-4">
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
                placeholder="유심 보호"
                autoComplete="off"
                required
              />
              <FormField
                label="월 요금"
                name="monthlyFee"
                type="number"
                min="0"
                placeholder="비워두면 미정"
              />
              <FormTextArea
                label="설명"
                name="description"
                placeholder="현장 참고용 설명"
                rows={3}
              />
              <div className="flex justify-end md:col-span-2">
                <SubmitButton label="부가서비스 추가" />
              </div>
            </form>

            <div className="space-y-3">
              {addOnServices.length > 0 ? (
                addOnServices.map((service) => (
                  <article key={service.id} className={editorCardClassName}>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-slate-950">
                        {service.name}
                      </p>
                      <ActiveStatePill isActive={service.isActive} />
                      <span className="text-sm text-slate-500">
                        {service.carrierName ?? "전체 공통"}
                        {service.carrierActive === false ? " / 통신사 비활성" : ""}
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
                        placeholder="비워두면 미정"
                      />
                      <FormTextArea
                        label="설명"
                        name="description"
                        defaultValue={service.description ?? ""}
                        rows={3}
                      />
                      <div className="flex flex-wrap items-center justify-between gap-3 md:col-span-2">
                        <p className="text-sm text-slate-500">
                          월 요금{" "}
                          {service.monthlyFee !== null
                            ? formatWon(service.monthlyFee)
                            : "미정"}
                        </p>
                        <SubmitButton label="부가서비스 저장" />
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
                        <ConfirmSubmitButton
                          confirmMessage={
                            service.isActive
                              ? "이 부가서비스를 비활성화하시겠습니까?"
                              : "이 부가서비스를 다시 활성화하시겠습니까?"
                          }
                          className={`${secondaryButtonClassName} h-10 px-4`}
                        >
                          {service.isActive ? "비활성화" : "활성화"}
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  </article>
                ))
              ) : (
                <EmptyState message="등록된 부가서비스가 아직 없습니다." />
              )}
            </div>
          </div>
        </Panel>
      </section>
    </div>
  );
}
