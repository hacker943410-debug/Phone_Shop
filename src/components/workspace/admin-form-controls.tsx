import type { ComponentProps, ReactNode } from "react";

import {
  DateControl,
  SelectControl,
} from "@/components/workspace/form-client-controls";
import { TonePill } from "@/components/workspace/workspace-primitives";
import {
  dateControlClassName,
  formControlClassName,
  joinClassNames,
  primaryButtonClassName,
  secondaryButtonClassName,
  selectControlClassName,
} from "@/components/workspace/ui-classnames";

interface FieldLayoutProps {
  label: string;
  helper?: string;
  wrapperClassName?: string;
  children: ReactNode;
}

function FieldLayout({
  label,
  helper,
  wrapperClassName,
  children,
}: FieldLayoutProps) {
  return (
    <label
      className={joinClassNames(
        "space-y-2 text-sm font-medium text-slate-700",
        wrapperClassName,
      )}
    >
      <span>{label}</span>
      {children}
      {helper ? <span className="block text-xs leading-5 text-slate-500">{helper}</span> : null}
    </label>
  );
}

interface FormFieldProps extends ComponentProps<"input"> {
  label: string;
  helper?: string;
  wrapperClassName?: string;
}

export function FormField({
  label,
  helper,
  wrapperClassName,
  className,
  ...props
}: FormFieldProps) {
  if (props.type === "date") {
    return (
      <FieldLayout
        label={label}
        helper={helper}
        wrapperClassName={wrapperClassName}
      >
        <DateControl
          aria-label={label}
          className={joinClassNames(
            dateControlClassName,
            className,
          )}
          {...props}
        />
      </FieldLayout>
    );
  }

  return (
    <FieldLayout
      label={label}
      helper={helper}
      wrapperClassName={wrapperClassName}
    >
      <input
        className={joinClassNames(
          formControlClassName,
          className,
        )}
        aria-label={label}
        {...props}
      />
    </FieldLayout>
  );
}

interface FormSelectProps extends ComponentProps<"select"> {
  label: string;
  helper?: string;
  wrapperClassName?: string;
  children: ReactNode;
}

export function FormSelect({
  label,
  helper,
  wrapperClassName,
  className,
  children,
  ...props
}: FormSelectProps) {
  return (
    <FieldLayout
      label={label}
      helper={helper}
      wrapperClassName={wrapperClassName}
    >
      <SelectControl
        aria-label={label}
        className={joinClassNames(
          selectControlClassName,
          className,
        )}
        {...props}
      >
        {children}
      </SelectControl>
    </FieldLayout>
  );
}

interface FormTextAreaProps extends ComponentProps<"textarea"> {
  label: string;
  helper?: string;
  wrapperClassName?: string;
}

export function FormTextArea({
  label,
  helper,
  wrapperClassName,
  className,
  ...props
}: FormTextAreaProps) {
  return (
    <FieldLayout
      label={label}
      helper={helper}
      wrapperClassName={wrapperClassName}
    >
      <textarea
        className={joinClassNames(
          `${formControlClassName} min-h-28 resize-y`,
          className,
        )}
        aria-label={label}
        {...props}
      />
    </FieldLayout>
  );
}

type PhoneFieldProps = Omit<
  FormFieldProps,
  "type" | "inputMode" | "pattern"
>;

export function PhoneField(props: PhoneFieldProps) {
  return (
    <FormField
      type="tel"
      inputMode="numeric"
      maxLength={13}
      pattern="[0-9-]*"
      placeholder="010-1234-5678"
      helper="숫자만 입력해도 저장 시 자동으로 하이픈 형식으로 정리됩니다."
      {...props}
    />
  );
}

type ImeiFieldProps = Omit<
  FormFieldProps,
  "type" | "inputMode" | "pattern"
>;

export function ImeiField(props: ImeiFieldProps) {
  return (
    <FormField
      type="text"
      inputMode="numeric"
      maxLength={15}
      pattern="[0-9]{15}"
      placeholder="15자리 숫자"
      helper="IMEI는 숫자 15자리만 저장합니다."
      {...props}
    />
  );
}

type CurrencyFieldProps = Omit<
  FormFieldProps,
  "type" | "inputMode" | "step" | "pattern"
>;

export function CurrencyField(props: CurrencyFieldProps) {
  return (
    <FormField
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      placeholder="숫자만 입력"
      helper="쉼표 없이 숫자만 입력합니다."
      {...props}
    />
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
        `${primaryButtonClassName} h-10 px-4`,
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
        `${secondaryButtonClassName} h-10 px-4`,
        className,
      )}
      {...props}
    >
      {isActive ? "비활성화" : "활성화"}
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
    <p className="rounded-lg border border-dashed border-stone-300 bg-stone-50 px-4 py-5 text-sm leading-6 text-slate-500">
      {message}
    </p>
  );
}

export function NoticeBanner({ message }: { message: string }) {
  return (
    <section className="rounded-lg border border-rose-200 bg-rose-50/85 px-5 py-4 text-sm leading-6 text-rose-900">
      {message}
    </section>
  );
}
