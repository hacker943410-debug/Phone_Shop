import type { ReactNode } from "react";

import {
  joinClassNames,
  primaryButtonClassName,
  secondaryButtonClassName,
  dangerButtonClassName,
} from "@/components/workspace/ui-classnames";

interface PageIntroProps {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageIntro({
  eyebrow,
  title,
  actions,
}: PageIntroProps) {
  return (
    <section className="relative overflow-hidden rounded-[1.4rem] border border-stone-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(247,245,241,0.96)_100%)] px-5 py-3.5 shadow-[0_16px_40px_-34px_rgba(15,23,42,0.24)] sm:px-6">
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,rgba(37,99,235,0),rgba(37,99,235,0.55),rgba(217,119,6,0.26),rgba(37,99,235,0))]" />
      <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center xl:justify-between">
        <div className="max-w-4xl space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.32em] text-blue-700">
              {eyebrow}
            </p>
            <span className="h-px w-10 bg-blue-200" aria-hidden="true" />
          </div>
          <h1 className="max-w-4xl text-[1.7rem] font-semibold tracking-[-0.045em] text-slate-950 sm:text-[1.95rem]">
            {title}
          </h1>
        </div>
        {actions ? (
          <div className="flex flex-wrap gap-2 xl:max-w-[48%] xl:justify-end">
            {actions}
          </div>
        ) : null}
      </div>
    </section>
  );
}

interface ActionChipProps {
  label: string;
  tone?: "dark" | "light";
}

export function ActionChip({ label, tone = "light" }: ActionChipProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-3 py-1.5 text-[0.72rem] font-semibold tracking-[0.02em]",
        tone === "dark"
          ? "border border-blue-700 bg-blue-700 text-white shadow-[0_10px_24px_-18px_rgba(37,99,235,0.7)]"
          : "border border-stone-200 bg-white text-slate-700",
      ].join(" ")}
    >
      {label}
    </span>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  helper: string;
  accent: "amber" | "teal" | "slate";
}

const metricAccentStyles = {
  amber: {
    frame:
      "border-amber-200 bg-[linear-gradient(180deg,rgba(255,251,235,0.98)_0%,rgba(255,255,255,1)_100%)]",
    glow: "bg-amber-100/90 text-amber-900",
    line: "bg-amber-300/70",
  },
  teal: {
    frame:
      "border-blue-200 bg-[linear-gradient(180deg,rgba(239,246,255,0.98)_0%,rgba(255,255,255,1)_100%)]",
    glow: "bg-blue-100 text-blue-900",
    line: "bg-blue-300/70",
  },
  slate: {
    frame:
      "border-stone-200 bg-[linear-gradient(180deg,rgba(250,250,249,1)_0%,rgba(255,255,255,1)_100%)]",
    glow: "bg-stone-200 text-stone-700",
    line: "bg-stone-300/80",
  },
};

export function MetricCard({ label, value, helper, accent }: MetricCardProps) {
  return (
    <article
      className={joinClassNames(
        "relative overflow-hidden rounded-2xl border p-3.5 shadow-[0_16px_36px_-32px_rgba(15,23,42,0.26)]",
        metricAccentStyles[accent].frame,
      )}
    >
      <div
        className={joinClassNames(
          "absolute inset-x-0 top-0 h-1",
          metricAccentStyles[accent].line,
        )}
        aria-hidden="true"
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-slate-500">
            {label}
          </p>
          <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
            <p className="font-mono text-[1.7rem] font-semibold tracking-[-0.05em] text-slate-950 [font-variant-numeric:tabular-nums] sm:text-[1.82rem]">
              {value}
            </p>
            <p className="pb-1 text-xs leading-5 text-slate-600">{helper}</p>
          </div>
        </div>
        <span
          className={joinClassNames(
            "mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl border border-white/60 shadow-inner",
            metricAccentStyles[accent].glow,
          )}
          aria-hidden="true"
        >
          •
        </span>
      </div>
    </article>
  );
}

interface PanelProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function Panel({ title, children }: PanelProps) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-[0_16px_36px_-34px_rgba(15,23,42,0.22)] sm:p-5">
      <header>
        <h2 className="text-[1.05rem] font-semibold tracking-[-0.03em] text-slate-950">
          {title}
        </h2>
      </header>
      <div className="mt-3">{children}</div>
    </section>
  );
}

interface TonePillProps {
  label: string;
  tone?: "amber" | "teal" | "rose" | "slate";
}

const tonePillStyles = {
  amber: "border border-amber-200 bg-amber-50 text-amber-900",
  teal: "border border-blue-200 bg-blue-50 text-blue-900",
  rose: "border border-rose-200 bg-rose-50 text-rose-900",
  slate: "border border-stone-200 bg-stone-100 text-stone-700",
};

export function TonePill({ label, tone = "slate" }: TonePillProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[0.72rem] font-semibold ${tonePillStyles[tone]}`}
    >
      {label}
    </span>
  );
}

export {
  dangerButtonClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
};
