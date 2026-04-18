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
import type { DashboardPreset } from "@/lib/dashboard-reporting-types";

interface DashboardFilters {
  preset: DashboardPreset;
  dateFrom: string;
  dateTo: string;
  storeId: string;
}

interface DashboardStoreOption {
  id: string;
  name: string;
}

const presetOptions: Array<{
  value: Exclude<DashboardPreset, "custom">;
  label: string;
}> = [
  { value: "today", label: "오늘" },
  { value: "week", label: "이번주" },
  { value: "month", label: "이번달" },
];

function buildDashboardQueryString(filters: DashboardFilters) {
  const searchParams = new URLSearchParams();
  searchParams.set("preset", filters.preset);
  searchParams.set("dateFrom", filters.dateFrom);
  searchParams.set("dateTo", filters.dateTo);
  if (filters.storeId) {
    searchParams.set("storeId", filters.storeId);
  }
  return searchParams.toString();
}

export function DashboardFilterBar({
  filters,
  stores,
}: {
  filters: DashboardFilters;
  stores: DashboardStoreOption[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function pushSearch(search: string) {
    startTransition(() => {
      router.push(search, { scroll: false });
    });
  }

  function pushPreset(preset: Exclude<DashboardPreset, "custom">, storeId: string) {
    const searchParams = new URLSearchParams();
    searchParams.set("preset", preset);
    if (storeId) {
      searchParams.set("storeId", storeId);
    }
    pushSearch(`${pathname}?${searchParams.toString()}`);
  }

  function applyPreset(preset: Exclude<DashboardPreset, "custom">) {
    pushPreset(preset, filters.storeId);
  }

  function applyCustomPeriod() {
    pushSearch(
      `${pathname}?${buildDashboardQueryString({
        preset: "custom",
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        storeId: filters.storeId,
      })}`,
    );
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

    pushSearch(
      `${pathname}?${buildDashboardQueryString({
        preset: "custom",
        dateFrom: normalizedFrom,
        dateTo: normalizedTo,
        storeId: filters.storeId,
      })}`,
    );
  }

  function applyStore(storeId: string) {
    if (filters.preset === "custom") {
      pushSearch(
        `${pathname}?${buildDashboardQueryString({
          preset: "custom",
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          storeId,
        })}`,
      );
      return;
    }

    pushPreset(filters.preset, storeId);
  }

  const selectedStoreLabel =
    stores.find((store) => store.id === filters.storeId)?.name ?? "전체";

  return (
    <section className="relative z-20 rounded-[1.15rem] border border-stone-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(247,245,241,0.96)_100%)] px-4 py-2 shadow-[0_18px_36px_-34px_rgba(15,23,42,0.22)] sm:px-4.5">
      <div className="flex flex-col gap-2 xl:flex-row xl:items-end xl:justify-between">
        <div className="grid gap-2 sm:grid-cols-[minmax(9rem,12rem)_auto] sm:items-end">
          <label className="space-y-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
            <span>지점</span>
            <SelectControl
              aria-label="지점 선택"
              className={selectControlClassName}
              value={filters.storeId}
              onValueChange={applyStore}
            >
              <option value="">전체</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </SelectControl>
          </label>

          <div className="flex flex-wrap gap-2">
          {presetOptions.map((preset) => {
            const active = filters.preset === preset.value;

            return (
              <button
                key={preset.value}
                type="button"
                onClick={() => applyPreset(preset.value)}
                className={joinClassNames(
                  `${secondaryButtonClassName} h-8.5 cursor-pointer px-3.5 text-[0.78rem] font-semibold`,
                  active &&
                    "!border-slate-950 !bg-slate-950 !text-white hover:!border-slate-900 hover:!bg-slate-900 hover:!text-white",
                )}
              >
                {preset.label}
              </button>
            );
          })}
            <button
              type="button"
              onClick={applyCustomPeriod}
              className={joinClassNames(
                `${secondaryButtonClassName} h-8.5 cursor-pointer px-3.5 text-[0.78rem] font-semibold`,
                filters.preset === "custom" &&
                  "!border-slate-950 !bg-slate-950 !text-white hover:!border-slate-900 hover:!bg-slate-900 hover:!text-white",
              )}
            >
              기간선택
            </button>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:min-w-[20rem] xl:grid-cols-2">
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

      <div className="mt-1.5 flex items-center justify-between gap-3 text-[0.72rem] font-medium text-slate-500">
        <span>
          {selectedStoreLabel} / {filters.dateFrom} ~ {filters.dateTo}
        </span>
        <span
          className={joinClassNames(
            "rounded-full px-2.5 py-1 transition",
            isPending ? "bg-blue-50 text-blue-700" : "bg-stone-100 text-slate-500",
          )}
        >
          {isPending ? "갱신 중" : "자동 반영"}
        </span>
      </div>
    </section>
  );
}
