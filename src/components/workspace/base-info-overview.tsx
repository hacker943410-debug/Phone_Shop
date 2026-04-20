"use client";

import { useEffect, useState, type ReactNode } from "react";

import {
  createBackupAction,
  restoreBackupAction,
  saveBackupDirectoryAction,
  setDefaultStoreAction,
  toggleAddOnServiceActiveAction,
  toggleCarrierActiveAction,
  toggleRatePlanActiveAction,
  toggleStoreActiveAction,
  upsertAddOnServiceAction,
  upsertCarrierAction,
  upsertRatePlanAction,
  upsertStoreAction,
} from "@/app/actions/base-info";
import {
  ActiveStatePill,
  EmptyState,
  FormField,
  FormSelect,
  FormTextArea,
  SubmitButton,
} from "@/components/workspace/admin-form-controls";
import { ConfirmSubmitButton } from "@/components/workspace/confirm-submit-button";
import {
  joinClassNames,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/workspace/ui-classnames";
import { WorkspaceModalShell } from "@/components/workspace/workspace-modal-shell";
import {
  ActionChip,
  CarrierInlineLabel,
  CarrierTonePill,
  MetricCard,
  PageIntro,
  Panel,
  TonePill,
} from "@/components/workspace/workspace-primitives";
import {
  formatAllowanceValue,
  formatRatePlanAllowanceSummary,
  formatWon,
} from "@/lib/formatters";

const surfaceClassName =
  "rounded-[1.25rem] border border-stone-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(245,243,239,0.96)_100%)] p-4 shadow-[0_18px_38px_-34px_rgba(15,23,42,0.24)]";

const formGridClassName = "grid gap-3 md:grid-cols-2";

type BaseInfoTab =
  | "stores"
  | "carriers"
  | "ratePlans"
  | "addOnServices"
  | "backup"
  | "restore";

type BaseInfoModalState =
  | { entity: "store"; mode: "create" }
  | { entity: "carrier"; mode: "create" }
  | { entity: "ratePlan"; mode: "create" }
  | { entity: "addOnService"; mode: "create" }
  | { entity: "store"; mode: "edit"; id: string }
  | { entity: "carrier"; mode: "edit"; id: string }
  | { entity: "ratePlan"; mode: "edit"; id: string }
  | { entity: "addOnService"; mode: "edit"; id: string }
  | null;

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
  voiceCallMinutes: number | null;
  videoCallMinutes: number | null;
  dataAllowanceGb: number | null;
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

export interface BaseInfoBackupFileRecord {
  fileName: string;
  createdAtLabel: string;
  sizeLabel: string;
}

export interface BaseInfoBackupState {
  currentDirectory: string | null;
  defaultDirectory: string;
  sourceDatabasePath: string;
  backups: BaseInfoBackupFileRecord[];
}

export type BaseInfoNotice =
  | "backup-path-saved"
  | "backup-created"
  | "backup-restored"
  | "backup-path-required"
  | "backup-path-invalid"
  | "backup-create-failed"
  | "backup-file-missing"
  | "backup-restore-failed";

export interface BaseInfoOverviewProps {
  stores: BaseInfoStoreRecord[];
  carriers: BaseInfoCarrierRecord[];
  ratePlans: BaseInfoRatePlanRecord[];
  addOnServices: BaseInfoAddOnServiceRecord[];
  backupState: BaseInfoBackupState;
  initialTab: BaseInfoTab;
  notice: BaseInfoNotice | null;
}

type ServiceCarrierFilter = "all" | "shared" | string;
type NoticeTone = "success" | "error";

const backupNoticeMap: Record<
  BaseInfoNotice,
  { message: string; tone: NoticeTone }
> = {
  "backup-path-saved": {
    message: "백업 저장 경로를 저장했습니다.",
    tone: "success",
  },
  "backup-created": {
    message: "현재 SQLite 데이터를 백업 파일로 저장했습니다.",
    tone: "success",
  },
  "backup-restored": {
    message: "선택한 백업 파일로 현재 데이터를 복원했습니다.",
    tone: "success",
  },
  "backup-path-required": {
    message: "먼저 백업 경로를 저장한 뒤 다시 시도해 주세요.",
    tone: "error",
  },
  "backup-path-invalid": {
    message: "백업 경로를 만들 수 없습니다. 접근 가능한 경로인지 확인해 주세요.",
    tone: "error",
  },
  "backup-create-failed": {
    message: "백업 파일 생성에 실패했습니다. 경로와 파일 접근 권한을 확인해 주세요.",
    tone: "error",
  },
  "backup-file-missing": {
    message: "선택한 백업 파일을 찾지 못했습니다. 목록을 다시 확인해 주세요.",
    tone: "error",
  },
  "backup-restore-failed": {
    message: "백업 복원에 실패했습니다. 현재 경로와 파일 상태를 확인해 주세요.",
    tone: "error",
  },
};

function getCarrierOptionLabel(carrier: BaseInfoCarrierRecord) {
  return carrier.isActive ? carrier.name : `${carrier.name} (비활성)`;
}

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={joinClassNames(
        "inline-flex h-10 cursor-pointer items-center rounded-full border px-4 text-sm font-semibold transition duration-150 hover:-translate-y-px hover:shadow-[0_14px_24px_-22px_rgba(180,83,9,0.28)]",
        active
          ? "border-amber-300 bg-amber-50 text-amber-900 shadow-[0_14px_24px_-22px_rgba(180,83,9,0.42)] hover:border-amber-400 hover:bg-amber-100"
          : "border-stone-200 bg-white text-slate-600 hover:border-amber-200 hover:bg-amber-50/70 hover:text-amber-900",
      )}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function FilterButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={joinClassNames(
        "inline-flex h-9 items-center rounded-full border px-3 text-xs font-semibold transition duration-150",
        active
          ? "border-teal-300 bg-teal-50 text-teal-900 shadow-[0_14px_24px_-22px_rgba(13,148,136,0.36)]"
          : "border-stone-200 bg-white text-slate-600 hover:border-teal-200 hover:bg-teal-50/70 hover:text-teal-900",
      )}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function EditIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 20 20">
      <path
        d="M13.75 4.75a1.768 1.768 0 1 1 2.5 2.5L8.5 15H6v-2.5l7.75-7.75Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
      <path
        d="M11.75 6.75 14.25 9.25"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function ActionIconButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-teal-200 bg-teal-50 text-teal-700 transition duration-150 hover:-translate-y-px hover:border-teal-300 hover:bg-teal-100"
      onClick={onClick}
      title={label}
      type="button"
    >
      <EditIcon />
      <span className="sr-only">{label}</span>
    </button>
  );
}

function TableShell({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-[1.1rem] border border-stone-200">
      <table className="min-w-full text-left text-sm">{children}</table>
    </div>
  );
}

function TableHeader({
  headers,
}: {
  headers: Array<{ label: string; align?: "left" | "right" }>;
}) {
  return (
    <thead className="bg-stone-50 text-[0.7rem] uppercase tracking-[0.18em] text-slate-500">
      <tr>
        {headers.map((header) => (
          <th
            key={header.label}
            className={joinClassNames(
              "px-4 py-3 font-semibold",
              header.align === "right" ? "text-right" : "",
            )}
          >
            {header.label}
          </th>
        ))}
      </tr>
    </thead>
  );
}

function TableCell({
  align,
  children,
}: {
  align?: "left" | "right";
  children: ReactNode;
}) {
  return (
    <td
      className={joinClassNames(
        "px-4 py-3.5 align-top",
        align === "right" ? "text-right" : "",
      )}
    >
      {children}
    </td>
  );
}

function StoreForm({
  initialStore,
}: {
  initialStore?: BaseInfoStoreRecord | null;
}) {
  return (
    <form action={upsertStoreAction} className={`${surfaceClassName} ${formGridClassName}`}>
      {initialStore ? <input name="id" type="hidden" value={initialStore.id} /> : null}
      {initialStore ? (
        <FormField
          autoComplete="off"
          defaultValue={initialStore.code}
          label="매장 코드"
          name="code"
          placeholder="MAIN"
          required
        />
      ) : (
        <div className="space-y-2 rounded-[1.15rem] border border-dashed border-stone-300 bg-stone-50/90 px-4 py-3">
          <p className="text-sm font-medium text-slate-700">매장 코드</p>
          <p className="text-sm leading-6 text-slate-500">
            신규 매장 등록 시 매장 코드는 자동으로 부여됩니다.
          </p>
        </div>
      )}
      <FormField
        autoComplete="off"
        defaultValue={initialStore?.name ?? ""}
        label="매장명"
        name="name"
        placeholder="본점"
        required
      />
      <FormField
        autoComplete="off"
        defaultValue={initialStore?.region ?? ""}
        label="권역"
        name="region"
        placeholder="수원"
      />
      <div className="flex justify-end md:col-span-2">
        <SubmitButton label={initialStore ? "매장 저장" : "매장 등록"} />
      </div>
    </form>
  );
}

function CarrierForm({
  initialCarrier,
}: {
  initialCarrier?: BaseInfoCarrierRecord | null;
}) {
  return (
    <form action={upsertCarrierAction} className={`${surfaceClassName} ${formGridClassName}`}>
      {initialCarrier ? <input name="id" type="hidden" value={initialCarrier.id} /> : null}
      <FormField
        autoComplete="off"
        defaultValue={initialCarrier?.code ?? ""}
        label="통신사 코드"
        name="code"
        placeholder="SKT"
        required
      />
      <FormField
        autoComplete="off"
        defaultValue={initialCarrier?.name ?? ""}
        label="통신사명"
        name="name"
        placeholder="SK텔레콤"
        required
      />
      <div className="flex justify-end md:col-span-2">
        <SubmitButton label={initialCarrier ? "통신사 저장" : "통신사 등록"} />
      </div>
    </form>
  );
}

function RatePlanForm({
  carriers,
  initialRatePlan,
}: {
  carriers: BaseInfoCarrierRecord[];
  initialRatePlan?: BaseInfoRatePlanRecord | null;
}) {
  return (
    <form action={upsertRatePlanAction} className={`${surfaceClassName} ${formGridClassName}`}>
      {initialRatePlan ? <input name="id" type="hidden" value={initialRatePlan.id} /> : null}
      <FormSelect
        defaultValue={initialRatePlan?.carrierId ?? ""}
        label="통신사"
        name="carrierId"
        required
      >
        <option value="">통신사를 선택해 주세요</option>
        {carriers.map((carrier) => (
          <option key={carrier.id} value={carrier.id}>
            {getCarrierOptionLabel(carrier)}
          </option>
        ))}
      </FormSelect>
      <FormField
        autoComplete="off"
        defaultValue={initialRatePlan?.name ?? ""}
        label="요금제명"
        name="name"
        placeholder="5G 프리미어"
        required
      />
      <FormField
        defaultValue={initialRatePlan?.monthlyFee ?? ""}
        label="월 요금"
        min="0"
        name="monthlyFee"
        placeholder="95000"
        required
        type="number"
      />
      <FormField
        defaultValue={initialRatePlan?.voiceCallMinutes ?? ""}
        label="음성통화 (분)"
        min="0"
        name="voiceCallMinutes"
        placeholder="예: 300"
        required
        type="number"
      />
      <FormField
        defaultValue={initialRatePlan?.videoCallMinutes ?? ""}
        label="영상통화 (분)"
        min="0"
        name="videoCallMinutes"
        placeholder="예: 100"
        required
        type="number"
      />
      <FormField
        defaultValue={initialRatePlan?.dataAllowanceGb ?? ""}
        label="데이터 (GB)"
        min="0"
        name="dataAllowanceGb"
        placeholder="예: 110"
        required
        type="number"
      />
      <FormTextArea
        defaultValue={initialRatePlan?.description ?? ""}
        label="설명"
        name="description"
        placeholder="판매 화면 참고용 설명"
        rows={3}
      />
      <div className="flex justify-end md:col-span-2">
        <SubmitButton label={initialRatePlan ? "요금제 저장" : "요금제 등록"} />
      </div>
    </form>
  );
}

function AddOnServiceForm({
  carriers,
  initialService,
}: {
  carriers: BaseInfoCarrierRecord[];
  initialService?: BaseInfoAddOnServiceRecord | null;
}) {
  return (
    <form action={upsertAddOnServiceAction} className={`${surfaceClassName} ${formGridClassName}`}>
      {initialService ? <input name="id" type="hidden" value={initialService.id} /> : null}
      <FormSelect
        defaultValue={initialService?.carrierId ?? ""}
        label="적용 통신사"
        name="carrierId"
      >
        <option value="">전체 공통</option>
        {carriers.map((carrier) => (
          <option key={carrier.id} value={carrier.id}>
            {getCarrierOptionLabel(carrier)}
          </option>
        ))}
      </FormSelect>
      <FormField
        autoComplete="off"
        defaultValue={initialService?.name ?? ""}
        label="부가서비스명"
        name="name"
        placeholder="유심 보호"
        required
      />
      <FormField
        defaultValue={initialService?.monthlyFee ?? ""}
        label="월 요금"
        min="0"
        name="monthlyFee"
        placeholder="비워두면 미정"
        type="number"
      />
      <FormTextArea
        defaultValue={initialService?.description ?? ""}
        label="설명"
        name="description"
        placeholder="현장 참고용 설명"
        rows={3}
      />
      <div className="flex justify-end md:col-span-2">
        <SubmitButton label={initialService ? "부가서비스 저장" : "부가서비스 등록"} />
      </div>
    </form>
  );
}

function BackupNoticeBanner({ notice }: { notice: BaseInfoNotice }) {
  const noticeConfig = backupNoticeMap[notice];

  return (
    <section
      className={joinClassNames(
        "rounded-[1.2rem] border px-4 py-3 text-sm leading-6 shadow-[0_18px_32px_-30px_rgba(15,23,42,0.22)]",
        noticeConfig.tone === "success"
          ? "border-blue-200 bg-blue-50/80 text-blue-900"
          : "border-rose-200 bg-rose-50/85 text-rose-900",
      )}
    >
      {noticeConfig.message}
    </section>
  );
}

function BackupFilesTable({
  backups,
  actionLabel,
}: {
  backups: BaseInfoBackupFileRecord[];
  actionLabel?: (backup: BaseInfoBackupFileRecord) => ReactNode;
}) {
  if (backups.length === 0) {
    return <EmptyState message="저장된 백업 파일이 아직 없습니다." />;
  }

  return (
    <TableShell>
      <TableHeader
        headers={[
          { label: "백업 파일" },
          { label: "생성 시각" },
          { label: "용량" },
          ...(actionLabel ? [{ label: "작업", align: "right" as const }] : []),
        ]}
      />
      <tbody className="divide-y divide-stone-200 bg-white">
        {backups.map((backup) => (
          <tr key={backup.fileName} className="hover:bg-stone-50/70">
            <TableCell>
              <p className="font-semibold text-slate-950">{backup.fileName}</p>
            </TableCell>
            <TableCell>
              <p className="text-sm text-slate-600">{backup.createdAtLabel}</p>
            </TableCell>
            <TableCell>
              <p className="text-sm text-slate-600">{backup.sizeLabel}</p>
            </TableCell>
            {actionLabel ? <TableCell align="right">{actionLabel(backup)}</TableCell> : null}
          </tr>
        ))}
      </tbody>
    </TableShell>
  );
}

function BackupPanel({ backupState }: { backupState: BaseInfoBackupState }) {
  const hasConfiguredDirectory = Boolean(backupState.currentDirectory);

  return (
    <Panel
      title="백업"
      description="현재 SQLite 업무 데이터를 지정한 경로에 백업 파일로 저장합니다."
      actions={
        <div className="flex flex-wrap gap-2">
          <TonePill
            label={hasConfiguredDirectory ? "백업 경로 설정됨" : "백업 경로 미설정"}
            tone={hasConfiguredDirectory ? "teal" : "amber"}
          />
          <form action={createBackupAction}>
            <SubmitButton disabled={!hasConfiguredDirectory} label="지금 백업" />
          </form>
        </div>
      }
      contentClassName="space-y-4"
    >
      <form
        action={saveBackupDirectoryAction}
        className={`${surfaceClassName} grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end`}
      >
        <FormField
          autoComplete="off"
          defaultValue={backupState.currentDirectory ?? backupState.defaultDirectory}
          helper="상대 경로를 입력하면 현재 프로젝트 기준으로 저장 경로를 계산합니다."
          label="백업 경로"
          name="backupDirectory"
          placeholder={backupState.defaultDirectory}
          required
        />
        <div className="flex justify-end">
          <SubmitButton label="경로 저장" />
        </div>
      </form>

      <div className="grid gap-3 md:grid-cols-3">
        <article className={surfaceClassName}>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
            백업 대상
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-950">SQLite 데이터</p>
          <p className="mt-2 break-all text-sm leading-6 text-slate-600">
            {backupState.sourceDatabasePath}
          </p>
        </article>
        <article className={surfaceClassName}>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
            현재 저장 경로
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-950">
            {backupState.currentDirectory ? "설정 완료" : "설정 필요"}
          </p>
          <p className="mt-2 break-all text-sm leading-6 text-slate-600">
            {backupState.currentDirectory ?? backupState.defaultDirectory}
          </p>
        </article>
        <article className={surfaceClassName}>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
            운영 안내
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-950">마감 직후 권장</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            판매나 수납 마감 직후 백업을 만들면 복원 시점 관리가 가장 명확합니다.
          </p>
        </article>
      </div>

      <Panel title="저장된 백업 파일" contentClassName="space-y-3">
        <BackupFilesTable backups={backupState.backups} />
      </Panel>
    </Panel>
  );
}

function RestorePanel({ backupState }: { backupState: BaseInfoBackupState }) {
  const hasConfiguredDirectory = Boolean(backupState.currentDirectory);

  return (
    <Panel
      title="복원"
      description="선택한 백업 파일로 현재 SQLite 업무 데이터를 바로 덮어씁니다."
      actions={
        <TonePill
          label={hasConfiguredDirectory ? "복원 가능" : "경로 설정 필요"}
          tone={hasConfiguredDirectory ? "teal" : "amber"}
        />
      }
      contentClassName="space-y-4"
    >
      <div className="grid gap-3 md:grid-cols-3">
        <article className={surfaceClassName}>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
            복원 경로
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-950">
            {backupState.currentDirectory ?? "미설정"}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            백업 탭에서 저장한 경로의 파일만 복원 대상으로 사용합니다.
          </p>
        </article>
        <article className={surfaceClassName}>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
            현재 DB 파일
          </p>
          <p className="mt-2 break-all text-sm font-semibold text-slate-950">
            {backupState.sourceDatabasePath}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            복원 시 이 파일이 선택한 백업 내용으로 교체됩니다.
          </p>
        </article>
        <article className={surfaceClassName}>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
            주의
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-950">되돌리기 불가</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            복원 직전에 새 백업을 한 번 더 만든 뒤 진행하는 흐름을 권장합니다.
          </p>
        </article>
      </div>

      {!hasConfiguredDirectory ? (
        <EmptyState message="먼저 백업 탭에서 백업 경로를 저장해 주세요." />
      ) : (
        <BackupFilesTable
          backups={backupState.backups}
          actionLabel={(backup) => (
            <form action={restoreBackupAction}>
              <input name="fileName" type="hidden" value={backup.fileName} />
              <ConfirmSubmitButton
                className={`${secondaryButtonClassName} h-8 px-3 text-xs`}
                confirmMessage={`${backup.fileName} 백업으로 현재 업무 데이터를 복원하시겠습니까?`}
              >
                이 백업으로 복원
              </ConfirmSubmitButton>
            </form>
          )}
        />
      )}
    </Panel>
  );
}

export function BaseInfoOverview({
  stores,
  carriers,
  ratePlans,
  addOnServices,
  backupState,
  initialTab,
  notice,
}: BaseInfoOverviewProps) {
  const [activeTab, setActiveTab] = useState<BaseInfoTab>(initialTab);
  const [modalState, setModalState] = useState<BaseInfoModalState>(null);
  const [ratePlanCarrierFilter, setRatePlanCarrierFilter] = useState("all");
  const [addOnServiceCarrierFilter, setAddOnServiceCarrierFilter] =
    useState<ServiceCarrierFilter>("all");

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const activeStoreCount = stores.filter((store) => store.isActive).length;
  const activeCarrierCount = carriers.filter((carrier) => carrier.isActive).length;
  const activeRatePlanCount = ratePlans.filter((ratePlan) => ratePlan.isActive).length;
  const activeServiceCount = addOnServices.filter((service) => service.isActive).length;

  const activeStore =
    modalState?.entity === "store" && modalState.mode === "edit"
      ? stores.find((store) => store.id === modalState.id) ?? null
      : null;
  const activeCarrier =
    modalState?.entity === "carrier" && modalState.mode === "edit"
      ? carriers.find((carrier) => carrier.id === modalState.id) ?? null
      : null;
  const activeRatePlan =
    modalState?.entity === "ratePlan" && modalState.mode === "edit"
      ? ratePlans.find((ratePlan) => ratePlan.id === modalState.id) ?? null
      : null;
  const activeService =
    modalState?.entity === "addOnService" && modalState.mode === "edit"
      ? addOnServices.find((service) => service.id === modalState.id) ?? null
      : null;
  const filteredRatePlans = ratePlans.filter(
    (ratePlan) =>
      ratePlanCarrierFilter === "all" || ratePlan.carrierId === ratePlanCarrierFilter,
  );
  const filteredAddOnServices = addOnServices.filter((service) => {
    if (addOnServiceCarrierFilter === "all") {
      return true;
    }

    if (addOnServiceCarrierFilter === "shared") {
      return service.carrierId === null;
    }

    return service.carrierId === addOnServiceCarrierFilter;
  });
  const hasSharedAddOnServices = addOnServices.some((service) => service.carrierId === null);

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
            <ActionChip
              label={`요금제 ${activeRatePlanCount} / 부가서비스 ${activeServiceCount}`}
            />
          </>
        }
      />

      {notice ? <BackupNoticeBanner notice={notice} /> : null}

      <section className="grid shrink-0 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          accent="amber"
          helper={`전체 ${stores.length}개 중 운영 가능 매장`}
          label="매장"
          value={`${activeStoreCount}개`}
        />
        <MetricCard
          accent="amber"
          helper={`전체 ${carriers.length}개 중 활성 통신사`}
          label="통신사"
          value={`${activeCarrierCount}개`}
        />
        <MetricCard
          accent="teal"
          helper="판매 화면에 노출되는 활성 요금제"
          label="요금제"
          value={`${activeRatePlanCount}개`}
        />
        <MetricCard
          accent="slate"
          helper="통신사 전용 및 공통 서비스 포함"
          label="부가서비스"
          value={`${activeServiceCount}개`}
        />
      </section>

      <Panel title="관리 메뉴" contentClassName="space-y-4">
        <div className="flex flex-wrap gap-2">
          <TabButton
            active={activeTab === "stores"}
            label="매장 관리"
            onClick={() => setActiveTab("stores")}
          />
          <TabButton
            active={activeTab === "carriers"}
            label="통신사 관리"
            onClick={() => setActiveTab("carriers")}
          />
          <TabButton
            active={activeTab === "ratePlans"}
            label="요금제 관리"
            onClick={() => setActiveTab("ratePlans")}
          />
          <TabButton
            active={activeTab === "addOnServices"}
            label="부가서비스 관리"
            onClick={() => setActiveTab("addOnServices")}
          />
          <TabButton
            active={activeTab === "backup"}
            label="백업"
            onClick={() => setActiveTab("backup")}
          />
          <TabButton
            active={activeTab === "restore"}
            label="복원"
            onClick={() => setActiveTab("restore")}
          />
        </div>

        {activeTab === "stores" ? (
          <Panel
            title="매장 관리"
            actions={
              <div className="flex flex-wrap gap-2">
                <TonePill label={`목록 ${stores.length}개`} tone="slate" />
                <button
                  className={`${primaryButtonClassName} h-10 px-4`}
                  onClick={() => setModalState({ entity: "store", mode: "create" })}
                  type="button"
                >
                  신규 매장 등록
                </button>
              </div>
            }
            contentClassName="space-y-3"
          >
            {stores.length > 0 ? (
              <TableShell>
                <TableHeader
                  headers={[
                    { label: "매장" },
                    { label: "코드" },
                    { label: "권역" },
                    { label: "상태" },
                    { label: "기본" },
                    { label: "작업", align: "right" },
                  ]}
                />
                <tbody className="divide-y divide-stone-200 bg-white">
                  {stores.map((store) => (
                    <tr key={store.id} className="hover:bg-stone-50/70">
                      <TableCell>
                        <p className="font-semibold text-slate-950">{store.name}</p>
                      </TableCell>
                      <TableCell>
                        <TonePill label={store.code} tone="slate" />
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-600">
                          {store.region ?? "미지정"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <ActiveStatePill isActive={store.isActive} />
                      </TableCell>
                      <TableCell>
                        {store.isDefault ? (
                          <TonePill label="기본 매장" tone="teal" />
                        ) : (
                          <span className="text-sm text-slate-400">보조 매장</span>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <div className="flex justify-end gap-2">
                          {!store.isDefault ? (
                            <form action={setDefaultStoreAction}>
                              <input name="id" type="hidden" value={store.id} />
                              <ConfirmSubmitButton
                                className={`${secondaryButtonClassName} h-8 px-3 text-xs`}
                                confirmMessage="이 매장을 기본 매장으로 설정하시겠습니까?"
                              >
                                기본 지정
                              </ConfirmSubmitButton>
                            </form>
                          ) : null}
                          <form action={toggleStoreActiveAction}>
                            <input name="id" type="hidden" value={store.id} />
                            <input
                              name="nextActive"
                              type="hidden"
                              value={store.isActive ? "false" : "true"}
                            />
                            <ConfirmSubmitButton
                              className={`${secondaryButtonClassName} h-8 px-3 text-xs`}
                              confirmMessage={
                                store.isActive
                                  ? "이 매장을 비활성화하시겠습니까?"
                                  : "이 매장을 다시 활성화하시겠습니까?"
                              }
                            >
                              {store.isActive ? "비활성화" : "활성화"}
                            </ConfirmSubmitButton>
                          </form>
                          <ActionIconButton
                            label={`${store.name} 수정`}
                            onClick={() =>
                              setModalState({
                                entity: "store",
                                mode: "edit",
                                id: store.id,
                              })
                            }
                          />
                        </div>
                      </TableCell>
                    </tr>
                  ))}
                </tbody>
              </TableShell>
            ) : (
              <EmptyState message="등록된 매장이 아직 없습니다." />
            )}
          </Panel>
        ) : null}

        {activeTab === "carriers" ? (
          <Panel
            title="통신사 관리"
            actions={
              <div className="flex flex-wrap gap-2">
                <TonePill label={`목록 ${carriers.length}개`} tone="slate" />
                <button
                  className={`${primaryButtonClassName} h-10 px-4`}
                  onClick={() => setModalState({ entity: "carrier", mode: "create" })}
                  type="button"
                >
                  신규 통신사 등록
                </button>
              </div>
            }
            contentClassName="space-y-3"
          >
            {carriers.length > 0 ? (
              <TableShell>
                <TableHeader
                  headers={[
                    { label: "통신사" },
                    { label: "코드" },
                    { label: "요금제" },
                    { label: "부가서비스" },
                    { label: "상태" },
                    { label: "작업", align: "right" },
                  ]}
                />
                <tbody className="divide-y divide-stone-200 bg-white">
                  {carriers.map((carrier) => (
                    <tr key={carrier.id} className="hover:bg-stone-50/70">
                      <TableCell>
                        <CarrierInlineLabel label={carrier.name} />
                      </TableCell>
                      <TableCell>
                        <TonePill label={carrier.code} tone="slate" />
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-600">
                          {carrier.ratePlanCount}개
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-600">
                          {carrier.addOnServiceCount}개
                        </span>
                      </TableCell>
                      <TableCell>
                        <ActiveStatePill isActive={carrier.isActive} />
                      </TableCell>
                      <TableCell align="right">
                        <div className="flex justify-end gap-2">
                          <form action={toggleCarrierActiveAction}>
                            <input name="id" type="hidden" value={carrier.id} />
                            <input
                              name="nextActive"
                              type="hidden"
                              value={carrier.isActive ? "false" : "true"}
                            />
                            <ConfirmSubmitButton
                              className={`${secondaryButtonClassName} h-8 px-3 text-xs`}
                              confirmMessage={
                                carrier.isActive
                                  ? "이 통신사를 비활성화하시겠습니까?"
                                  : "이 통신사를 다시 활성화하시겠습니까?"
                              }
                            >
                              {carrier.isActive ? "비활성화" : "활성화"}
                            </ConfirmSubmitButton>
                          </form>
                          <ActionIconButton
                            label={`${carrier.name} 수정`}
                            onClick={() =>
                              setModalState({
                                entity: "carrier",
                                mode: "edit",
                                id: carrier.id,
                              })
                            }
                          />
                        </div>
                      </TableCell>
                    </tr>
                  ))}
                </tbody>
              </TableShell>
            ) : (
              <EmptyState message="등록된 통신사가 아직 없습니다." />
            )}
          </Panel>
        ) : null}

        {activeTab === "ratePlans" ? (
          <Panel
            title="요금제 관리"
            actions={
              <div className="flex flex-wrap gap-2">
                <TonePill
                  label={`목록 ${filteredRatePlans.length}개 / 전체 ${ratePlans.length}개`}
                  tone="slate"
                />
                <button
                  className={`${primaryButtonClassName} h-10 px-4`}
                  onClick={() => setModalState({ entity: "ratePlan", mode: "create" })}
                  type="button"
                >
                  신규 요금제 등록
                </button>
              </div>
            }
            contentClassName="space-y-3"
          >
            <div className="flex flex-wrap gap-2">
              <FilterButton
                active={ratePlanCarrierFilter === "all"}
                label="전체"
                onClick={() => setRatePlanCarrierFilter("all")}
              />
              {carriers.map((carrier) => (
                <FilterButton
                  key={carrier.id}
                  active={ratePlanCarrierFilter === carrier.id}
                  label={carrier.name}
                  onClick={() => setRatePlanCarrierFilter(carrier.id)}
                />
              ))}
            </div>
            {filteredRatePlans.length > 0 ? (
              <TableShell>
                <TableHeader
                  headers={[
                    { label: "요금제" },
                    { label: "통신사" },
                    { label: "월 요금" },
                    { label: "음성통화" },
                    { label: "영상통화" },
                    { label: "데이터" },
                    { label: "상태" },
                    { label: "설명" },
                    { label: "작업", align: "right" },
                  ]}
                />
                <tbody className="divide-y divide-stone-200 bg-white">
                  {filteredRatePlans.map((ratePlan) => (
                    <tr key={ratePlan.id} className="hover:bg-stone-50/70">
                      <TableCell>
                        <p className="font-semibold text-slate-950">{ratePlan.name}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <CarrierTonePill label={ratePlan.carrierName} />
                          {!ratePlan.carrierActive ? (
                            <TonePill label="통신사 비활성" tone="slate" />
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-600">
                          {formatWon(ratePlan.monthlyFee)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-600">
                          {formatAllowanceValue(ratePlan.voiceCallMinutes, "분")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-600">
                          {formatAllowanceValue(ratePlan.videoCallMinutes, "분")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-600">
                          {formatAllowanceValue(ratePlan.dataAllowanceGb, "GB")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <ActiveStatePill isActive={ratePlan.isActive} />
                      </TableCell>
                      <TableCell>
                        <p className="max-w-xs text-sm leading-6 text-slate-600">
                          {ratePlan.description?.trim() || "설명 없음"}
                        </p>
                        <p className="mt-1 max-w-xs text-xs leading-5 text-slate-400">
                          {formatRatePlanAllowanceSummary(ratePlan)}
                        </p>
                      </TableCell>
                      <TableCell align="right">
                        <div className="flex justify-end gap-2">
                          <form action={toggleRatePlanActiveAction}>
                            <input name="id" type="hidden" value={ratePlan.id} />
                            <input
                              name="nextActive"
                              type="hidden"
                              value={ratePlan.isActive ? "false" : "true"}
                            />
                            <ConfirmSubmitButton
                              className={`${secondaryButtonClassName} h-8 px-3 text-xs`}
                              confirmMessage={
                                ratePlan.isActive
                                  ? "이 요금제를 비활성화하시겠습니까?"
                                  : "이 요금제를 다시 활성화하시겠습니까?"
                              }
                            >
                              {ratePlan.isActive ? "비활성화" : "활성화"}
                            </ConfirmSubmitButton>
                          </form>
                          <ActionIconButton
                            label={`${ratePlan.name} 수정`}
                            onClick={() =>
                              setModalState({
                                entity: "ratePlan",
                                mode: "edit",
                                id: ratePlan.id,
                              })
                            }
                          />
                        </div>
                      </TableCell>
                    </tr>
                  ))}
                </tbody>
              </TableShell>
            ) : (
              <EmptyState message="선택한 조건에 맞는 요금제가 없습니다." />
            )}
          </Panel>
        ) : null}

        {activeTab === "addOnServices" ? (
          <Panel
            title="부가서비스 관리"
            actions={
              <div className="flex flex-wrap gap-2">
                <TonePill
                  label={`목록 ${filteredAddOnServices.length}개 / 전체 ${addOnServices.length}개`}
                  tone="slate"
                />
                <button
                  className={`${primaryButtonClassName} h-10 px-4`}
                  onClick={() =>
                    setModalState({ entity: "addOnService", mode: "create" })
                  }
                  type="button"
                >
                  신규 부가서비스 등록
                </button>
              </div>
            }
            contentClassName="space-y-3"
          >
            <div className="flex flex-wrap gap-2">
              <FilterButton
                active={addOnServiceCarrierFilter === "all"}
                label="전체"
                onClick={() => setAddOnServiceCarrierFilter("all")}
              />
              {hasSharedAddOnServices ? (
                <FilterButton
                  active={addOnServiceCarrierFilter === "shared"}
                  label="공통"
                  onClick={() => setAddOnServiceCarrierFilter("shared")}
                />
              ) : null}
              {carriers.map((carrier) => (
                <FilterButton
                  key={carrier.id}
                  active={addOnServiceCarrierFilter === carrier.id}
                  label={carrier.name}
                  onClick={() => setAddOnServiceCarrierFilter(carrier.id)}
                />
              ))}
            </div>
            {filteredAddOnServices.length > 0 ? (
              <TableShell>
                <TableHeader
                  headers={[
                    { label: "부가서비스" },
                    { label: "적용 통신사" },
                    { label: "월 요금" },
                    { label: "상태" },
                    { label: "설명" },
                    { label: "작업", align: "right" },
                  ]}
                />
                <tbody className="divide-y divide-stone-200 bg-white">
                  {filteredAddOnServices.map((service) => (
                    <tr key={service.id} className="hover:bg-stone-50/70">
                      <TableCell>
                        <p className="font-semibold text-slate-950">{service.name}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {service.carrierName ? (
                            <CarrierTonePill label={service.carrierName} />
                          ) : (
                            <TonePill label="전체 공통" tone="amber" />
                          )}
                          {service.carrierActive === false ? (
                            <TonePill label="통신사 비활성" tone="slate" />
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-600">
                          {service.monthlyFee !== null
                            ? formatWon(service.monthlyFee)
                            : "미정"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <ActiveStatePill isActive={service.isActive} />
                      </TableCell>
                      <TableCell>
                        <p className="max-w-xs text-sm leading-6 text-slate-600">
                          {service.description?.trim() || "설명 없음"}
                        </p>
                      </TableCell>
                      <TableCell align="right">
                        <div className="flex justify-end gap-2">
                          <form action={toggleAddOnServiceActiveAction}>
                            <input name="id" type="hidden" value={service.id} />
                            <input
                              name="nextActive"
                              type="hidden"
                              value={service.isActive ? "false" : "true"}
                            />
                            <ConfirmSubmitButton
                              className={`${secondaryButtonClassName} h-8 px-3 text-xs`}
                              confirmMessage={
                                service.isActive
                                  ? "이 부가서비스를 비활성화하시겠습니까?"
                                  : "이 부가서비스를 다시 활성화하시겠습니까?"
                              }
                            >
                              {service.isActive ? "비활성화" : "활성화"}
                            </ConfirmSubmitButton>
                          </form>
                          <ActionIconButton
                            label={`${service.name} 수정`}
                            onClick={() =>
                              setModalState({
                                entity: "addOnService",
                                mode: "edit",
                                id: service.id,
                              })
                            }
                          />
                        </div>
                      </TableCell>
                    </tr>
                  ))}
                </tbody>
              </TableShell>
            ) : (
              <EmptyState message="선택한 조건에 맞는 부가서비스가 없습니다." />
            )}
          </Panel>
        ) : null}

        {activeTab === "backup" ? <BackupPanel backupState={backupState} /> : null}

        {activeTab === "restore" ? <RestorePanel backupState={backupState} /> : null}
      </Panel>

      {modalState?.entity === "store" ? (
        <WorkspaceModalShell
          contentClassName="sm:px-6"
          maxWidthClassName="max-w-3xl"
          onClose={() => setModalState(null)}
          subtitle="매장"
          title={modalState.mode === "create" ? "신규 매장 등록" : "매장 수정"}
        >
          <StoreForm initialStore={activeStore} />
        </WorkspaceModalShell>
      ) : null}

      {modalState?.entity === "carrier" ? (
        <WorkspaceModalShell
          contentClassName="sm:px-6"
          maxWidthClassName="max-w-3xl"
          onClose={() => setModalState(null)}
          subtitle="통신사"
          title={modalState.mode === "create" ? "신규 통신사 등록" : "통신사 수정"}
        >
          <CarrierForm initialCarrier={activeCarrier} />
        </WorkspaceModalShell>
      ) : null}

      {modalState?.entity === "ratePlan" ? (
        <WorkspaceModalShell
          contentClassName="sm:px-6"
          maxWidthClassName="max-w-3xl"
          onClose={() => setModalState(null)}
          subtitle="요금제"
          title={modalState.mode === "create" ? "신규 요금제 등록" : "요금제 수정"}
        >
          <RatePlanForm carriers={carriers} initialRatePlan={activeRatePlan} />
        </WorkspaceModalShell>
      ) : null}

      {modalState?.entity === "addOnService" ? (
        <WorkspaceModalShell
          contentClassName="sm:px-6"
          maxWidthClassName="max-w-3xl"
          onClose={() => setModalState(null)}
          subtitle="부가서비스"
          title={
            modalState.mode === "create"
              ? "신규 부가서비스 등록"
              : "부가서비스 수정"
          }
        >
          <AddOnServiceForm carriers={carriers} initialService={activeService} />
        </WorkspaceModalShell>
      ) : null}
    </div>
  );
}
