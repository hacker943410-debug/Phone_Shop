"use client";

import { useEffect, useState, useTransition } from "react";
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

type DashboardPreset = "today" | "7d" | "30d" | "month" | "custom";

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
  { value: "7d", label: "최근 7일" },
  { value: "30d", label: "최근 30일" },
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
  const [dateFrom, setDateFrom] = useState(filters.dateFrom);
  const [dateTo, setDateTo] = useState(filters.dateTo);

  useEffect(() => {
    setDateFrom(filters.dateFrom);
    setDateTo(filters.dateTo);
  }, [filters.dateFrom, filters.dateTo]);

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

  function applyRange(nextDateFrom: string, nextDateTo: string) {
    if (!nextDateFrom || !nextDateTo) {
      return;
    }

    let normalizedFrom = nextDateFrom;
    let normalizedTo = nextDateTo;

    if (normalizedFrom > normalizedTo) {
      [normalizedFrom, normalizedTo] = [normalizedTo, normalizedFrom];
    }

    setDateFrom(normalizedFrom);
    setDateTo(normalizedTo);
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
          dateFrom,
          dateTo,
          storeId,
        })}`,
      );
      return;
    }

    pushPreset(filters.preset, storeId);
  }

  const selectedStoreLabel =
    stores.find((store) => store.id === filters.storeId)?.name ?? "전체 매장";

  return (
    <section className="rounded-[1.15rem] border border-stone-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(247,245,241,0.96)_100%)] px-4 py-2.5 shadow-[0_18px_36px_-34px_rgba(15,23,42,0.22)] sm:px-5">
      <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center xl:justify-between">
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
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:min-w-[36rem] xl:grid-cols-3">
          <label className="space-y-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
            <span>매장</span>
            <SelectControl
              aria-label="매장 선택"
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

          <label className="space-y-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
            <span>시작일</span>
            <DateControl
              aria-label="시작일"
              className={dateControlClassName}
              value={dateFrom}
              onValueChange={(nextValue) => applyRange(nextValue, dateTo || nextValue)}
            />
          </label>

          <label className="space-y-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
            <span>종료일</span>
            <DateControl
              aria-label="종료일"
              className={dateControlClassName}
              value={dateTo}
              onValueChange={(nextValue) => applyRange(dateFrom || nextValue, nextValue)}
            />
          </label>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-3 text-[0.72rem] font-medium text-slate-500">
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
