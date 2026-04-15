"use client";

import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";

import {
  formControlClassName,
  joinClassNames,
} from "@/components/workspace/ui-classnames";

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

function usePopoverDirection(
  open: boolean,
  triggerRef: React.RefObject<HTMLElement | null>,
  panelHeight = 340,
) {
  const [openUpward, setOpenUpward] = useState(false);

  useEffect(() => {
    if (!open || !triggerRef.current) {
      return;
    }

    const rect = triggerRef.current.getBoundingClientRect();
    const availableBelow = window.innerHeight - rect.bottom;
    const availableAbove = rect.top;

    setOpenUpward(availableBelow < panelHeight && availableAbove > availableBelow);
  }, [open, panelHeight, triggerRef]);

  return openUpward;
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
  "flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-blue-700 transition duration-150 hover:-translate-y-px hover:border-blue-200 hover:bg-blue-100 hover:shadow-[0_12px_20px_-18px_rgba(37,99,235,0.55)]";

const popoverSurfaceClassName =
  "absolute z-40 w-[22rem] min-w-full max-w-[calc(100vw-2rem)] overflow-hidden rounded-[1.4rem] border border-stone-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(247,245,241,0.98)_100%)] shadow-[0_28px_60px_-30px_rgba(15,23,42,0.32)] backdrop-blur";

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
  const openUpward = usePopoverDirection(open, triggerRef, 320);

  useDismissLayer([triggerRef, panelRef], open, () => setOpen(false));

  function commitValue(nextValue: string) {
    if (!isControlled) {
      setInternalValue(nextValue);
    }

    onValueChange?.(nextValue);
    onChange?.(createSyntheticChangeEvent<HTMLSelectElement>(name, nextValue));
    setOpen(false);
  }

  return (
    <div className="relative">
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
        onClick={() => setOpen((current) => !current)}
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

      {open ? (
        <div
          ref={panelRef}
          className={joinClassNames(
            popoverSurfaceClassName,
            openUpward
              ? "bottom-[calc(100%+0.55rem)]"
              : "top-[calc(100%+0.55rem)]",
          )}
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
                        : "text-slate-700 hover:-translate-y-px hover:bg-blue-50 hover:text-slate-950 hover:shadow-[0_14px_24px_-22px_rgba(37,99,235,0.45)]",
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
        </div>
      ) : null}
    </div>
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
  const openUpward = usePopoverDirection(open, triggerRef, 390);

  useEffect(() => {
    if (!open) {
      return;
    }

    setMode("day");
    setViewDate(selectedDate ?? new Date());
  }, [open, selectedDate]);

  useDismissLayer([triggerRef, panelRef], open, () => setOpen(false));

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
        onClick={() => setOpen((current) => !current)}
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

      {open ? (
        <div
          ref={panelRef}
          className={joinClassNames(
            popoverSurfaceClassName,
            openUpward
              ? "bottom-[calc(100%+0.55rem)]"
              : "top-[calc(100%+0.55rem)]",
          )}
          role="dialog"
        >
          <div className="border-b border-stone-200 px-4 py-3">
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
                    "rounded-full px-3 py-1.5 text-sm font-semibold transition",
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
                    "rounded-full px-3 py-1.5 text-sm font-semibold transition",
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
            <div className="px-4 pb-4 pt-3">
              <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[0.72rem] font-semibold text-slate-500">
                {calendarWeekdays.map((weekday) => (
                  <span key={weekday} className="py-2">
                    {weekday}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {calendarDays.map(({ date, isCurrentMonth }) => {
                  const disabledDate = isDateDisabled(date, minValue, maxValue);
                  const selected = selectedDate ? isSameDate(date, selectedDate) : false;
                  const isToday = isSameDate(date, today);

                  return (
                    <button
                      key={formatDateValue(date)}
                      aria-label={formatDateValue(date)}
                      className={joinClassNames(
                        "flex h-10 cursor-pointer items-center justify-center rounded-2xl text-sm font-medium transition duration-150",
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
            <div className="grid grid-cols-3 gap-2 px-4 pb-4 pt-3">
              {calendarMonths.map((monthLabel, monthIndex) => {
                const selected =
                  selectedDate &&
                  selectedDate.getFullYear() === viewDate.getFullYear() &&
                  selectedDate.getMonth() === monthIndex;

                return (
                  <button
                    key={monthLabel}
                    className={joinClassNames(
                      "cursor-pointer rounded-2xl px-3 py-3 text-sm font-semibold transition duration-150",
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
            <div className="px-4 pb-4 pt-3">
              <p className="mb-3 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-slate-500">
                연도 선택
              </p>
              <div className="grid grid-cols-3 gap-2">
                {yearOptions.map((yearOption) => {
                  const selected = selectedDate?.getFullYear() === yearOption;

                  return (
                    <button
                      key={yearOption}
                      className={joinClassNames(
                        "cursor-pointer rounded-2xl px-3 py-3 text-sm font-semibold transition duration-150",
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

          <div className="flex items-center justify-between border-t border-stone-200 px-4 py-3">
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
        </div>
      ) : null}
    </div>
  );
}
