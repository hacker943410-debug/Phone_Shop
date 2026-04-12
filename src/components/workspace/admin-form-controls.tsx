import type { ComponentProps, ReactNode } from "react";

import { TonePill } from "@/components/workspace/workspace-primitives";

const controlClassName =
  "w-full rounded-[1.15rem] border border-slate-950/12 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200";

function joinClassNames(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ");
}

interface FormFieldProps extends ComponentProps<"input"> {
  label: string;
  wrapperClassName?: string;
}

export function FormField({
  label,
  wrapperClassName,
  className,
  ...props
}: FormFieldProps) {
  return (
    <label
      className={joinClassNames(
        "space-y-2 text-sm font-medium text-slate-700",
        wrapperClassName,
      )}
    >
      <span>{label}</span>
      <input className={joinClassNames(controlClassName, className)} {...props} />
    </label>
  );
}

interface FormSelectProps extends ComponentProps<"select"> {
  label: string;
  wrapperClassName?: string;
  children: ReactNode;
}

export function FormSelect({
  label,
  wrapperClassName,
  className,
  children,
  ...props
}: FormSelectProps) {
  return (
    <label
      className={joinClassNames(
        "space-y-2 text-sm font-medium text-slate-700",
        wrapperClassName,
      )}
    >
      <span>{label}</span>
      <select
        className={joinClassNames(controlClassName, className)}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

interface FormTextAreaProps extends ComponentProps<"textarea"> {
  label: string;
  wrapperClassName?: string;
}

export function FormTextArea({
  label,
  wrapperClassName,
  className,
  ...props
}: FormTextAreaProps) {
  return (
    <label
      className={joinClassNames(
        "space-y-2 text-sm font-medium text-slate-700",
        wrapperClassName,
      )}
    >
      <span>{label}</span>
      <textarea
        className={joinClassNames(
          `${controlClassName} min-h-28 resize-y`,
          className,
        )}
        {...props}
      />
    </label>
  );
}

interface SubmitButtonProps extends ComponentProps<"button"> {
  label?: string;
}

export function SubmitButton({
  label = "저장",
  className,
  type = "submit",
  ...props
}: SubmitButtonProps) {
  return (
    <button
      type={type}
      className={joinClassNames(
        "inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800",
        className,
      )}
      {...props}
    >
      {label}
    </button>
  );
}

interface ToggleActiveButtonProps extends ComponentProps<"button"> {
  isActive: boolean;
}

export function ToggleActiveButton({
  isActive,
  className,
  type = "submit",
  ...props
}: ToggleActiveButtonProps) {
  return (
    <button
      type={type}
      className={joinClassNames(
        "inline-flex items-center justify-center rounded-full border border-slate-950/12 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100",
        className,
      )}
      {...props}
    >
      {isActive ? "비활성화" : "재활성화"}
    </button>
  );
}

export function ActiveStatePill({ isActive }: { isActive: boolean }) {
  return (
    <TonePill
      label={isActive ? "활성" : "비활성"}
      tone={isActive ? "teal" : "slate"}
    />
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-[1.2rem] border border-dashed border-slate-300 bg-stone-50/75 px-4 py-5 text-sm leading-6 text-slate-500">
      {message}
    </p>
  );
}
