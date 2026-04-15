import type { PaginationState } from "@/lib/pagination";
import { getPaginationRange } from "@/lib/pagination";

import { TonePill } from "@/components/workspace/workspace-primitives";
import { secondaryButtonClassName } from "@/components/workspace/ui-classnames";

interface ListPaginationControlsProps {
  pagination: PaginationState;
  itemLabel: string;
  buildHref: (page: number) => string;
}

export function ListPaginationControls({
  pagination,
  itemLabel,
  buildHref,
}: ListPaginationControlsProps) {
  const paginationRange = getPaginationRange(pagination);

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
      {pagination.totalPages > 1 ? (
        <div className="flex flex-wrap gap-2">
          {pagination.page > 1 ? (
            <a
              href={buildHref(pagination.page - 1)}
              className={`${secondaryButtonClassName} h-9 px-4`}
            >
              이전 페이지
            </a>
          ) : null}
          {pagination.page < pagination.totalPages ? (
            <a
              href={buildHref(pagination.page + 1)}
              className={`${secondaryButtonClassName} h-9 px-4`}
            >
              다음 페이지
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
