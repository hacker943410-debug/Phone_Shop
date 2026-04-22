"use client";

import { useEffect, useState } from "react";

import {
  primaryButtonClassName,
  secondaryButtonClassName,
  joinClassNames,
} from "@/components/workspace/ui-classnames";
import { WorkspaceModalShell } from "@/components/workspace/workspace-modal-shell";

export type WorkspaceAlertTone = "success" | "error" | "warning" | "info";

interface WorkspaceAlertDialogProps {
  message: string;
  onClose: () => void;
  open: boolean;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  subtitle?: string;
  title?: string;
  tone?: WorkspaceAlertTone;
}

interface WorkspaceMessageModalProps {
  message: string | null | undefined;
  primaryActionLabel?: string;
  signal?: unknown;
  subtitle?: string;
  title?: string;
  tone?: WorkspaceAlertTone;
}

const alertToneStyles = {
  success: {
    accentClassName: "border-blue-200 bg-blue-50 text-blue-900",
    iconClassName: "bg-blue-100 text-blue-700",
    iconLabel: "완료",
    subtitle: "Success",
    title: "처리가 완료되었습니다",
  },
  error: {
    accentClassName: "border-rose-200 bg-rose-50 text-rose-900",
    iconClassName: "bg-rose-100 text-rose-700",
    iconLabel: "오류",
    subtitle: "Alert",
    title: "입력 내용을 확인해 주세요",
  },
  warning: {
    accentClassName: "border-amber-200 bg-amber-50 text-amber-900",
    iconClassName: "bg-amber-100 text-amber-700",
    iconLabel: "확인",
    subtitle: "Confirmation",
    title: "한 번 더 확인해 주세요",
  },
  info: {
    accentClassName: "border-stone-200 bg-stone-50 text-slate-900",
    iconClassName: "bg-stone-200 text-slate-700",
    iconLabel: "알림",
    subtitle: "Notice",
    title: "알림",
  },
} as const;

function AlertStatusIcon({ tone }: { tone: WorkspaceAlertTone }) {
  if (tone === "success") {
    return (
      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 20 20">
        <path
          d="M5.75 10.5 8.5 13.25 14.25 7.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.9"
        />
      </svg>
    );
  }

  if (tone === "warning") {
    return (
      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 20 20">
        <path
          d="M10 6.2v4.4m0 2.85h.01M8.07 3.9 2.94 13a1.4 1.4 0 0 0 1.22 2.1h10.68a1.4 1.4 0 0 0 1.22-2.1L10.93 3.9a1.07 1.07 0 0 0-1.86 0Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.7"
        />
      </svg>
    );
  }

  if (tone === "info") {
    return (
      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 20 20">
        <path
          d="M10 13.8V9.2m0-2.9h.01M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.7"
        />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 20 20">
      <path
        d="M10 6.15v4.2m0 3.1h.01M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

export function WorkspaceAlertDialog({
  message,
  onClose,
  onPrimaryAction,
  onSecondaryAction,
  open,
  primaryActionLabel,
  secondaryActionLabel,
  subtitle,
  title,
  tone = "error",
}: WorkspaceAlertDialogProps) {
  const toneStyle = alertToneStyles[tone];

  if (!open) {
    return null;
  }

  return (
    <WorkspaceModalShell
      contentClassName="sm:px-6"
      maxWidthClassName="max-w-lg"
      onClose={onClose}
      subtitle={subtitle ?? toneStyle.subtitle}
      title={title ?? toneStyle.title}
      zIndexClassName="z-[90]"
    >
      <div className="space-y-5">
        <div
          className={joinClassNames(
            "flex items-start gap-3 rounded-[1.15rem] border px-4 py-4 shadow-[0_18px_38px_-34px_rgba(15,23,42,0.22)]",
            toneStyle.accentClassName,
          )}
        >
          <div
            className={joinClassNames(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
              toneStyle.iconClassName,
            )}
          >
            <AlertStatusIcon tone={tone} />
          </div>
          <div className="min-w-0 space-y-1.5">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em]">
              {toneStyle.iconLabel}
            </p>
            <p className="text-sm leading-7">{message}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {secondaryActionLabel ? (
            <button
              className={`${secondaryButtonClassName} h-10 px-4`}
              onClick={onSecondaryAction ?? onClose}
              type="button"
            >
              {secondaryActionLabel}
            </button>
          ) : null}
          <button
            className={`${primaryButtonClassName} h-10 px-4`}
            onClick={onPrimaryAction ?? onClose}
            type="button"
          >
            {primaryActionLabel ?? (secondaryActionLabel ? "확인" : "닫기")}
          </button>
        </div>
      </div>
    </WorkspaceModalShell>
  );
}

export function WorkspaceMessageModal({
  message,
  primaryActionLabel,
  signal,
  subtitle,
  title,
  tone = "error",
}: WorkspaceMessageModalProps) {
  const [visibleMessage, setVisibleMessage] = useState<string | null>(message ?? null);

  useEffect(() => {
    setVisibleMessage(message ?? null);
  }, [message, signal]);

  return (
    <WorkspaceAlertDialog
      message={visibleMessage ?? ""}
      onClose={() => setVisibleMessage(null)}
      open={Boolean(visibleMessage)}
      primaryActionLabel={primaryActionLabel}
      subtitle={subtitle}
      title={title}
      tone={tone}
    />
  );
}
