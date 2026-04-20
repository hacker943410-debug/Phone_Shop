import { parseKstDateInput } from "@/lib/date-utils";

export interface KoreanHolidayItem {
  dateInput: string;
  name: string;
}

export type KoreanHolidayFetchStatus = "api" | "cache" | "error";

export interface KoreanHolidayMonthResult {
  monthInput: string;
  items: KoreanHolidayItem[];
  status: KoreanHolidayFetchStatus;
}

interface CachedHolidayYear {
  fetchedAt: number;
  items: KoreanHolidayItem[];
}

const HOLIDAY_CACHE_TTL_MS = 1000 * 60 * 60 * 12;
const holidayYearCache = new Map<string, CachedHolidayYear>();
const holidayYearRequests = new Map<string, Promise<KoreanHolidayItem[]>>();

function readHolidayBaseUrl() {
  return process.env.HOLIDAY_API_BASE_URL?.trim() || "https://holidays.hyunbin.page";
}

function readHolidayFallbackBaseUrl() {
  return (
    process.env.HOLIDAY_API_FALLBACK_BASE_URL?.trim() ||
    "https://date.nager.at/api/v3/PublicHolidays"
  );
}

function buildUrl(baseUrl: string, pathname: string) {
  return new URL(pathname, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
}

function normalizeHolidayDate(input: string | number) {
  const value = String(input).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  if (/^\d{8}$/.test(value)) {
    return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
  }

  return null;
}

function sortHolidayItems(items: KoreanHolidayItem[]) {
  return [...items].sort((left, right) => {
    if (left.dateInput !== right.dateInput) {
      return left.dateInput.localeCompare(right.dateInput, "ko-KR");
    }

    return left.name.localeCompare(right.name, "ko-KR");
  });
}

function dedupeHolidayItems(items: KoreanHolidayItem[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = `${item.dateInput}:${item.name}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function readHostedHolidayItems(
  payload: unknown,
  year: string,
): KoreanHolidayItem[] {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Hosted holiday payload is not a JSON object");
  }

  const items = Object.entries(payload as Record<string, unknown>).flatMap(
    ([dateInput, rawNames]) => {
      const normalizedDate = normalizeHolidayDate(dateInput);

      if (!normalizedDate || !normalizedDate.startsWith(`${year}-`)) {
        return [];
      }

      const names = Array.isArray(rawNames)
        ? rawNames
        : typeof rawNames === "string"
          ? [rawNames]
          : [];

      return names
        .map((name) => (typeof name === "string" ? name.trim() : ""))
        .filter(Boolean)
        .map((name) => ({
          dateInput: normalizedDate,
          name,
        }));
    },
  );

  return sortHolidayItems(dedupeHolidayItems(items));
}

function readFallbackHolidayItems(
  payload: unknown,
  year: string,
): KoreanHolidayItem[] {
  if (!Array.isArray(payload)) {
    throw new Error("Fallback holiday payload is not an array");
  }

  const items = payload.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }

    const holiday = entry as {
      date?: string;
      localName?: string;
      name?: string;
    };
    const normalizedDate = holiday.date
      ? normalizeHolidayDate(holiday.date)
      : null;
    const holidayName = holiday.localName?.trim() || holiday.name?.trim() || "";

    if (!normalizedDate || !normalizedDate.startsWith(`${year}-`) || !holidayName) {
      return [];
    }

    return [
      {
        dateInput: normalizedDate,
        name: holidayName,
      },
    ];
  });

  return sortHolidayItems(dedupeHolidayItems(items));
}

async function fetchHolidayItems(url: URL, parser: (payload: unknown) => KoreanHolidayItem[]) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Holiday request failed with ${response.status}`);
  }

  const payload = (await response.json()) as unknown;
  return parser(payload);
}

async function fetchHolidayYear(year: string) {
  try {
    const hostedItems = await fetchHolidayItems(
      buildUrl(readHolidayBaseUrl(), `${year}.json`),
      (payload) => readHostedHolidayItems(payload, year),
    );

    if (hostedItems.length > 0) {
      return hostedItems;
    }
  } catch (error) {
    console.error("Failed to fetch hosted Korean holiday data", error);
  }

  return fetchHolidayItems(
    buildUrl(readHolidayFallbackBaseUrl(), `${year}/KR`),
    (payload) => readFallbackHolidayItems(payload, year),
  );
}

async function loadHolidayYear(year: string): Promise<{
  items: KoreanHolidayItem[];
  status: KoreanHolidayFetchStatus;
}> {
  const cached = holidayYearCache.get(year);

  if (cached && Date.now() - cached.fetchedAt < HOLIDAY_CACHE_TTL_MS) {
    return {
      items: cached.items,
      status: "cache",
    };
  }

  const pending = holidayYearRequests.get(year);

  if (pending) {
    try {
      return {
        items: await pending,
        status: "api",
      };
    } catch (error) {
      if (cached) {
        return {
          items: cached.items,
          status: "cache",
        };
      }

      console.error("Failed to fetch Korean holidays", error);

      return {
        items: [],
        status: "error",
      };
    }
  }

  const request = fetchHolidayYear(year)
    .then((items) => {
      holidayYearCache.set(year, {
        items,
        fetchedAt: Date.now(),
      });

      return items;
    })
    .finally(() => {
      holidayYearRequests.delete(year);
    });

  holidayYearRequests.set(year, request);

  try {
    return {
      items: await request,
      status: "api",
    };
  } catch (error) {
    console.error("Failed to fetch Korean holidays", error);

    if (cached) {
      return {
        items: cached.items,
        status: "cache",
      };
    }

    return {
      items: [],
      status: "error",
    };
  }
}

function filterHolidayItemsForMonth(items: KoreanHolidayItem[], monthInput: string) {
  return items.filter((item) => item.dateInput.startsWith(`${monthInput}-`));
}

export function getHolidayStatusLabel(status: KoreanHolidayFetchStatus) {
  switch (status) {
    case "api":
      return "공휴일 공개 API 연동";
    case "cache":
      return "공휴일 캐시 사용";
    case "error":
      return "공휴일 API 오류";
  }
}

export async function getKoreanHolidaysForMonth(
  monthInput: string,
): Promise<KoreanHolidayMonthResult> {
  const monthDate = parseKstDateInput(`${monthInput}-01`, "start");
  const year = String(monthDate.getUTCFullYear());
  const { items, status } = await loadHolidayYear(year);

  return {
    monthInput,
    items: filterHolidayItemsForMonth(items, monthInput),
    status,
  };
}
