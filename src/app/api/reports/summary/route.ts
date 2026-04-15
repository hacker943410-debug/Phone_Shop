import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/dal";
import {
  buildDashboardCsv,
  getDashboardReportData,
} from "@/lib/dashboard-reporting";

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const url = new URL(request.url);
  const report = await getDashboardReportData({
    preset: url.searchParams.get("preset") ?? undefined,
    dateFrom: url.searchParams.get("dateFrom") ?? undefined,
    dateTo: url.searchParams.get("dateTo") ?? undefined,
    storeId: url.searchParams.get("storeId") ?? undefined,
  });
  const csv = buildDashboardCsv(report);
  const filename = `phoneshop-summary-${report.filters.dateFrom}-to-${report.filters.dateTo}.csv`;

  return new NextResponse(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
