import type { SalesPagination } from "@/components/workspace/sales-types";
import { TonePill } from "@/components/workspace/workspace-primitives";
import {
  joinClassNames,
  secondaryButtonClassName,
} from "@/components/workspace/ui-classnames";
import { getPaginationRange } from "@/lib/pagination";

interface SalesPaginationControlsProps {
  buildHref: (page: number) => string;
  itemLabel: string;
  pagination: SalesPagination;
}

export function SalesPaginationControls({
  buildHref,
  itemLabel,
  pagination,
}: SalesPaginationControlsProps) {
  const paginationRange = getPaginationRange(pagination);
  const firstPage = 1;
  const lastPage = pagination.totalPages;
  const previousPage = Math.max(firstPage, pagination.page - 1);
  const nextPage = Math.min(lastPage, pagination.page + 1);
  const firstDisabled = pagination.page === firstPage;
  const lastDisabled = pagination.page === lastPage;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-2">
        <TonePill
          label={`${paginationRange.start}-${paginationRange.end} / ${pagination.totalCount}${itemLabel}`}
          tone="slate"
        />
        <TonePill
          label={`페이지 ${pagination.page}/${pagination.totalPages}`}
          tone="teal"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <a
          aria-disabled={firstDisabled}
          aria-label="첫 페이지"
          className={joinClassNames(
            `${secondaryButtonClassName} h-9 min-w-9 px-3`,
            firstDisabled && "pointer-events-none opacity-45",
          )}
          href={buildHref(firstPage)}
        >
          &lt;&lt;
        </a>
        <a
          aria-disabled={firstDisabled}
          aria-label="이전 페이지"
          className={joinClassNames(
            `${secondaryButtonClassName} h-9 min-w-9 px-3`,
            firstDisabled && "pointer-events-none opacity-45",
          )}
          href={buildHref(previousPage)}
        >
          &lt;
        </a>
        <a
          aria-current="page"
          className={joinClassNames(
            `${secondaryButtonClassName} h-9 min-w-9 px-3`,
            "border-blue-300 bg-blue-50 text-blue-800 shadow-[0_14px_20px_-18px_rgba(37,99,235,0.6)]",
          )}
          href={buildHref(pagination.page)}
        >
          {pagination.page}
        </a>
        <a
          aria-disabled={lastDisabled}
          aria-label="다음 페이지"
          className={joinClassNames(
            `${secondaryButtonClassName} h-9 min-w-9 px-3`,
            lastDisabled && "pointer-events-none opacity-45",
          )}
          href={buildHref(nextPage)}
        >
          &gt;
        </a>
        <a
          aria-disabled={lastDisabled}
          aria-label="마지막 페이지"
          className={joinClassNames(
            `${secondaryButtonClassName} h-9 min-w-9 px-3`,
            lastDisabled && "pointer-events-none opacity-45",
          )}
          href={buildHref(lastPage)}
        >
          &gt;&gt;
        </a>
      </div>
    </div>
  );
}
