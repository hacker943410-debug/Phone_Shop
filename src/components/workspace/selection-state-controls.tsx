import { joinClassNames } from "@/components/workspace/ui-classnames";

const selectionButtonClassName =
  "inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-stone-300 bg-[linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(246,243,238,1)_100%)] text-stone-600 shadow-[0_14px_22px_-20px_rgba(15,23,42,0.35)] transition-[transform,box-shadow,border-color,background-color,color] duration-150 hover:-translate-y-px hover:border-amber-300 hover:bg-amber-50 hover:text-amber-900 hover:shadow-[0_18px_26px_-22px_rgba(180,83,9,0.38)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-100";
const selectionSelectedClassName =
  "inline-flex h-9 w-9 items-center justify-center rounded-full border border-emerald-300 bg-[linear-gradient(180deg,rgba(240,253,244,1)_0%,rgba(220,252,231,1)_100%)] text-emerald-700 shadow-[0_16px_24px_-24px_rgba(5,150,105,0.45)]";

function SelectionArrowIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M8.5 12h7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <path
        d="M12.5 8l4 4-4 4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function SelectionCheckIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M7 12.5l3.1 3.1L17.5 8.2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

interface SelectionStateControlProps {
  className?: string;
  onClick?: () => void;
  selectLabel: string;
  selected: boolean;
  selectedLabel?: string;
}

export function SelectionStateControl({
  className,
  onClick,
  selectLabel,
  selected,
  selectedLabel = "선택중",
}: SelectionStateControlProps) {
  if (selected) {
    return (
      <span
        aria-label={selectedLabel}
        role="status"
        title={selectedLabel}
        className={joinClassNames(selectionSelectedClassName, className)}
      >
        <SelectionCheckIcon />
      </span>
    );
  }

  return (
    <button
      type="button"
      aria-label={selectLabel}
      title={selectLabel}
      onClick={onClick}
      className={joinClassNames(selectionButtonClassName, className)}
    >
      <SelectionArrowIcon />
    </button>
  );
}
