export type CustomerReceivableFilter = "all" | "outstanding" | "clear";

export type CustomerModalView = "detail" | "sales" | "receivables";

export interface CustomersBaseFilters {
  q: string;
  carrierId: string;
  receivable: CustomerReceivableFilter;
}

interface CustomersHrefOptions {
  customerId?: string | null;
  page?: number;
  returnTo?: string | null;
  view?: CustomerModalView | "";
}

export function isCustomerModalView(value: string): value is CustomerModalView {
  return value === "detail" || value === "sales" || value === "receivables";
}

export function buildCustomersQueryString(
  filters: CustomersBaseFilters,
  options?: CustomersHrefOptions,
) {
  const searchParams = new URLSearchParams();

  if (filters.q) {
    searchParams.set("q", filters.q);
  }

  if (filters.carrierId) {
    searchParams.set("carrierId", filters.carrierId);
  }

  if (filters.receivable !== "all") {
    searchParams.set("receivable", filters.receivable);
  }

  if (options?.page && options.page > 1) {
    searchParams.set("page", String(options.page));
  }

  if (options?.customerId) {
    searchParams.set("customerId", options.customerId);
  }

  if (options?.view) {
    searchParams.set("view", options.view);
  }

  if (options?.returnTo) {
    searchParams.set("returnTo", options.returnTo);
  }

  return searchParams.toString();
}

export function buildCustomersHref(
  filters: CustomersBaseFilters,
  options?: CustomersHrefOptions,
) {
  const query = buildCustomersQueryString(filters, options);
  return query ? `/customers?${query}` : "/customers";
}
