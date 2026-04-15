import {
  createPagination,
  getPaginationRange,
  readPageNumber,
} from "@/lib/pagination";

describe("pagination helpers", () => {
  it("reads only positive page numbers", () => {
    expect(readPageNumber(undefined)).toBe(1);
    expect(readPageNumber("0")).toBe(1);
    expect(readPageNumber("-3")).toBe(1);
    expect(readPageNumber("abc")).toBe(1);
    expect(readPageNumber(["4", "7"])).toBe(4);
  });

  it("clamps the requested page to the last page", () => {
    expect(createPagination(9, 5, 4)).toEqual({
      page: 2,
      pageSize: 4,
      totalCount: 5,
      totalPages: 2,
    });
  });

  it("builds the visible range from pagination state", () => {
    expect(
      getPaginationRange({
        page: 2,
        pageSize: 4,
        totalCount: 9,
        totalPages: 3,
      }),
    ).toEqual({
      start: 5,
      end: 8,
    });

    expect(
      getPaginationRange({
        page: 1,
        pageSize: 4,
        totalCount: 0,
        totalPages: 1,
      }),
    ).toEqual({
      start: 0,
      end: 0,
    });
  });
});
