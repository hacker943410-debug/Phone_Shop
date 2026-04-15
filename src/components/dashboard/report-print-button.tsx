"use client";

import { primaryButtonClassName } from "@/components/workspace/ui-classnames";

export function ReportPrintButton() {
  return (
    <button
      className={`${primaryButtonClassName} h-10 px-4`}
      onClick={() => window.print()}
      type="button"
    >
      바로 인쇄
    </button>
  );
}
