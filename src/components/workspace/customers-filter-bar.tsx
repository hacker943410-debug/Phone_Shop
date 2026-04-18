"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

import { SelectControl } from "@/components/workspace/form-client-controls";
import type {
  CustomerCarrierOption,
  CustomerFilters,
} from "@/components/workspace/customers-overview";
import {
  formControlClassName,
  joinClassNames,
  selectControlClassName,
} from "@/components/workspace/ui-classnames";
import {
  buildCustomersQueryString,
  type CustomersBaseFilters,
} from "@/lib/customers-url-state";

interface CustomersFilterBarProps {
  carriers: CustomerCarrierOption[];
  filters: CustomerFilters;
  returnTo: string | null;
}

function FilterField({
  children,
  className,
  label,
}: {
  children: React.ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <div className={joinClassNames("space-y-2 text-sm font-medium text-slate-700", className)}>
      <span>{label}</span>
      {children}
    </div>
  );
}

export function CustomersFilterBar({
  carriers,
  filters,
  returnTo,
}: CustomersFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const debounceRef = useRef<number | null>(null);
  const latestFiltersRef = useRef<CustomersBaseFilters>(filters);
  const latestQueryRef = useRef(
    buildCustomersQueryString(filters, {
      returnTo,
    }),
  );

  useEffect(() => {
    latestFiltersRef.current = filters;
    latestQueryRef.current = buildCustomersQueryString(filters, {
      returnTo,
    });

    if (searchInputRef.current && searchInputRef.current.value !== filters.q) {
      searchInputRef.current.value = filters.q;
    }

    return () => {
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [filters, returnTo]);

  const pushFilters = useCallback(
    (nextQueryString: string) => {
      if (latestQueryRef.current === nextQueryString) {
        return;
      }

      latestQueryRef.current = nextQueryString;
      router.replace(nextQueryString ? `${pathname}?${nextQueryString}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router],
  );

  function getDraftFilters(): CustomersBaseFilters {
    return {
      ...latestFiltersRef.current,
      q: searchInputRef.current?.value ?? latestFiltersRef.current.q,
    };
  }

  function scheduleQueryPush(nextQuery: string) {
    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(() => {
      pushFilters(
        buildCustomersQueryString(
          {
            ...latestFiltersRef.current,
            q: nextQuery,
          },
          { returnTo },
        ),
      );
    }, 320);
  }

  function updateFilters(overrides: Partial<CustomersBaseFilters>) {
    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current);
    }

    pushFilters(
      buildCustomersQueryString(
        {
          ...getDraftFilters(),
          ...overrides,
        },
        { returnTo },
      ),
    );
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <FilterField className="w-full md:w-[15rem]" label="검색">
        <input
          ref={searchInputRef}
          aria-label="고객 검색"
          className={formControlClassName}
          defaultValue={filters.q}
          onChange={(event) => scheduleQueryPush(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              updateFilters({
                q: searchInputRef.current?.value ?? filters.q,
              });
            }
          }}
          placeholder="이름 또는 연락처"
        />
      </FilterField>

      <FilterField className="w-full md:w-[10.5rem]" label="통신사">
        <SelectControl
          aria-label="고객 통신사 필터"
          className={joinClassNames(selectControlClassName, "w-full")}
          onValueChange={(value) => updateFilters({ carrierId: value })}
          value={filters.carrierId}
        >
          <option value="">전체</option>
          {carriers.map((carrier) => (
            <option key={carrier.id} value={carrier.id}>
              {carrier.name}
            </option>
          ))}
        </SelectControl>
      </FilterField>

      <FilterField className="w-full md:w-[9.5rem]" label="미수">
        <SelectControl
          aria-label="고객 미수 필터"
          className={joinClassNames(selectControlClassName, "w-full")}
          onValueChange={(value) =>
            updateFilters({
              receivable: value as CustomerFilters["receivable"],
            })
          }
          value={filters.receivable}
        >
          <option value="all">전체</option>
          <option value="outstanding">보유</option>
          <option value="clear">없음</option>
        </SelectControl>
      </FilterField>
    </div>
  );
}
