import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/dal";
import { buildDashboardPdf } from "@/lib/dashboard-pdf";
import { getDashboardReportData } from "@/lib/dashboard-reporting";

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
    staffId: url.searchParams.get("staffId") ?? undefined,
  });
  const pdfBytes = await buildDashboardPdf(report);
  const filename = `phoneshop-summary-${report.filters.dateFrom}-to-${report.filters.dateTo}.pdf`;

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
