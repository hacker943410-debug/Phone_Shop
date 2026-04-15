export interface PaginationState {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export function readPageNumber(value: string | string[] | undefined) {
  const rawValue = Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
  const parsed = Number.parseInt(rawValue, 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export function createPagination(
  requestedPage: number,
  totalCount: number,
  pageSize: number,
): PaginationState {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return {
    page: Math.min(requestedPage, totalPages),
    pageSize,
    totalCount,
    totalPages,
  };
}

export function getPaginationRange(pagination: PaginationState) {
  if (pagination.totalCount === 0) {
    return {
      start: 0,
      end: 0,
    };
  }

  const start = (pagination.page - 1) * pagination.pageSize + 1;
  const end = Math.min(
    pagination.totalCount,
    pagination.page * pagination.pageSize,
  );

  return { start, end };
}
