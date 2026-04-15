"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { SelectControl } from "@/components/workspace/form-client-controls";
import type {
  SalesFilters,
  SalesStoreRecord,
  SalesStatusFilterValue,
} from "@/components/workspace/sales-types";
import {
  formControlClassName,
  joinClassNames,
  selectControlClassName,
} from "@/components/workspace/ui-classnames";

interface SalesFilterBarProps {
  carriers: Array<{ id: string; name: string }>;
  filters: SalesFilters;
  stores: SalesStoreRecord[];
}

function buildSalesQueryString(filters: {
  q: string;
  carrierId: string;
  storeId: string;
  status: SalesStatusFilterValue;
}) {
  const searchParams = new URLSearchParams();

  if (filters.q.trim()) {
    searchParams.set("q", filters.q.trim());
  }

  if (filters.carrierId) {
    searchParams.set("carrierId", filters.carrierId);
  }

  if (filters.storeId) {
    searchParams.set("storeId", filters.storeId);
  }

  if (filters.status !== "all") {
    searchParams.set("status", filters.status);
  }

  return searchParams.toString();
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

export function SalesFilterBar({
  carriers,
  filters,
  stores,
}: SalesFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState(filters.q);
  const [carrierId, setCarrierId] = useState(filters.carrierId);
  const [storeId, setStoreId] = useState(filters.storeId);
  const [status, setStatus] = useState<SalesStatusFilterValue>(filters.status);
  const latestQueryRef = useRef("");
  const initializedRef = useRef(false);

  useEffect(() => {
    setQ(filters.q);
    setCarrierId(filters.carrierId);
    setStoreId(filters.storeId);
    setStatus(filters.status);
    latestQueryRef.current = buildSalesQueryString({
      q: filters.q,
      carrierId: filters.carrierId,
      storeId: filters.storeId,
      status: filters.status,
    });
  }, [filters]);

  const queryString = useMemo(
    () =>
      buildSalesQueryString({
        q,
        carrierId,
        storeId,
        status,
      }),
    [carrierId, q, status, storeId],
  );

  function pushFilters(nextQueryString: string) {
    if (latestQueryRef.current === nextQueryString) {
      return;
    }

    latestQueryRef.current = nextQueryString;
    router.replace(nextQueryString ? `${pathname}?${nextQueryString}` : pathname, {
      scroll: false,
    });
  }

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      latestQueryRef.current = queryString;
      return;
    }

    const timeout = window.setTimeout(() => {
      pushFilters(queryString);
    }, 320);

    return () => window.clearTimeout(timeout);
  }, [queryString]);

  const unifiedControlClassName =
    "h-11 min-h-11 rounded-[1rem] px-3.5 py-0 text-[0.95rem]";

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
      <FilterField label="검색어">
        <input
          aria-label="판매 검색어"
          className={joinClassNames(
            formControlClassName,
            unifiedControlClassName,
          )}
          onChange={(event) => setQ(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              pushFilters(
                buildSalesQueryString({
                  q,
                  carrierId,
                  storeId,
                  status,
                }),
              );
            }
          }}
          placeholder="고객명 또는 담당자"
          value={q}
        />
      </FilterField>

      <FilterField label="통신사">
        <SelectControl
          aria-label="통신사 필터"
          className={joinClassNames(
            selectControlClassName,
            unifiedControlClassName,
          )}
          onValueChange={setCarrierId}
          value={carrierId}
        >
          <option value="">전체 통신사</option>
          {carriers.map((carrier) => (
            <option key={carrier.id} value={carrier.id}>
              {carrier.name}
            </option>
          ))}
        </SelectControl>
      </FilterField>

      <FilterField label="매장">
        <SelectControl
          aria-label="매장 필터"
          className={joinClassNames(
            selectControlClassName,
            unifiedControlClassName,
          )}
          onValueChange={setStoreId}
          value={storeId}
        >
          <option value="">전체 매장</option>
          {stores.map((store) => (
            <option key={store.id} value={store.id}>
              {store.name}
            </option>
          ))}
        </SelectControl>
      </FilterField>

      <FilterField label="처리 상태">
        <SelectControl
          aria-label="처리 상태 필터"
          className={joinClassNames(
            selectControlClassName,
            unifiedControlClassName,
          )}
          onValueChange={(value) => setStatus(value as SalesStatusFilterValue)}
          value={status}
        >
          <option value="all">전체 기록</option>
          <option value="COMPLETED">완료 판매</option>
          <option value="CANCELED">취소 이력</option>
        </SelectControl>
      </FilterField>
    </div>
  );
}
