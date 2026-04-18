"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

import { SelectControl } from "@/components/workspace/form-client-controls";
import type {
  ReceivableCarrierOption,
  ReceivableCustomerOption,
  ReceivablesFilters,
  ReceivableStatusValue,
} from "@/components/workspace/receivables-types";
import {
  formControlClassName,
  joinClassNames,
  selectControlClassName,
} from "@/components/workspace/ui-classnames";
import {
  buildReceivablesQueryString,
  type ReceivablesUrlFilters,
} from "@/lib/receivables-url-state";

interface ReceivablesFilterBarProps {
  carriers: ReceivableCarrierOption[];
  customers: ReceivableCustomerOption[];
  filters: ReceivablesFilters;
}

function FilterField({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div className="space-y-2 text-sm font-medium text-slate-700">
      <span>{label}</span>
      {children}
    </div>
  );
}

export function ReceivablesFilterBar({
  carriers,
  customers,
  filters,
}: ReceivablesFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const debounceRef = useRef<number | null>(null);
  const latestFiltersRef = useRef<ReceivablesUrlFilters>(filters);
  const latestQueryRef = useRef(buildReceivablesQueryString(filters));

  useEffect(() => {
    latestFiltersRef.current = filters;
    latestQueryRef.current = buildReceivablesQueryString(filters);

    if (searchInputRef.current && searchInputRef.current.value !== filters.q) {
      searchInputRef.current.value = filters.q;
    }

    return () => {
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [filters]);

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

  function getDraftFilters(): ReceivablesUrlFilters {
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
        buildReceivablesQueryString({
          ...latestFiltersRef.current,
          q: nextQuery,
        }),
      );
    }, 320);
  }

  function updateFilters(overrides: Partial<ReceivablesUrlFilters>) {
    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current);
    }

    pushFilters(
      buildReceivablesQueryString({
        ...getDraftFilters(),
        ...overrides,
      }),
    );
  }

  const unifiedControlClassName =
    "h-11 min-h-11 rounded-[1rem] px-3.5 py-0 text-[0.95rem]";

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <FilterField label="고객 검색">
        <input
          ref={searchInputRef}
          aria-label="미수금 고객 검색"
          className={joinClassNames(
            formControlClassName,
            unifiedControlClassName,
          )}
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
          placeholder="고객명 또는 연락처"
        />
      </FilterField>

      <FilterField label="고객">
        <SelectControl
          aria-label="고객 필터"
          className={joinClassNames(
            selectControlClassName,
            unifiedControlClassName,
          )}
          onValueChange={(value) => updateFilters({ customerId: value })}
          value={filters.customerId}
        >
          <option value="">전체 고객</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name} / {customer.phone}
            </option>
          ))}
        </SelectControl>
      </FilterField>

      <FilterField label="통신사">
        <SelectControl
          aria-label="통신사 필터"
          className={joinClassNames(
            selectControlClassName,
            unifiedControlClassName,
          )}
          onValueChange={(value) => updateFilters({ carrierId: value })}
          value={filters.carrierId}
        >
          <option value="">전체 통신사</option>
          {carriers.map((carrier) => (
            <option key={carrier.id} value={carrier.id}>
              {carrier.name}
            </option>
          ))}
        </SelectControl>
      </FilterField>

      <FilterField label="상태">
        <SelectControl
          aria-label="미수금 상태 필터"
          className={joinClassNames(
            selectControlClassName,
            unifiedControlClassName,
          )}
          onValueChange={(value) =>
            updateFilters({ status: value as "all" | ReceivableStatusValue })
          }
          value={filters.status}
        >
          <option value="all">전체</option>
          <option value="UNPAID">미납</option>
          <option value="PARTIALLY_PAID">부분 수납</option>
          <option value="PAID">완납</option>
        </SelectControl>
      </FilterField>
    </div>
  );
}
