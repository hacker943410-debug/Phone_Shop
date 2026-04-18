export interface SalesUrlFilters {
  q: string;
  carrierId: string;
  storeId: string;
  status: string;
  dateFrom: string;
  dateTo: string;
}

export interface SalesUrlOverrides extends Partial<SalesUrlFilters> {
  page?: number;
}

function resolveSalesUrlFilters(
  filters: SalesUrlFilters,
  overrides: SalesUrlOverrides,
): SalesUrlFilters {
  return {
    q: overrides.q ?? filters.q,
    carrierId: overrides.carrierId ?? filters.carrierId,
    storeId: overrides.storeId ?? filters.storeId,
    status: overrides.status ?? filters.status,
    dateFrom: overrides.dateFrom ?? filters.dateFrom,
    dateTo: overrides.dateTo ?? filters.dateTo,
  };
}

export function appendSalesFilterParams(
  searchParams: URLSearchParams,
  filters: SalesUrlFilters,
) {
  const normalizedQuery = filters.q.trim();

  if (normalizedQuery) {
    searchParams.set("q", normalizedQuery);
  }

  if (filters.carrierId) {
    searchParams.set("carrierId", filters.carrierId);
  }

  if (filters.storeId) {
    searchParams.set("storeId", filters.storeId);
  }

  if (filters.status && filters.status !== "all") {
    searchParams.set("status", filters.status);
  }

  if (filters.dateFrom) {
    searchParams.set("dateFrom", filters.dateFrom);
  }

  if (filters.dateTo) {
    searchParams.set("dateTo", filters.dateTo);
  }
}

export function buildSalesQueryString(
  filters: SalesUrlFilters,
  overrides: SalesUrlOverrides = {},
) {
  const searchParams = new URLSearchParams();
  const resolvedFilters = resolveSalesUrlFilters(filters, overrides);

  appendSalesFilterParams(searchParams, resolvedFilters);

  if (overrides.page && overrides.page > 1) {
    searchParams.set("page", String(overrides.page));
  }

  return searchParams.toString();
}

export function buildSalesHref(
  filters: SalesUrlFilters,
  overrides: SalesUrlOverrides = {},
) {
  const query = buildSalesQueryString(filters, overrides);
  return query ? `/sales?${query}` : "/sales";
}
