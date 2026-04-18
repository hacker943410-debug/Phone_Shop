import {
  buildSalesHref,
  buildSalesQueryString,
  type SalesUrlFilters,
} from "@/lib/sales-url-state";

const filters: SalesUrlFilters = {
  q: "",
  carrierId: "",
  storeId: "store-main",
  status: "all",
  dateFrom: "2026-04-01",
  dateTo: "2026-04-12",
};

describe("sales-url-state", () => {
  it("preserves date and store drill-down filters in the query string", () => {
    expect(buildSalesQueryString(filters)).toBe(
      "storeId=store-main&dateFrom=2026-04-01&dateTo=2026-04-12",
    );
  });

  it("applies overrides without dropping the existing drill-down context", () => {
    expect(
      buildSalesHref(filters, {
        page: 3,
        q: "  김영희  ",
        status: "COMPLETED",
      }),
    ).toBe(
      "/sales?q=%EA%B9%80%EC%98%81%ED%9D%AC&storeId=store-main&status=COMPLETED&dateFrom=2026-04-01&dateTo=2026-04-12&page=3",
    );
  });
});
