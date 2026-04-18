import type { ReactNode } from "react";

import {
  joinClassNames,
  secondaryButtonClassName,
} from "@/components/workspace/ui-classnames";

function CloseIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 20 20">
      <path
        d="m5.5 5.5 9 9m0-9-9 9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

interface WorkspaceModalShellProps {
  children: ReactNode;
  contentClassName?: string;
  maxWidthClassName?: string;
  onClose: () => void;
  subtitle: string;
  title: string;
}

export function WorkspaceModalShell({
  children,
  contentClassName,
  maxWidthClassName = "max-w-6xl",
  onClose,
  subtitle,
  title,
}: WorkspaceModalShellProps) {
  return (
    <div
      className="dashboard-dialog-backdrop fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto overscroll-y-contain bg-[rgba(15,23,42,0.42)] px-4 py-3 sm:px-6 sm:py-6"
      onClick={onClose}
    >
      <div
        aria-modal="true"
        className={joinClassNames(
          "dashboard-dialog-panel flex max-h-[calc(100dvh-1.5rem)] w-full flex-col overflow-hidden rounded-[1.7rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(245,243,239,0.98)_100%)] shadow-[0_42px_90px_-34px_rgba(15,23,42,0.5)] backdrop-blur sm:max-h-[calc(100dvh-3rem)]",
          maxWidthClassName,
        )}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4 border-b border-stone-200/90 px-5 py-4 sm:px-6">
          <div className="space-y-1.5">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-amber-700">
              {subtitle}
            </p>
            <h3 className="text-[1.45rem] font-semibold tracking-[-0.04em] text-slate-950">
              {title}
            </h3>
          </div>
          <button
            aria-label="모달 닫기"
            className={joinClassNames(
              `${secondaryButtonClassName} h-9 w-9 px-0`,
              "rounded-full border-stone-200 bg-white text-slate-700",
            )}
            onClick={onClose}
            type="button"
          >
            <CloseIcon />
          </button>
        </div>
        <div
          className={joinClassNames(
            "min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 py-5 sm:px-6",
            contentClassName,
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
