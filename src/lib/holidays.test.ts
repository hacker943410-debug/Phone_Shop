import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function createJsonResponse(payload: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  } as Response;
}

describe("holiday helpers", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("fetch", vi.fn());
    vi.spyOn(console, "error").mockImplementation(() => {});
    delete process.env.HOLIDAY_API_BASE_URL;
    delete process.env.HOLIDAY_API_FALLBACK_BASE_URL;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    delete process.env.HOLIDAY_API_BASE_URL;
    delete process.env.HOLIDAY_API_FALLBACK_BASE_URL;
  });

  it("reads Korean holidays from the hosted no-key JSON source", async () => {
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockResolvedValueOnce(
      createJsonResponse({
        "2026-04-05": ["식목일"],
        "2026-04-08": ["석가탄신일"],
      }),
    );

    const { getKoreanHolidaysForMonth } = await import("@/lib/holidays");
    const result = await getKoreanHolidaysForMonth("2026-04");

    expect(result.status).toBe("api");
    expect(result.items).toEqual([
      { dateInput: "2026-04-05", name: "식목일" },
      { dateInput: "2026-04-08", name: "석가탄신일" },
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBeInstanceOf(URL);
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      "https://holidays.hyunbin.page/2026.json",
    );
  });

  it("falls back to Nager.Date when the hosted JSON request fails", async () => {
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockRejectedValueOnce(new Error("primary source unavailable"));
    fetchMock.mockResolvedValueOnce(
      createJsonResponse([
        {
          date: "2026-05-05",
          localName: "어린이날",
          name: "Children's Day",
        },
      ]),
    );

    const { getKoreanHolidaysForMonth } = await import("@/lib/holidays");
    const result = await getKoreanHolidaysForMonth("2026-05");

    expect(result.status).toBe("api");
    expect(result.items).toEqual([
      { dateInput: "2026-05-05", name: "어린이날" },
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      "https://holidays.hyunbin.page/2026.json",
    );
    expect(String(fetchMock.mock.calls[1]?.[0])).toBe(
      "https://date.nager.at/api/v3/PublicHolidays/2026/KR",
    );
  });

  it("reuses cached year data for later month requests", async () => {
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockResolvedValueOnce(
      createJsonResponse({
        "2026-04-05": ["식목일"],
        "2026-05-05": ["어린이날"],
      }),
    );

    const { getKoreanHolidaysForMonth } = await import("@/lib/holidays");
    const april = await getKoreanHolidaysForMonth("2026-04");
    const may = await getKoreanHolidaysForMonth("2026-05");

    expect(april.status).toBe("api");
    expect(may.status).toBe("cache");
    expect(may.items).toEqual([{ dateInput: "2026-05-05", name: "어린이날" }]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns an error state when both public sources fail and no cache exists", async () => {
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockRejectedValueOnce(new Error("primary source unavailable"));
    fetchMock.mockRejectedValueOnce(new Error("fallback source unavailable"));

    const { getKoreanHolidaysForMonth } = await import("@/lib/holidays");
    const result = await getKoreanHolidaysForMonth("2026-06");

    expect(result.status).toBe("error");
    expect(result.items).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("returns error states for concurrent same-year requests when both sources fail", async () => {
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockRejectedValueOnce(new Error("primary source unavailable"));
    fetchMock.mockRejectedValueOnce(new Error("fallback source unavailable"));

    const { getKoreanHolidaysForMonth } = await import("@/lib/holidays");
    const [april, may] = await Promise.all([
      getKoreanHolidaysForMonth("2026-04"),
      getKoreanHolidaysForMonth("2026-05"),
    ]);

    expect(april.status).toBe("error");
    expect(may.status).toBe("error");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
