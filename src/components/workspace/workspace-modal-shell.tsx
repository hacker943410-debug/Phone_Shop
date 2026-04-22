"use client";

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import {
  joinClassNames,
  secondaryButtonClassName,
} from "@/components/workspace/ui-classnames";
import { useModalAccessibility } from "@/components/workspace/use-modal-accessibility";

const modalTransitionDurationMs = 180;
const WorkspaceModalCloseContext = createContext<(() => void) | null>(null);

export function useWorkspaceModalClose() {
  return useContext(WorkspaceModalCloseContext);
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

interface WorkspaceModalShellProps {
  children: ReactNode;
  contentClassName?: string;
  maxWidthClassName?: string;
  onClose: () => void;
  subtitle: string;
  title: string;
  zIndexClassName?: string;
}

export function WorkspaceModalShell({
  children,
  contentClassName,
  maxWidthClassName = "max-w-6xl",
  onClose,
  subtitle,
  title,
  zIndexClassName = "z-[80]",
}: WorkspaceModalShellProps) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setIsVisible(true);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [mounted]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  function requestClose() {
    if (closeTimeoutRef.current !== null) {
      return;
    }

    setIsVisible(false);
    closeTimeoutRef.current = window.setTimeout(() => {
      closeTimeoutRef.current = null;
      onCloseRef.current();
    }, modalTransitionDurationMs);
  }

  useModalAccessibility({
    containerRef: panelRef,
    isOpen: mounted,
    onClose: requestClose,
  });

  if (!mounted) {
    return null;
  }

  return createPortal(
    <WorkspaceModalCloseContext.Provider value={requestClose}>
      <div
        className={joinClassNames(
          "dashboard-dialog-backdrop fixed inset-0 flex items-start justify-center overflow-y-auto overscroll-y-contain bg-[rgba(15,23,42,0.42)] px-4 py-3 transition-opacity duration-[180ms] ease-out sm:px-6 sm:py-6",
          zIndexClassName,
          isVisible ? "opacity-100" : "opacity-0",
        )}
        onClick={requestClose}
      >
        <div
          aria-labelledby={titleId}
          aria-modal="true"
          className={joinClassNames(
            "dashboard-dialog-panel flex max-h-[calc(100dvh-1.5rem)] w-full flex-col overflow-hidden rounded-[1.7rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(245,243,239,0.98)_100%)] shadow-[0_42px_90px_-34px_rgba(15,23,42,0.5)] backdrop-blur transition-[opacity,transform] duration-[180ms] ease-out sm:max-h-[calc(100dvh-3rem)]",
            isVisible
              ? "translate-y-0 scale-100 opacity-100"
              : "translate-y-3 scale-[0.985] opacity-0",
            maxWidthClassName,
          )}
          onClick={(event) => event.stopPropagation()}
          ref={panelRef}
          role="dialog"
          tabIndex={-1}
        >
          <div className="flex items-start justify-between gap-4 border-b border-stone-200/90 px-5 py-4 sm:px-6">
            <div className="space-y-1.5">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-amber-700">
                {subtitle}
              </p>
              <h3
                className="text-[1.45rem] font-semibold tracking-[-0.04em] text-slate-950"
                id={titleId}
              >
                {title}
              </h3>
            </div>
            <button
              aria-label="모달 닫기"
              className={joinClassNames(
                `${secondaryButtonClassName} h-9 w-9 px-0`,
                "rounded-full border-stone-200 bg-white text-slate-700",
              )}
              onClick={requestClose}
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
    </WorkspaceModalCloseContext.Provider>,
    document.body,
  );
}
