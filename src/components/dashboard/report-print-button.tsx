"use client";

export function ReportPrintButton() {
  return (
    <button
      className="inline-flex rounded-full border border-slate-950/10 bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
      onClick={() => window.print()}
      type="button"
    >
      바로 인쇄
    </button>
  );
}
