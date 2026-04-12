import type { ReactNode } from "react";

interface PageIntroProps {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}

export function PageIntro({
  eyebrow,
  title,
  description,
  actions,
}: PageIntroProps) {
  return (
    <section className="rounded-[2rem] border border-slate-950/8 bg-[linear-gradient(140deg,rgba(255,255,255,0.98)_0%,rgba(251,240,224,0.96)_100%)] p-6 shadow-[0_26px_60px_-42px_rgba(15,23,42,0.35)] sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-3">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.35em] text-amber-700">
            {eyebrow}
          </p>
          <h1 className="text-3xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-4xl lg:text-[3.15rem]">
            {title}
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            {description}
          </p>
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
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
        "inline-flex rounded-full px-4 py-2 text-sm font-semibold tracking-[-0.01em]",
        tone === "dark"
          ? "bg-slate-950 text-white"
          : "border border-slate-950/10 bg-white text-slate-700",
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
  amber: "from-amber-100 to-orange-50 text-amber-900",
  teal: "from-teal-100 to-cyan-50 text-teal-900",
  slate: "from-slate-100 to-stone-50 text-slate-900",
};

export function MetricCard({ label, value, helper, accent }: MetricCardProps) {
  return (
    <article
      className={`rounded-[1.7rem] border border-slate-950/8 bg-gradient-to-br ${metricAccentStyles[accent]} p-5 shadow-[0_18px_45px_-34px_rgba(15,23,42,0.35)]`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
        {label}
      </p>
      <p className="mt-4 text-2xl font-semibold tracking-[-0.05em] sm:text-[2rem]">
        {value}
      </p>
      <p className="mt-3 text-sm leading-6 text-slate-600">{helper}</p>
    </article>
  );
}

interface PanelProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function Panel({ title, description, children }: PanelProps) {
  return (
    <section className="rounded-[1.8rem] border border-slate-950/8 bg-white/92 p-5 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.3)] sm:p-6">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">
          {title}
        </h2>
        {description ? (
          <p className="text-sm leading-6 text-slate-500">{description}</p>
        ) : null}
      </header>
      <div className="mt-5">{children}</div>
    </section>
  );
}

interface TonePillProps {
  label: string;
  tone?: "amber" | "teal" | "rose" | "slate";
}

const tonePillStyles = {
  amber: "bg-amber-100 text-amber-900",
  teal: "bg-teal-100 text-teal-900",
  rose: "bg-rose-100 text-rose-900",
  slate: "bg-slate-100 text-slate-900",
};

export function TonePill({ label, tone = "slate" }: TonePillProps) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tonePillStyles[tone]}`}
    >
      {label}
    </span>
  );
}
