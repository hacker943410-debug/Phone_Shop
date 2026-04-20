import type { ReactNode } from "react";

import {
  joinClassNames,
  primaryButtonClassName,
  secondaryButtonClassName,
  dangerButtonClassName,
} from "@/components/workspace/ui-classnames";

interface PageIntroProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageIntro({
  title,
  actions,
  className,
}: PageIntroProps) {
  return (
    <section
      className={joinClassNames(
        "relative overflow-hidden rounded-[1.6rem] border border-stone-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(247,245,241,0.96)_100%)] px-5 py-4 shadow-[0_22px_48px_-40px_rgba(15,23,42,0.34)] sm:px-6 sm:py-4.5 xl:px-7",
        className,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,rgba(146,64,14,0),rgba(180,83,9,0.52),rgba(217,119,6,0.36),rgba(146,64,14,0))]" />
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center xl:gap-6">
        <div className="min-w-0 space-y-2">
          <div className="space-y-1.5">
            <h1 className="text-[1.72rem] font-semibold tracking-[-0.05em] text-slate-950 sm:text-[1.92rem] 2xl:text-[2.08rem]">
              {title}
            </h1>
          </div>
        </div>
        {actions ? (
          <div className="flex flex-wrap gap-2.5 xl:justify-end">{actions}</div>
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
        "inline-flex items-center rounded-full px-3.5 py-1.5 text-[0.72rem] font-semibold tracking-[0.02em]",
        tone === "dark"
          ? "border border-stone-700 bg-[linear-gradient(135deg,rgba(41,37,36,1)_0%,rgba(68,64,60,1)_100%)] text-stone-50 shadow-[0_14px_26px_-20px_rgba(41,37,36,0.5)]"
          : "border border-stone-200 bg-white/90 text-slate-700 shadow-[0_12px_24px_-24px_rgba(15,23,42,0.28)]",
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
  className?: string;
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

export function MetricCard({
  label,
  value,
  helper,
  accent,
  className,
}: MetricCardProps) {
  return (
    <article
      className={joinClassNames(
        "relative overflow-hidden rounded-[1.35rem] border p-3.5 shadow-[0_20px_40px_-36px_rgba(15,23,42,0.3)]",
        metricAccentStyles[accent].frame,
        className,
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
          <p className="text-[0.64rem] font-semibold uppercase tracking-[0.24em] text-slate-500">
            {label}
          </p>
          <p className="font-mono text-[1.5rem] font-semibold tracking-[-0.055em] text-slate-950 [font-variant-numeric:tabular-nums] sm:text-[1.7rem]">
            {value}
          </p>
          <p className="text-xs leading-5 text-slate-600">{helper}</p>
        </div>
        <span
          className={joinClassNames(
            "mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl border border-white/60 shadow-inner",
            metricAccentStyles[accent].glow,
          )}
          aria-hidden="true"
        >
          <span className="h-2.5 w-2.5 rounded-full bg-current/70" />
        </span>
      </div>
    </article>
  );
}

interface PanelProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function Panel({
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
}: PanelProps) {
  return (
    <section
      className={joinClassNames(
        "rounded-[1.55rem] border border-stone-200 bg-white/92 p-4 shadow-[0_20px_42px_-38px_rgba(15,23,42,0.3)] backdrop-blur-sm sm:p-4.5",
        className,
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h2 className="text-[1rem] font-semibold tracking-[-0.035em] text-slate-950 sm:text-[1.06rem]">
            {title}
          </h2>
          {description ? (
            <p className="text-sm leading-6 text-slate-500">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </header>
      <div className={joinClassNames("mt-3 min-h-0", contentClassName)}>
        {children}
      </div>
    </section>
  );
}

interface TonePillProps {
  label: string;
  tone?:
    | "amber"
    | "teal"
    | "rose"
    | "slate"
    | "charcoal"
    | "red"
    | "pink";
}

const tonePillStyles = {
  amber: "border border-amber-200 bg-amber-50 text-amber-900",
  teal: "border border-blue-200 bg-blue-50 text-blue-900",
  rose: "border border-rose-200 bg-rose-50 text-rose-900",
  slate: "border border-stone-200 bg-stone-100 text-stone-700",
  charcoal: "border border-slate-800 bg-slate-950 text-white",
  red: "border border-red-200 bg-red-50 text-red-900",
  pink: "border border-pink-200 bg-pink-50 text-pink-900",
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

type CarrierVisualKey = "generic" | "kt" | "lguplus" | "skt";

function normalizeCarrierLabel(label: string) {
  return label.toUpperCase().replace(/[\s+_-]/g, "");
}

function getCarrierTone(label: string) {
  const normalizedLabel = normalizeCarrierLabel(label);

  if (normalizedLabel.startsWith("KT")) {
    return "charcoal" as const;
  }

  if (normalizedLabel.startsWith("SKT") || normalizedLabel === "SK") {
    return "red" as const;
  }

  if (
    normalizedLabel.startsWith("LGU") ||
    normalizedLabel.startsWith("LGUPLUS") ||
    normalizedLabel.startsWith("LG")
  ) {
    return "pink" as const;
  }

  return "amber" as const;
}

function getCarrierVisualKey(label: string): CarrierVisualKey {
  const normalizedLabel = normalizeCarrierLabel(label);

  if (normalizedLabel.startsWith("KT")) {
    return "kt";
  }

  if (normalizedLabel.startsWith("SKT") || normalizedLabel === "SK") {
    return "skt";
  }

  if (
    normalizedLabel.startsWith("LGU") ||
    normalizedLabel.startsWith("LGUPLUS") ||
    normalizedLabel.startsWith("LG")
  ) {
    return "lguplus";
  }

  return "generic";
}

function getCarrierToken(label: string) {
  const visualKey = getCarrierVisualKey(label);

  if (visualKey === "kt") {
    return "KT";
  }

  if (visualKey === "skt") {
    return "SK";
  }

  if (visualKey === "lguplus") {
    return "U+";
  }

  const fallbackToken = normalizeCarrierLabel(label)
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 2);

  return fallbackToken || "ET";
}

const carrierBadgeStyles: Record<
  CarrierVisualKey,
  { frame: string; token: string; inlineFrame: string; inlineText: string }
> = {
  generic: {
    frame:
      "border-stone-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(245,243,239,0.98)_100%)] text-slate-700",
    token:
      "border border-stone-300 bg-stone-100 text-stone-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
    inlineFrame:
      "border-stone-200 bg-stone-50/90 text-slate-700 shadow-[0_10px_24px_-24px_rgba(15,23,42,0.3)]",
    inlineText: "text-slate-700",
  },
  kt: {
    frame:
      "border-slate-300 bg-[linear-gradient(180deg,rgba(248,250,252,0.98)_0%,rgba(241,245,249,0.98)_100%)] text-slate-900",
    token:
      "border border-slate-700 bg-[linear-gradient(135deg,rgba(15,23,42,1)_0%,rgba(51,65,85,1)_100%)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]",
    inlineFrame:
      "border-slate-300 bg-slate-50/95 text-slate-900 shadow-[0_10px_24px_-24px_rgba(15,23,42,0.42)]",
    inlineText: "text-slate-900",
  },
  lguplus: {
    frame:
      "border-fuchsia-200 bg-[linear-gradient(180deg,rgba(253,242,248,0.98)_0%,rgba(255,255,255,0.98)_100%)] text-fuchsia-900",
    token:
      "border border-fuchsia-200 bg-[linear-gradient(135deg,rgba(219,39,119,1)_0%,rgba(217,70,239,1)_100%)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]",
    inlineFrame:
      "border-fuchsia-200 bg-fuchsia-50/95 text-fuchsia-900 shadow-[0_10px_24px_-24px_rgba(190,24,93,0.36)]",
    inlineText: "text-fuchsia-900",
  },
  skt: {
    frame:
      "border-orange-200 bg-[linear-gradient(180deg,rgba(255,247,237,0.98)_0%,rgba(255,255,255,0.98)_100%)] text-orange-900",
    token:
      "border border-orange-200 bg-[linear-gradient(135deg,rgba(239,68,68,1)_0%,rgba(249,115,22,1)_100%)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]",
    inlineFrame:
      "border-orange-200 bg-orange-50/95 text-orange-900 shadow-[0_10px_24px_-24px_rgba(234,88,12,0.34)]",
    inlineText: "text-orange-900",
  },
};

export function CarrierTonePill({
  label,
  fallbackTone = "amber",
}: {
  label: string;
  fallbackTone?: "amber" | "teal" | "rose" | "slate";
}) {
  if (!label) {
    return <TonePill label={label} tone={fallbackTone} />;
  }

  const visualKey = getCarrierVisualKey(label);

  if (visualKey === "generic") {
    return <TonePill label={label} tone={getCarrierTone(label)} />;
  }

  return (
    <span
      className={joinClassNames(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.72rem] font-semibold",
        carrierBadgeStyles[visualKey].frame,
      )}
    >
      <span
        aria-hidden="true"
        className={joinClassNames(
          "inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1 text-[0.58rem] font-black uppercase tracking-[0.1em]",
          carrierBadgeStyles[visualKey].token,
        )}
      >
        {getCarrierToken(label)}
      </span>
      <span>{label}</span>
    </span>
  );
}

export function CarrierInlineLabel({
  className,
  label,
}: {
  className?: string;
  label: string;
}) {
  const visualKey = getCarrierVisualKey(label);
  const styles = carrierBadgeStyles[visualKey];

  return (
    <span
      className={joinClassNames(
        "inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.74rem] font-semibold",
        styles.inlineFrame,
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={joinClassNames(
          "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[0.58rem] font-black uppercase tracking-[0.1em]",
          styles.token,
        )}
      >
        {getCarrierToken(label)}
      </span>
      <span className={joinClassNames("truncate", styles.inlineText)}>{label}</span>
    </span>
  );
}

export {
  dangerButtonClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
};
