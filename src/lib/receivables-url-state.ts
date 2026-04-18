export interface ReceivablesUrlFilters {
  q: string;
  customerId: string;
  carrierId: string;
  saleId: string;
  status: string;
}

export interface ReceivablesUrlOverrides
  extends Partial<ReceivablesUrlFilters> {
  page?: number;
}

function resolveReceivablesUrlFilters(
  filters: ReceivablesUrlFilters,
  overrides: ReceivablesUrlOverrides,
): ReceivablesUrlFilters {
  return {
    q: overrides.q ?? filters.q,
    customerId: overrides.customerId ?? filters.customerId,
    carrierId: overrides.carrierId ?? filters.carrierId,
    saleId: overrides.saleId ?? filters.saleId,
    status: overrides.status ?? filters.status,
  };
}

export function appendReceivablesFilterParams(
  searchParams: URLSearchParams,
  filters: ReceivablesUrlFilters,
) {
  const normalizedQuery = filters.q.trim();

  if (normalizedQuery) {
    searchParams.set("q", normalizedQuery);
  }

  if (filters.customerId) {
    searchParams.set("customerId", filters.customerId);
  }

  if (filters.carrierId) {
    searchParams.set("carrierId", filters.carrierId);
  }

  if (filters.saleId) {
    searchParams.set("saleId", filters.saleId);
  }

  if (filters.status && filters.status !== "all") {
    searchParams.set("status", filters.status);
  }
}

export function buildReceivablesQueryString(
  filters: ReceivablesUrlFilters,
  overrides: ReceivablesUrlOverrides = {},
) {
  const searchParams = new URLSearchParams();
  const resolvedFilters = resolveReceivablesUrlFilters(filters, overrides);

  appendReceivablesFilterParams(searchParams, resolvedFilters);

  if (overrides.page && overrides.page > 1) {
    searchParams.set("page", String(overrides.page));
  }

  return searchParams.toString();
}

export function buildReceivablesHref(
  filters: ReceivablesUrlFilters,
  overrides: ReceivablesUrlOverrides = {},
) {
  const query = buildReceivablesQueryString(filters, overrides);
  return query ? `/receivables?${query}` : "/receivables";
}
