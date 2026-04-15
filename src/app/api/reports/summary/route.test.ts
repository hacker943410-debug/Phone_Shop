import { afterEach, describe, expect, it, vi } from "vitest";

const getCurrentUser = vi.fn();
const getDashboardReportData = vi.fn();
const buildDashboardCsv = vi.fn();

vi.mock("@/lib/auth/dal", () => ({
  getCurrentUser,
}));

vi.mock("@/lib/dashboard-reporting", () => ({
  getDashboardReportData,
  buildDashboardCsv,
}));

describe("GET /api/reports/summary", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("redirects unauthenticated users to login", async () => {
    getCurrentUser.mockResolvedValueOnce(null);

    const { GET } = await import("@/app/api/reports/summary/route");
    const response = await GET(
      new Request("http://localhost:3000/api/reports/summary?preset=today"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/login");
  });

  it("returns a utf-8 csv attachment for authenticated users", async () => {
    getCurrentUser.mockResolvedValueOnce({
      id: "user-admin",
      username: "admin",
      displayName: "관리자",
      role: "ADMIN",
      isActive: true,
    });
    getDashboardReportData.mockResolvedValueOnce({
      filters: {
        preset: "custom",
        dateFrom: "2026-04-01",
        dateTo: "2026-04-12",
      },
    });
    buildDashboardCsv.mockReturnValueOnce("col1,col2\r\n1,2");

    const { GET } = await import("@/app/api/reports/summary/route");
    const response = await GET(
      new Request(
        "http://localhost:3000/api/reports/summary?dateFrom=2026-04-01&dateTo=2026-04-12",
      ),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/csv");
    expect(response.headers.get("content-disposition")).toContain(
      'phoneshop-summary-2026-04-01-to-2026-04-12.csv',
    );
    const bytes = new Uint8Array(await response.arrayBuffer());
    expect(Array.from(bytes.slice(0, 3))).toEqual([239, 187, 191]);
    expect(new TextDecoder("utf-8").decode(bytes)).toContain("col1,col2\r\n1,2");
    expect(getDashboardReportData).toHaveBeenCalledWith({
      preset: undefined,
      dateFrom: "2026-04-01",
      dateTo: "2026-04-12",
      storeId: undefined,
    });
  });
});
