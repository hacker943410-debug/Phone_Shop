"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  DateControl,
  SelectControl,
} from "@/components/workspace/form-client-controls";
import {
  dateControlClassName,
  joinClassNames,
  secondaryButtonClassName,
  selectControlClassName,
} from "@/components/workspace/ui-classnames";
import type {
  DashboardFilters,
  DashboardPreset,
  DashboardStaffOption,
  DashboardStoreOption,
} from "@/lib/dashboard-reporting-types";

const presetOptions: Array<{
  value: Exclude<DashboardPreset, "custom">;
  label: string;
}> = [
  { value: "today", label: "오늘" },
  { value: "week", label: "이번 주" },
  { value: "month", label: "이번 달" },
];

function buildDashboardQueryString(filters: DashboardFilters) {
  const searchParams = new URLSearchParams();
  searchParams.set("preset", filters.preset);
  searchParams.set("dateFrom", filters.dateFrom);
  searchParams.set("dateTo", filters.dateTo);

  if (filters.storeId) {
    searchParams.set("storeId", filters.storeId);
  }

  if (filters.staffId) {
    searchParams.set("staffId", filters.staffId);
  }

  return searchParams.toString();
}

export function DashboardFilterBar({
  filters,
  stores,
  staffs,
}: {
  filters: DashboardFilters;
  stores: DashboardStoreOption[];
  staffs: DashboardStaffOption[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function pushFilters(nextFilters: DashboardFilters) {
    startTransition(() => {
      router.push(`${pathname}?${buildDashboardQueryString(nextFilters)}`, {
        scroll: false,
      });
    });
  }

  function applyPreset(preset: Exclude<DashboardPreset, "custom">) {
    const searchParams = new URLSearchParams();
    searchParams.set("preset", preset);

    if (filters.storeId) {
      searchParams.set("storeId", filters.storeId);
    }

    if (filters.staffId) {
      searchParams.set("staffId", filters.staffId);
    }

    startTransition(() => {
      router.push(`${pathname}?${searchParams.toString()}`, { scroll: false });
    });
  }

  function applyRange(nextDateFrom: string, nextDateTo: string) {
    if (!nextDateFrom || !nextDateTo) {
      return;
    }

    let normalizedFrom = nextDateFrom;
    let normalizedTo = nextDateTo;

    if (normalizedFrom > normalizedTo) {
      [normalizedFrom, normalizedTo] = [normalizedTo, normalizedFrom];
    }

    pushFilters({
      ...filters,
      preset: "custom",
      dateFrom: normalizedFrom,
      dateTo: normalizedTo,
    });
  }

  const selectedStoreLabel =
    stores.find((store) => store.id === filters.storeId)?.name ?? "전체 매장";
  const selectedStaffLabel =
    staffs.find((staff) => staff.id === filters.staffId)?.name ?? "전체 직원";

  return (
    <section className="dashboard-reveal rounded-[1.3rem] border border-stone-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(245,243,238,0.98)_100%)] px-4 py-3 shadow-[0_24px_48px_-38px_rgba(15,23,42,0.22)] sm:px-5">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] xl:items-end">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,11rem)_minmax(0,11rem)_auto]">
          <label className="space-y-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
            <span>매장</span>
            <SelectControl
              aria-label="매장 선택"
              className={selectControlClassName}
              value={filters.storeId}
              onValueChange={(storeId) =>
                pushFilters({
                  ...filters,
                  storeId,
                })
              }
            >
              <option value="">전체 매장</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </SelectControl>
          </label>

          <label className="space-y-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
            <span>직원</span>
            <SelectControl
              aria-label="직원 선택"
              className={selectControlClassName}
              value={filters.staffId}
              onValueChange={(staffId) =>
                pushFilters({
                  ...filters,
                  staffId,
                })
              }
            >
              <option value="">전체 직원</option>
              {staffs.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.name}
                </option>
              ))}
            </SelectControl>
          </label>

          <div className="space-y-1">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
              빠른 기간
            </p>
            <div className="flex flex-wrap gap-2">
              {presetOptions.map((preset) => {
                const active = filters.preset === preset.value;

                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => applyPreset(preset.value)}
                    className={joinClassNames(
                      `${secondaryButtonClassName} h-9 px-3.5 text-[0.8rem]`,
                      active &&
                        "!border-slate-950 !bg-none !bg-slate-950 !text-white hover:!border-slate-900 hover:!bg-none hover:!bg-slate-900 hover:!text-white",
                    )}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
            <span>시작일</span>
            <DateControl
              aria-label="시작일"
              className={dateControlClassName}
              value={filters.dateFrom}
              onValueChange={(nextValue) =>
                applyRange(nextValue, filters.dateTo || nextValue)
              }
            />
          </label>

          <label className="space-y-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
            <span>종료일</span>
            <DateControl
              aria-label="종료일"
              className={dateControlClassName}
              value={filters.dateTo}
              onValueChange={(nextValue) =>
                applyRange(filters.dateFrom || nextValue, nextValue)
              }
            />
          </label>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[0.78rem] text-slate-600">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-stone-100 px-3 py-1.5 font-medium">
            {selectedStoreLabel}
          </span>
          <span className="rounded-full bg-stone-100 px-3 py-1.5 font-medium">
            {selectedStaffLabel}
          </span>
          <span className="rounded-full bg-blue-50 px-3 py-1.5 font-medium text-blue-800">
            {filters.dateFrom} ~ {filters.dateTo}
          </span>
        </div>

        <span
          className={joinClassNames(
            "rounded-full px-3 py-1.5 font-medium transition-colors duration-200",
            isPending ? "bg-blue-50 text-blue-800" : "bg-stone-100 text-slate-500",
          )}
        >
          {isPending ? "갱신 중" : "자동 반영"}
        </span>
      </div>
    </section>
  );
}
