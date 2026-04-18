"use client";

import { useEffect, useId, useState, type ReactNode } from "react";

import {
  joinClassNames,
  secondaryButtonClassName,
} from "@/components/workspace/ui-classnames";

function ExpandIcon() {
  return (
    <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 20 20">
      <path
        d="M7 4.75H4.75V7M15.25 7V4.75H13M13 15.25h2.25V13M4.75 13v2.25H7M8 5.75h4M5.75 8v4M12 14.25H8M14.25 12V8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.55"
      />
    </svg>
  );
}

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

export function DashboardDetailDialog({
  title,
  description,
  triggerLabel = "전체 보기",
  panelClassName,
  children,
}: {
  title: string;
  description?: string;
  triggerLabel?: string;
  panelClassName?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        className={joinClassNames(
          `${secondaryButtonClassName} h-8 gap-1.5 px-3 text-[0.74rem]`,
          "border-stone-200 bg-white/90 text-slate-700",
        )}
        onClick={() => setOpen(true)}
        type="button"
      >
        <ExpandIcon />
        {triggerLabel}
      </button>

      {open ? (
        <div
          className="dashboard-dialog-backdrop fixed inset-0 z-[70] flex items-end justify-center bg-[rgba(15,23,42,0.42)] px-4 py-6 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            aria-describedby={description ? descriptionId : undefined}
            aria-labelledby={titleId}
            aria-modal="true"
            className={joinClassNames(
              "dashboard-dialog-panel flex max-h-[min(82vh,48rem)] w-full max-w-5xl flex-col overflow-hidden rounded-[1.6rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(245,243,239,0.98)_100%)] shadow-[0_42px_90px_-34px_rgba(15,23,42,0.5)] backdrop-blur",
              panelClassName,
            )}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="flex items-start justify-between gap-4 border-b border-stone-200/90 px-5 py-4 sm:px-6">
              <div className="space-y-1.5">
                <p
                  className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-blue-700"
                  id={titleId}
                >
                  {title}
                </p>
                {description ? (
                  <p className="text-sm leading-6 text-slate-600" id={descriptionId}>
                    {description}
                  </p>
                ) : null}
              </div>

              <button
                aria-label="모달 닫기"
                className={joinClassNames(
                  `${secondaryButtonClassName} h-9 w-9 px-0`,
                  "rounded-full border-stone-200 bg-white text-slate-700",
                )}
                onClick={() => setOpen(false)}
                type="button"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
              {children}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
