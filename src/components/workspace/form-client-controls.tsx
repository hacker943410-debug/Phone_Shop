"use client";

import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import {
  compactSelectControlClassName,
  formControlClassName,
  joinClassNames,
} from "@/components/workspace/ui-classnames";
import {
  countDigitsBeforeCaret,
  extractCurrencyDigits,
  formatCurrencyInputDisplay,
  resolveCurrencyCaretPosition,
} from "@/lib/currency-input";
import {
  countModelNumberCharactersBeforeCaret,
  formatModelNumberInput,
  resolveModelNumberCaretPosition,
} from "@/lib/model-number-input";

interface ChoiceOption {
  value: string;
  label: string;
  disabled: boolean;
}

interface BaseTriggerProps {
  id?: string;
  title?: string;
  tabIndex?: number;
  autoFocus?: boolean;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-labelledby"?: string;
}

interface OptionElementProps {
  value?: string | number | readonly string[];
  children?: ReactNode;
  disabled?: boolean;
  label?: string;
}

function normalizeControlValue(
  value: string | number | readonly string[] | undefined,
) {
  if (value === undefined) {
    return "";
  }

  if (Array.isArray(value)) {
    return String(value[0] ?? "");
  }

  return String(value);
}

function collectNodeText(node: ReactNode): string {
  return Children.toArray(node)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") {
        return String(child);
      }

      if (isValidElement<{ children?: ReactNode }>(child)) {
        return collectNodeText(child.props.children);
      }

      return "";
    })
    .join("")
    .trim();
}

function extractOptions(children: ReactNode): ChoiceOption[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement<OptionElementProps>(child)) {
      return [];
    }

    if (child.type === "option") {
      return [
        {
          value: normalizeControlValue(child.props.value),
          label: collectNodeText(child.props.children),
          disabled: Boolean(child.props.disabled),
        },
      ];
    }

    if (child.type === "optgroup") {
      return Children.toArray(child.props.children).flatMap((nestedChild) => {
        if (
          !isValidElement<OptionElementProps>(nestedChild) ||
          nestedChild.type !== "option"
        ) {
          return [];
        }

        return [
          {
            value: normalizeControlValue(nestedChild.props.value),
            label: collectNodeText(nestedChild.props.children),
            disabled: Boolean(nestedChild.props.disabled),
          },
        ];
      });
    }

    return [];
  });
}

function useDismissLayer(
  refs: Array<React.RefObject<HTMLElement | null>>,
  active: boolean,
  onDismiss: () => void,
) {
  useEffect(() => {
    if (!active) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node | null;

      if (!target) {
        return;
      }

      const clickedInside = refs.some((ref) => ref.current?.contains(target));

      if (!clickedInside) {
        onDismiss();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onDismiss();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [active, onDismiss, refs]);
}

function resolvePopoverPlacement(
  triggerRef: React.RefObject<HTMLElement | null>,
  {
    panelHeight = 340,
    panelWidth = 320,
    matchTriggerWidth = false,
  }: {
    panelHeight?: number;
    panelWidth?: number;
    matchTriggerWidth?: boolean;
  } = {},
) {
  if (!triggerRef.current || typeof window === "undefined") {
    return {
      openUpward: false,
      style: {} as CSSProperties,
    };
  }

  const rect = triggerRef.current.getBoundingClientRect();
  const gap = 8;
  const horizontalMargin = 12;
  const verticalMargin = 12;
  const maxAllowedWidth = window.innerWidth - horizontalMargin * 2;
  const estimatedWidth = matchTriggerWidth
    ? rect.width
    : Math.min(Math.max(rect.width, panelWidth), maxAllowedWidth);
  const availableBelow = window.innerHeight - rect.bottom - verticalMargin;
  const availableAbove = rect.top - verticalMargin;
  let left = rect.left;

  if (left + estimatedWidth > window.innerWidth - horizontalMargin) {
    left = rect.right - estimatedWidth;
  }

  left = Math.min(
    Math.max(horizontalMargin, left),
    window.innerWidth - horizontalMargin - estimatedWidth,
  );
  const openUpward = availableBelow < panelHeight && availableAbove > availableBelow;

  return {
    openUpward,
    style: {
      left,
      width: estimatedWidth,
      ...(openUpward
        ? { bottom: window.innerHeight - rect.top + gap }
        : { top: rect.bottom + gap }),
    } satisfies CSSProperties,
  };
}

function createSyntheticChangeEvent<
  T extends HTMLInputElement | HTMLSelectElement,
>(name: string | undefined, value: string) {
  return {
    target: { name, value },
    currentTarget: { name, value },
  } as ChangeEvent<T>;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function normalizeDateBoundary(value?: string | number) {
  if (typeof value !== "string") {
    return undefined;
  }

  return value;
}

function parseDateString(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function formatDateValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatDisplayDate(value: string) {
  const date = parseDateString(value);

  if (!date) {
    return "날짜 선택";
  }

  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
}

function isSameDate(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function addYears(date: Date, amount: number) {
  return new Date(date.getFullYear() + amount, date.getMonth(), 1);
}

function buildCalendarDays(viewDate: Date) {
  const monthStart = startOfMonth(viewDate);
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - monthStart.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);

    return {
      date,
      isCurrentMonth: date.getMonth() === viewDate.getMonth(),
    };
  });
}

function isDateDisabled(date: Date, min?: string, max?: string) {
  const minDate = parseDateString(min);
  const maxDate = parseDateString(max);

  if (minDate && date < minDate) {
    return true;
  }

  if (maxDate && date > maxDate) {
    return true;
  }

  return false;
}

const calendarWeekdays = ["일", "월", "화", "수", "목", "금", "토"];
const calendarMonths = [
  "1월",
  "2월",
  "3월",
  "4월",
  "5월",
  "6월",
  "7월",
  "8월",
  "9월",
  "10월",
  "11월",
  "12월",
];

const triggerClassName = joinClassNames(
  formControlClassName,
  "flex items-center justify-between gap-3 text-left",
);

const iconButtonClassName =
  "flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-800 transition duration-150 hover:-translate-y-px hover:border-amber-300 hover:bg-amber-100 hover:shadow-[0_12px_20px_-18px_rgba(180,83,9,0.4)]";

const selectPopoverSurfaceClassName =
  "fixed z-[120] min-w-0 overflow-hidden rounded-[1.4rem] border border-stone-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(247,245,241,0.98)_100%)] shadow-[0_28px_60px_-30px_rgba(15,23,42,0.32)] backdrop-blur";

const popoverSurfaceClassName =
  "fixed z-[120] min-w-0 max-w-[calc(100vw-1rem)] overflow-hidden rounded-[1.3rem] border border-stone-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(247,245,241,0.98)_100%)] shadow-[0_28px_60px_-30px_rgba(15,23,42,0.32)] backdrop-blur";

function ChevronDownIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 20 20"
    >
      <path
        d="M6 8.25 10 12.25 14 8.25"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 20 20"
    >
      <rect
        x="3.25"
        y="4.75"
        width="13.5"
        height="12"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M6.5 3.25v3.5M13.5 3.25v3.5M3.25 8.25h13.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 20 20"
    >
      <path
        d={direction === "left" ? "M12.5 4.5 7.5 10l5 5.5" : "M7.5 4.5 12.5 10l-5 5.5"}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5"
      fill="none"
      viewBox="0 0 20 20"
    >
      <path
        d="m5.5 10.25 3 3.25 6-7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export interface SelectControlProps extends BaseTriggerProps {
  children: ReactNode;
  defaultValue?: string | number | readonly string[];
  value?: string | number | readonly string[];
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
  onValueChange?: (value: string) => void;
}

export function SelectControl({
  autoFocus,
  children,
  className,
  defaultValue,
  disabled,
  id,
  name,
  onChange,
  onValueChange,
  required,
  tabIndex,
  title,
  value,
  "aria-describedby": ariaDescribedBy,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: SelectControlProps) {
  const options = useMemo(() => extractOptions(children), [children]);
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(
    normalizeControlValue(defaultValue),
  );
  const selectedValue = isControlled
    ? normalizeControlValue(value)
    : internalValue;
  const selectedOption =
    options.find((option) => option.value === selectedValue) ?? null;
  const placeholderOption = options.find((option) => option.value === "");
  const triggerLabel =
    selectedOption?.label ||
    placeholderOption?.label ||
    "선택";

  const listboxId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>({});

  useDismissLayer([triggerRef, panelRef], open, () => setOpen(false));

  useEffect(() => {
    if (!open) {
      return;
    }

    function updatePlacement() {
      const placement = resolvePopoverPlacement(triggerRef, {
        panelHeight: 320,
        panelWidth: triggerRef.current?.offsetWidth ?? 240,
        matchTriggerWidth: true,
      });

      setPopoverStyle(placement.style);
    }

    updatePlacement();
    window.addEventListener("resize", updatePlacement);
    window.addEventListener("scroll", updatePlacement, true);

    return () => {
      window.removeEventListener("resize", updatePlacement);
      window.removeEventListener("scroll", updatePlacement, true);
    };
  }, [open]);

  function toggleOpen() {
    if (open) {
      setOpen(false);
      return;
    }

    const placement = resolvePopoverPlacement(triggerRef, {
      panelHeight: 320,
      panelWidth: triggerRef.current?.offsetWidth ?? 240,
      matchTriggerWidth: true,
    });

    setPopoverStyle(placement.style);
    setOpen(true);
  }

  function commitValue(nextValue: string) {
    if (!isControlled) {
      setInternalValue(nextValue);
    }

    onValueChange?.(nextValue);
    onChange?.(createSyntheticChangeEvent<HTMLSelectElement>(name, nextValue));
    setOpen(false);
  }

  return (
    <div className="relative w-full">
      {name ? <input name={name} type="hidden" value={selectedValue} /> : null}

      <button
        ref={triggerRef}
        aria-controls={listboxId}
        aria-describedby={ariaDescribedBy}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        autoFocus={autoFocus}
        className={joinClassNames(
          triggerClassName,
          disabled &&
            "cursor-not-allowed border-stone-200 bg-stone-100 text-slate-400 shadow-none",
          className,
        )}
        disabled={disabled}
        id={id}
        onClick={toggleOpen}
        tabIndex={tabIndex}
        title={title}
        type="button"
      >
        <span
          className={joinClassNames(
            "min-w-0 flex-1 truncate pr-1",
            selectedValue ? "text-slate-900" : "text-slate-400",
          )}
        >
          {triggerLabel}
        </span>
        <span className={iconButtonClassName}>
          <ChevronDownIcon />
        </span>
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
        <div
          ref={panelRef}
          className={joinClassNames(
            popoverSurfaceClassName,
            selectPopoverSurfaceClassName,
          )}
          style={popoverStyle}
        >
          <div className="border-b border-stone-200 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-slate-500">
                선택 목록
              </p>
              {required ? (
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[0.68rem] font-semibold text-amber-900">
                  필수
                </span>
              ) : null}
            </div>
          </div>
          <div
            aria-activedescendant={selectedValue || undefined}
            className="max-h-72 overflow-y-auto p-2"
            id={listboxId}
            role="listbox"
          >
            {options.map((option) => {
              const selected = option.value === selectedValue;

              return (
                <button
                  key={`${option.value}-${option.label}`}
                  aria-selected={selected}
                  className={joinClassNames(
                    "flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl px-3 py-3 text-left text-sm transition duration-150",
                    option.disabled
                      ? "cursor-not-allowed text-slate-300"
                      : selected
                        ? "bg-slate-950 text-white shadow-[0_16px_24px_-20px_rgba(15,23,42,0.8)] hover:-translate-y-px hover:bg-slate-900 hover:shadow-[0_18px_28px_-22px_rgba(15,23,42,0.78)]"
                        : "text-slate-700 hover:-translate-y-px hover:bg-amber-50 hover:text-slate-950 hover:shadow-[0_14px_24px_-22px_rgba(180,83,9,0.3)]",
                  )}
                  disabled={option.disabled}
                  onClick={() => commitValue(option.value)}
                  role="option"
                  type="button"
                >
                  <span className="min-w-0 flex-1 leading-6">{option.label}</span>
                  <span
                    className={joinClassNames(
                      "flex h-6 w-6 items-center justify-center rounded-full border",
                      selected
                        ? "border-white/25 bg-white/10 text-white"
                        : "border-stone-200 bg-white text-slate-300",
                    )}
                  >
                    {selected ? <CheckIcon /> : null}
                  </span>
                </button>
              );
            })}
          </div>
        </div>,
        document.body,
      )
        : null}
    </div>
  );
}

export function CompactSelectControl(props: SelectControlProps) {
  return (
    <SelectControl
      {...props}
      className={joinClassNames(compactSelectControlClassName, props.className)}
    />
  );
}

type DatePickerMode = "day" | "month" | "year";

export interface DateControlProps extends BaseTriggerProps {
  defaultValue?: string | number | readonly string[];
  value?: string | number | readonly string[];
  min?: string | number;
  max?: string | number;
  placeholder?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  onValueChange?: (value: string) => void;
}

export function DateControl({
  autoFocus,
  className,
  defaultValue,
  disabled,
  id,
  max,
  min,
  name,
  onChange,
  onValueChange,
  placeholder,
  required,
  tabIndex,
  title,
  value,
  "aria-describedby": ariaDescribedBy,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: DateControlProps) {
  const isControlled = value !== undefined;
  const normalizedDefaultValue = normalizeControlValue(defaultValue);
  const [internalValue, setInternalValue] = useState(normalizedDefaultValue);
  const selectedValue = isControlled
    ? normalizeControlValue(value)
    : internalValue;
  const minValue = normalizeDateBoundary(min);
  const maxValue = normalizeDateBoundary(max);
  const selectedDate = useMemo(
    () => parseDateString(selectedValue),
    [selectedValue],
  );
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<DatePickerMode>("day");
  const [viewDate, setViewDate] = useState(
    selectedDate ?? parseDateString(normalizedDefaultValue) ?? new Date(),
  );
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>({});

  useDismissLayer([triggerRef, panelRef], open, () => setOpen(false));

  useEffect(() => {
    if (!open) {
      return;
    }

    function updatePlacement() {
      const placement = resolvePopoverPlacement(triggerRef, {
        panelHeight: 360,
        panelWidth: 288,
      });

      setPopoverStyle(placement.style);
    }

    updatePlacement();
    window.addEventListener("resize", updatePlacement);
    window.addEventListener("scroll", updatePlacement, true);

    return () => {
      window.removeEventListener("resize", updatePlacement);
      window.removeEventListener("scroll", updatePlacement, true);
    };
  }, [open]);

  function toggleOpen() {
    if (open) {
      setOpen(false);
      return;
    }

    setMode("day");
    setViewDate(selectedDate ?? new Date());
    const placement = resolvePopoverPlacement(triggerRef, {
      panelHeight: 360,
      panelWidth: 288,
    });

    setPopoverStyle(placement.style);
    setOpen(true);
  }

  function commitValue(nextValue: string) {
    if (!isControlled) {
      setInternalValue(nextValue);
    }

    onValueChange?.(nextValue);
    onChange?.(createSyntheticChangeEvent<HTMLInputElement>(name, nextValue));
    setOpen(false);
  }

  function selectDate(date: Date) {
    if (isDateDisabled(date, minValue, maxValue)) {
      return;
    }

    commitValue(formatDateValue(date));
  }

  function handleNavigate(step: number) {
    if (mode === "day") {
      setViewDate((current) => addMonths(current, step));
      return;
    }

    if (mode === "month") {
      setViewDate((current) => addYears(current, step));
      return;
    }

    setViewDate((current) => addYears(current, step * 12));
  }

  const calendarDays = buildCalendarDays(viewDate);
  const today = new Date();
  const displayText = selectedValue
    ? formatDisplayDate(selectedValue)
    : (placeholder ?? "날짜 선택");
  const yearPageStart = Math.floor(viewDate.getFullYear() / 12) * 12;
  const yearOptions = Array.from({ length: 12 }, (_, index) => yearPageStart + index);

  return (
    <div className="relative">
      {name ? <input name={name} type="hidden" value={selectedValue} /> : null}

      <button
        ref={triggerRef}
        aria-describedby={ariaDescribedBy}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        autoFocus={autoFocus}
        className={joinClassNames(
          triggerClassName,
          disabled &&
            "cursor-not-allowed border-stone-200 bg-stone-100 text-slate-400 shadow-none",
          className,
        )}
        disabled={disabled}
        id={id}
        onClick={toggleOpen}
        tabIndex={tabIndex}
        title={title}
        type="button"
      >
        <span
          className={joinClassNames(
            "min-w-0 flex-1 truncate pr-1",
            selectedValue ? "text-slate-900" : "text-slate-400",
          )}
        >
          {displayText}
        </span>
        <span className={iconButtonClassName}>
          <CalendarIcon />
        </span>
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
        <div
          ref={panelRef}
          className={joinClassNames(
            popoverSurfaceClassName,
          )}
          style={popoverStyle}
          role="dialog"
        >
          <div className="border-b border-stone-200 px-3.5 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <button
                className={iconButtonClassName}
                onClick={() => handleNavigate(-1)}
                type="button"
              >
                <ArrowIcon direction="left" />
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  className={joinClassNames(
                    "rounded-full px-2.5 py-1.5 text-sm font-semibold transition",
                    mode === "year"
                      ? "bg-slate-950 text-white"
                      : "bg-stone-100 text-slate-700 hover:bg-stone-200",
                  )}
                  onClick={() => setMode((current) => (current === "year" ? "day" : "year"))}
                  type="button"
                >
                  {viewDate.getFullYear()}년
                </button>
                <button
                  className={joinClassNames(
                    "rounded-full px-2.5 py-1.5 text-sm font-semibold transition",
                    mode === "month"
                      ? "bg-slate-950 text-white"
                      : "bg-stone-100 text-slate-700 hover:bg-stone-200",
                  )}
                  onClick={() => setMode((current) => (current === "month" ? "day" : "month"))}
                  type="button"
                >
                  {calendarMonths[viewDate.getMonth()]}
                </button>
              </div>

              <button
                className={iconButtonClassName}
                onClick={() => handleNavigate(1)}
                type="button"
              >
                <ArrowIcon direction="right" />
              </button>
            </div>
          </div>

          {mode === "day" ? (
            <div className="px-3.5 pb-3.5 pt-2.5">
              <div className="mb-1.5 grid grid-cols-7 gap-1 text-center text-[0.68rem] font-semibold text-slate-500">
                {calendarWeekdays.map((weekday) => (
                  <span key={weekday} className="py-2">
                    {weekday}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map(({ date, isCurrentMonth }) => {
                  const disabledDate = isDateDisabled(date, minValue, maxValue);
                  const selected = selectedDate ? isSameDate(date, selectedDate) : false;
                  const isToday = isSameDate(date, today);

                  return (
                    <button
                      key={formatDateValue(date)}
                      aria-label={formatDateValue(date)}
                      className={joinClassNames(
                        "flex h-9 cursor-pointer items-center justify-center rounded-2xl text-sm font-medium transition duration-150",
                        !isCurrentMonth && "text-slate-300",
                        isCurrentMonth && "text-slate-700",
                        isToday &&
                          !selected &&
                          "border border-blue-200 bg-blue-50 text-blue-700",
                        selected &&
                          "bg-slate-950 text-white shadow-[0_16px_24px_-20px_rgba(15,23,42,0.8)] hover:-translate-y-px hover:bg-slate-900 hover:shadow-[0_18px_28px_-22px_rgba(15,23,42,0.76)]",
                        !selected &&
                          !disabledDate &&
                          "hover:-translate-y-px hover:bg-stone-100 hover:shadow-[0_12px_18px_-18px_rgba(15,23,42,0.3)]",
                        disabledDate && "cursor-not-allowed text-slate-300",
                      )}
                      disabled={disabledDate}
                      onClick={() => selectDate(date)}
                      type="button"
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {mode === "month" ? (
            <div className="grid grid-cols-3 gap-1.5 px-3.5 pb-3.5 pt-2.5">
              {calendarMonths.map((monthLabel, monthIndex) => {
                const selected =
                  selectedDate &&
                  selectedDate.getFullYear() === viewDate.getFullYear() &&
                  selectedDate.getMonth() === monthIndex;

                return (
                  <button
                    key={monthLabel}
                    className={joinClassNames(
                      "cursor-pointer rounded-2xl px-3 py-2.5 text-sm font-semibold transition duration-150",
                      selected
                        ? "bg-slate-950 text-white shadow-[0_16px_24px_-20px_rgba(15,23,42,0.8)] hover:-translate-y-px hover:bg-slate-900"
                        : "bg-stone-100 text-slate-700 hover:-translate-y-px hover:bg-blue-50 hover:text-blue-800 hover:shadow-[0_12px_18px_-18px_rgba(37,99,235,0.42)]",
                    )}
                    onClick={() => {
                      setViewDate(new Date(viewDate.getFullYear(), monthIndex, 1));
                      setMode("day");
                    }}
                    type="button"
                  >
                    {monthLabel}
                  </button>
                );
              })}
            </div>
          ) : null}

          {mode === "year" ? (
            <div className="px-3.5 pb-3.5 pt-2.5">
              <p className="mb-3 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-slate-500">
                연도 선택
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {yearOptions.map((yearOption) => {
                  const selected = selectedDate?.getFullYear() === yearOption;

                  return (
                    <button
                      key={yearOption}
                      className={joinClassNames(
                        "cursor-pointer rounded-2xl px-3 py-2.5 text-sm font-semibold transition duration-150",
                        selected
                          ? "bg-slate-950 text-white shadow-[0_16px_24px_-20px_rgba(15,23,42,0.8)] hover:-translate-y-px hover:bg-slate-900"
                          : "bg-stone-100 text-slate-700 hover:-translate-y-px hover:bg-blue-50 hover:text-blue-800 hover:shadow-[0_12px_18px_-18px_rgba(37,99,235,0.42)]",
                      )}
                      onClick={() => {
                        setViewDate(new Date(yearOption, viewDate.getMonth(), 1));
                        setMode("month");
                      }}
                      type="button"
                    >
                      {yearOption}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-between border-t border-stone-200 px-3.5 py-2.5">
            <button
              className="cursor-pointer rounded-full px-3 py-1.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
              onClick={() => {
                setViewDate(today);
                selectDate(today);
              }}
              type="button"
            >
              오늘
            </button>
            <button
              className="cursor-pointer rounded-full px-3 py-1.5 text-sm font-semibold text-slate-500 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:text-slate-300"
              disabled={required}
              onClick={() => commitValue("")}
              type="button"
            >
              지우기
            </button>
          </div>
        </div>,
        document.body,
      )
        : null}
    </div>
  );
}

export interface CurrencyControlProps extends BaseTriggerProps {
  defaultValue?: string | number | readonly string[];
  value?: string | number | readonly string[];
  placeholder?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  onValueChange?: (value: string) => void;
}

function normalizeCurrencyValue(
  value: string | number | readonly string[] | undefined,
) {
  return extractCurrencyDigits(normalizeControlValue(value));
}

function formatCurrencyPlaceholder(placeholder?: string) {
  if (!placeholder) {
    return "숫자만 입력";
  }

  const digits = extractCurrencyDigits(placeholder);

  if (!digits) {
    return placeholder;
  }

  return `${formatCurrencyInputDisplay(digits)}원`;
}

export function CurrencyControl({
  autoFocus,
  className,
  defaultValue,
  disabled,
  id,
  name,
  onChange,
  onValueChange,
  placeholder,
  required,
  tabIndex,
  title,
  value,
  "aria-describedby": ariaDescribedBy,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: CurrencyControlProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(
    normalizeCurrencyValue(defaultValue),
  );
  const inputRef = useRef<HTMLInputElement | null>(null);
  const pendingDigitsBeforeCaretRef = useRef<number | null>(null);
  const rawValue = isControlled ? normalizeCurrencyValue(value) : internalValue;
  const displayValue = formatCurrencyInputDisplay(rawValue);
  const suffixVisible = displayValue.length > 0;

  useLayoutEffect(() => {
    if (
      pendingDigitsBeforeCaretRef.current === null ||
      !inputRef.current ||
      document.activeElement !== inputRef.current
    ) {
      return;
    }

    const nextCaretPosition = resolveCurrencyCaretPosition(
      displayValue,
      pendingDigitsBeforeCaretRef.current,
    );

    inputRef.current.setSelectionRange(nextCaretPosition, nextCaretPosition);
    pendingDigitsBeforeCaretRef.current = null;
  }, [displayValue]);

  function commitValue(nextRawValue: string) {
    if (!isControlled) {
      setInternalValue(nextRawValue);
    }

    onValueChange?.(nextRawValue);
    onChange?.(createSyntheticChangeEvent<HTMLInputElement>(name, nextRawValue));
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    pendingDigitsBeforeCaretRef.current = countDigitsBeforeCaret(
      event.target.value,
      event.target.selectionStart,
    );
    commitValue(extractCurrencyDigits(event.target.value));
  }

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        aria-describedby={ariaDescribedBy}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        autoFocus={autoFocus}
        className={joinClassNames(
          formControlClassName,
          "pr-14",
          disabled &&
            "cursor-not-allowed border-stone-200 bg-stone-100 text-slate-400 shadow-none",
          className,
        )}
        disabled={disabled}
        id={id}
        inputMode="numeric"
        name={name}
        onChange={handleChange}
        placeholder={formatCurrencyPlaceholder(placeholder)}
        required={required}
        tabIndex={tabIndex}
        title={title}
        type="text"
        value={displayValue}
      />
      <span
        aria-hidden="true"
        className={joinClassNames(
          "pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400 transition-opacity",
          suffixVisible ? "opacity-100" : "opacity-0",
        )}
      >
        원
      </span>
    </div>
  );
}

export interface ModelNumberControlProps extends BaseTriggerProps {
  defaultValue?: string | number | readonly string[];
  value?: string | number | readonly string[];
  placeholder?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  onValueChange?: (value: string) => void;
}

function normalizeModelNumberValue(
  value: string | number | readonly string[] | undefined,
) {
  return formatModelNumberInput(normalizeControlValue(value));
}

export function ModelNumberControl({
  autoFocus,
  className,
  defaultValue,
  disabled,
  id,
  name,
  onChange,
  onValueChange,
  placeholder,
  required,
  tabIndex,
  title,
  value,
  "aria-describedby": ariaDescribedBy,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: ModelNumberControlProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(
    normalizeModelNumberValue(defaultValue),
  );
  const inputRef = useRef<HTMLInputElement | null>(null);
  const pendingCharactersBeforeCaretRef = useRef<number | null>(null);
  const resolvedValue = isControlled ? normalizeModelNumberValue(value) : internalValue;

  useLayoutEffect(() => {
    if (
      pendingCharactersBeforeCaretRef.current === null ||
      !inputRef.current ||
      document.activeElement !== inputRef.current
    ) {
      return;
    }

    const nextCaretPosition = resolveModelNumberCaretPosition(
      resolvedValue,
      pendingCharactersBeforeCaretRef.current,
    );

    inputRef.current.setSelectionRange(nextCaretPosition, nextCaretPosition);
    pendingCharactersBeforeCaretRef.current = null;
  }, [resolvedValue]);

  function commitValue(nextValue: string) {
    if (!isControlled) {
      setInternalValue(nextValue);
    }

    onValueChange?.(nextValue);
    onChange?.(createSyntheticChangeEvent<HTMLInputElement>(name, nextValue));
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    pendingCharactersBeforeCaretRef.current = countModelNumberCharactersBeforeCaret(
      event.target.value,
      event.target.selectionStart,
    );
    commitValue(formatModelNumberInput(event.target.value));
  }

  return (
    <input
      ref={inputRef}
      aria-describedby={ariaDescribedBy}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      autoCapitalize="characters"
      autoCorrect="off"
      autoFocus={autoFocus}
      className={joinClassNames(
        formControlClassName,
        disabled &&
          "cursor-not-allowed border-stone-200 bg-stone-100 text-slate-400 shadow-none",
        className,
      )}
      disabled={disabled}
      id={id}
      name={name}
      onChange={handleChange}
      placeholder={placeholder ?? "SM-3028RKSPEW"}
      required={required}
      spellCheck={false}
      tabIndex={tabIndex}
      title={title}
      type="text"
      value={resolvedValue}
    />
  );
}
