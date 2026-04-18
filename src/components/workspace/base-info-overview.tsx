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

const surfaceClassName =
  "rounded-[1.25rem] border border-stone-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(245,243,239,0.96)_100%)] p-4 shadow-[0_18px_38px_-34px_rgba(15,23,42,0.24)]";

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

function CreateToggle({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[0.7rem] font-semibold text-slate-500">
      {label}
    </span>
  );
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
    <div className="flex flex-col gap-4 p-3 sm:p-4 2xl:p-5">
      <PageIntro
        eyebrow="Base Info"
        title="기초정보"
        className="shrink-0"
        actions={
          <>
            <ActionChip label={`활성 매장 ${activeStoreCount}`} tone="dark" />
            <ActionChip label={`활성 통신사 ${activeCarrierCount}`} />
            <ActionChip label={`요금제 ${activeRatePlanCount} / 부가서비스 ${activeServiceCount}`} />
          </>
        }
      />

      <section className="grid shrink-0 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="매장"
          value={`${activeStoreCount}개`}
          helper={`전체 ${stores.length}개 중 운영 가능 매장`}
          accent="amber"
        />
        <MetricCard
          label="통신사"
          value={`${activeCarrierCount}개`}
          helper={`전체 ${carriers.length}개 중 활성 통신사`}
          accent="amber"
        />
        <MetricCard
          label="요금제"
          value={`${activeRatePlanCount}개`}
          helper="판매 화면에 노출되는 활성 요금제"
          accent="teal"
        />
        <MetricCard
          label="부가서비스"
          value={`${activeServiceCount}개`}
          helper="통신사 전용 및 공통 서비스 포함"
          accent="slate"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="매장 관리"
          contentClassName="space-y-3"
          actions={<CreateToggle label={`목록 ${stores.length}개`} />}
        >
          <details className="rounded-[1.1rem] border border-stone-200 bg-white/90">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-900 marker:hidden">
              새 매장 추가
            </summary>
            <div className="border-t border-stone-200 px-4 pb-4 pt-4">
              <form action={upsertStoreAction} className={`${surfaceClassName} ${formGridClassName}`}>
                <FormField label="매장 코드" name="code" placeholder="MAIN" autoComplete="off" required />
                <FormField label="매장명" name="name" placeholder="본점" autoComplete="off" required />
                <FormField label="권역" name="region" placeholder="수원" autoComplete="off" />
                <div className="flex justify-end md:col-span-2">
                  <SubmitButton label="매장 추가" />
                </div>
              </form>
            </div>
          </details>

          {stores.length > 0 ? (
            <div className="space-y-3">
              {stores.map((store) => (
                <article key={store.id} className={surfaceClassName}>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold text-slate-950">{store.name}</p>
                    <ActiveStatePill isActive={store.isActive} />
                    <TonePill label={store.code} tone="slate" />
                    {store.isDefault ? <TonePill label="기본 매장" tone="teal" /> : null}
                  </div>

                  <form action={upsertStoreAction} className={`mt-4 ${formGridClassName}`}>
                    <input type="hidden" name="id" value={store.id} />
                    <FormField label="매장 코드" name="code" defaultValue={store.code} autoComplete="off" required />
                    <FormField label="매장명" name="name" defaultValue={store.name} autoComplete="off" required />
                    <FormField label="권역" name="region" defaultValue={store.region ?? ""} autoComplete="off" />
                    <div className="flex flex-wrap items-center justify-between gap-3 md:col-span-2">
                      <p className="text-sm text-slate-500">
                        {store.region ? `권역 ${store.region}` : "권역 미지정"} / {store.isDefault ? "기본 귀속" : "보조 매장"}
                      </p>
                      <SubmitButton label="저장" />
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
                          기본 지정
                        </ConfirmSubmitButton>
                      </form>
                    ) : null}
                    <form action={toggleStoreActiveAction}>
                      <input type="hidden" name="id" value={store.id} />
                      <input type="hidden" name="nextActive" value={store.isActive ? "false" : "true"} />
                      <ConfirmSubmitButton
                        confirmMessage={store.isActive ? "이 매장을 비활성화하시겠습니까?" : "이 매장을 다시 활성화하시겠습니까?"}
                        className={`${secondaryButtonClassName} h-10 px-4`}
                      >
                        {store.isActive ? "비활성화" : "활성화"}
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState message="등록된 매장이 아직 없습니다." />
          )}
        </Panel>

        <Panel
          title="통신사 관리"
          contentClassName="space-y-3"
          actions={<CreateToggle label={`목록 ${carriers.length}개`} />}
        >
          <details className="rounded-[1.1rem] border border-stone-200 bg-white/90">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-900 marker:hidden">
              새 통신사 추가
            </summary>
            <div className="border-t border-stone-200 px-4 pb-4 pt-4">
              <form action={upsertCarrierAction} className={`${surfaceClassName} ${formGridClassName}`}>
                <FormField label="통신사 코드" name="code" placeholder="SKT" autoComplete="off" required />
                <FormField label="통신사명" name="name" placeholder="SK텔레콤" autoComplete="off" required />
                <div className="flex justify-end md:col-span-2">
                  <SubmitButton label="통신사 추가" />
                </div>
              </form>
            </div>
          </details>

          {carriers.length > 0 ? (
            <div className="space-y-3">
              {carriers.map((carrier) => (
                <article key={carrier.id} className={surfaceClassName}>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold text-slate-950">{carrier.name}</p>
                    <ActiveStatePill isActive={carrier.isActive} />
                    <TonePill label={carrier.code} tone="slate" />
                  </div>

                  <form action={upsertCarrierAction} className={`mt-4 ${formGridClassName}`}>
                    <input type="hidden" name="id" value={carrier.id} />
                    <FormField label="코드" name="code" defaultValue={carrier.code} autoComplete="off" required />
                    <FormField label="이름" name="name" defaultValue={carrier.name} autoComplete="off" required />
                    <div className="flex flex-wrap items-center justify-between gap-3 md:col-span-2">
                      <p className="text-sm text-slate-500">
                        요금제 {carrier.ratePlanCount}개 / 부가서비스 {carrier.addOnServiceCount}개
                      </p>
                      <SubmitButton label="저장" />
                    </div>
                  </form>

                  <div className="mt-3 flex justify-end">
                    <form action={toggleCarrierActiveAction}>
                      <input type="hidden" name="id" value={carrier.id} />
                      <input type="hidden" name="nextActive" value={carrier.isActive ? "false" : "true"} />
                      <ConfirmSubmitButton
                        confirmMessage={carrier.isActive ? "이 통신사를 비활성화하시겠습니까?" : "이 통신사를 다시 활성화하시겠습니까?"}
                        className={`${secondaryButtonClassName} h-10 px-4`}
                      >
                        {carrier.isActive ? "비활성화" : "활성화"}
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState message="등록된 통신사가 아직 없습니다." />
          )}
        </Panel>

        <Panel
          title="요금제 관리"
          contentClassName="space-y-3"
          actions={<CreateToggle label={`목록 ${ratePlans.length}개`} />}
        >
          <details className="rounded-[1.1rem] border border-stone-200 bg-white/90">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-900 marker:hidden">
              새 요금제 추가
            </summary>
            <div className="border-t border-stone-200 px-4 pb-4 pt-4">
              <form action={upsertRatePlanAction} className={`${surfaceClassName} ${formGridClassName}`}>
                <FormSelect label="통신사" name="carrierId" required>
                  <option value="">통신사를 선택해 주세요</option>
                  {carriers.map((carrier) => (
                    <option key={carrier.id} value={carrier.id}>
                      {getCarrierOptionLabel(carrier)}
                    </option>
                  ))}
                </FormSelect>
                <FormField label="요금제명" name="name" placeholder="5G 프리미어" autoComplete="off" required />
                <FormField label="월 요금" name="monthlyFee" type="number" min="0" placeholder="95000" required />
                <FormTextArea label="설명" name="description" placeholder="판매 화면 참고용 설명" rows={3} />
                <div className="flex justify-end md:col-span-2">
                  <SubmitButton label="요금제 추가" />
                </div>
              </form>
            </div>
          </details>

          {ratePlans.length > 0 ? (
            <div className="space-y-3">
              {ratePlans.map((ratePlan) => (
                <article key={ratePlan.id} className={surfaceClassName}>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold text-slate-950">{ratePlan.name}</p>
                    <ActiveStatePill isActive={ratePlan.isActive} />
                    <span className="text-sm text-slate-500">
                      {ratePlan.carrierName}
                      {!ratePlan.carrierActive ? " / 통신사 비활성" : ""}
                    </span>
                  </div>

                  <form action={upsertRatePlanAction} className={`mt-4 ${formGridClassName}`}>
                    <input type="hidden" name="id" value={ratePlan.id} />
                    <FormSelect label="통신사" name="carrierId" defaultValue={ratePlan.carrierId} required>
                      {carriers.map((carrier) => (
                        <option key={carrier.id} value={carrier.id}>
                          {getCarrierOptionLabel(carrier)}
                        </option>
                      ))}
                    </FormSelect>
                    <FormField label="요금제명" name="name" defaultValue={ratePlan.name} autoComplete="off" required />
                    <FormField label="월 요금" name="monthlyFee" type="number" min="0" defaultValue={ratePlan.monthlyFee} required />
                    <FormTextArea label="설명" name="description" defaultValue={ratePlan.description ?? ""} rows={3} />
                    <div className="flex flex-wrap items-center justify-between gap-3 md:col-span-2">
                      <p className="text-sm text-slate-500">기준 월 요금 {formatWon(ratePlan.monthlyFee)}</p>
                      <SubmitButton label="저장" />
                    </div>
                  </form>

                  <div className="mt-3 flex justify-end">
                    <form action={toggleRatePlanActiveAction}>
                      <input type="hidden" name="id" value={ratePlan.id} />
                      <input type="hidden" name="nextActive" value={ratePlan.isActive ? "false" : "true"} />
                      <ConfirmSubmitButton
                        confirmMessage={ratePlan.isActive ? "이 요금제를 비활성화하시겠습니까?" : "이 요금제를 다시 활성화하시겠습니까?"}
                        className={`${secondaryButtonClassName} h-10 px-4`}
                      >
                        {ratePlan.isActive ? "비활성화" : "활성화"}
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState message="등록된 요금제가 아직 없습니다." />
          )}
        </Panel>

        <Panel
          title="부가서비스 관리"
          contentClassName="space-y-3"
          actions={<CreateToggle label={`목록 ${addOnServices.length}개`} />}
        >
          <details className="rounded-[1.1rem] border border-stone-200 bg-white/90">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-900 marker:hidden">
              새 부가서비스 추가
            </summary>
            <div className="border-t border-stone-200 px-4 pb-4 pt-4">
              <form action={upsertAddOnServiceAction} className={`${surfaceClassName} ${formGridClassName}`}>
                <FormSelect label="적용 통신사" name="carrierId">
                  <option value="">전체 공통</option>
                  {carriers.map((carrier) => (
                    <option key={carrier.id} value={carrier.id}>
                      {getCarrierOptionLabel(carrier)}
                    </option>
                  ))}
                </FormSelect>
                <FormField label="부가서비스명" name="name" placeholder="유심 보호" autoComplete="off" required />
                <FormField label="월 요금" name="monthlyFee" type="number" min="0" placeholder="비워두면 미정" />
                <FormTextArea label="설명" name="description" placeholder="현장 참고용 설명" rows={3} />
                <div className="flex justify-end md:col-span-2">
                  <SubmitButton label="부가서비스 추가" />
                </div>
              </form>
            </div>
          </details>

          {addOnServices.length > 0 ? (
            <div className="space-y-3">
              {addOnServices.map((service) => (
                <article key={service.id} className={surfaceClassName}>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold text-slate-950">{service.name}</p>
                    <ActiveStatePill isActive={service.isActive} />
                    <span className="text-sm text-slate-500">
                      {service.carrierName ?? "전체 공통"}
                      {service.carrierActive === false ? " / 통신사 비활성" : ""}
                    </span>
                  </div>

                  <form action={upsertAddOnServiceAction} className={`mt-4 ${formGridClassName}`}>
                    <input type="hidden" name="id" value={service.id} />
                    <FormSelect label="적용 통신사" name="carrierId" defaultValue={service.carrierId ?? ""}>
                      <option value="">전체 공통</option>
                      {carriers.map((carrier) => (
                        <option key={carrier.id} value={carrier.id}>
                          {getCarrierOptionLabel(carrier)}
                        </option>
                      ))}
                    </FormSelect>
                    <FormField label="부가서비스명" name="name" defaultValue={service.name} autoComplete="off" required />
                    <FormField
                      label="월 요금"
                      name="monthlyFee"
                      type="number"
                      min="0"
                      defaultValue={service.monthlyFee ?? undefined}
                      placeholder="비워두면 미정"
                    />
                    <FormTextArea label="설명" name="description" defaultValue={service.description ?? ""} rows={3} />
                    <div className="flex flex-wrap items-center justify-between gap-3 md:col-span-2">
                      <p className="text-sm text-slate-500">
                        월 요금 {service.monthlyFee !== null ? formatWon(service.monthlyFee) : "미정"}
                      </p>
                      <SubmitButton label="저장" />
                    </div>
                  </form>

                  <div className="mt-3 flex justify-end">
                    <form action={toggleAddOnServiceActiveAction}>
                      <input type="hidden" name="id" value={service.id} />
                      <input type="hidden" name="nextActive" value={service.isActive ? "false" : "true"} />
                      <ConfirmSubmitButton
                        confirmMessage={service.isActive ? "이 부가서비스를 비활성화하시겠습니까?" : "이 부가서비스를 다시 활성화하시겠습니까?"}
                        className={`${secondaryButtonClassName} h-10 px-4`}
                      >
                        {service.isActive ? "비활성화" : "활성화"}
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState message="등록된 부가서비스가 아직 없습니다." />
          )}
        </Panel>
      </section>
    </div>
  );
}
