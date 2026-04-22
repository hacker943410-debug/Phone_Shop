import { afterEach, describe, expect, it, vi } from "vitest";

const getCurrentUser = vi.fn();
const getDashboardReportData = vi.fn();
const buildDashboardPdf = vi.fn();

vi.mock("@/lib/auth/dal", () => ({
  getCurrentUser,
}));

vi.mock("@/lib/dashboard-reporting", () => ({
  getDashboardReportData,
}));

vi.mock("@/lib/dashboard-pdf", () => ({
  buildDashboardPdf,
}));

describe("GET /api/reports/summary/pdf", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("redirects unauthenticated users to login", async () => {
    getCurrentUser.mockResolvedValueOnce(null);

    const { GET } = await import("@/app/api/reports/summary/pdf/route");
    const response = await GET(
      new Request("http://localhost:3000/api/reports/summary/pdf?preset=today"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/login");
  });

  it("returns a pdf attachment for authenticated users", async () => {
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
        storeId: "",
        staffId: "",
      },
    });
    buildDashboardPdf.mockResolvedValueOnce(Uint8Array.from([37, 80, 68, 70]));

    const { GET } = await import("@/app/api/reports/summary/pdf/route");
    const response = await GET(
      new Request(
        "http://localhost:3000/api/reports/summary/pdf?dateFrom=2026-04-01&dateTo=2026-04-12",
      ),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/pdf");
    expect(response.headers.get("content-disposition")).toContain(
      'phoneshop-summary-2026-04-01-to-2026-04-12.pdf',
    );
    expect(getDashboardReportData).toHaveBeenCalledWith({
      preset: undefined,
      dateFrom: "2026-04-01",
      dateTo: "2026-04-12",
      storeId: undefined,
      staffId: undefined,
    });
  });
});
