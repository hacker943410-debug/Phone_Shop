import { readFile } from "node:fs/promises";

import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib";

import type { DashboardReportData } from "@/lib/dashboard-reporting-types";
import { formatWon } from "@/lib/formatters";

const pageSize = {
  width: 842,
  height: 595,
};

const margin = 34;

async function loadKoreanFont(pdfDoc: PDFDocument) {
  pdfDoc.registerFontkit(fontkit);

  try {
    const fontBytes = await readFile("C:\\Windows\\Fonts\\malgun.ttf");
    const boldFontBytes = await readFile("C:\\Windows\\Fonts\\malgunbd.ttf");

    const regular = await pdfDoc.embedFont(fontBytes, { subset: true });
    const bold = await pdfDoc.embedFont(boldFontBytes, { subset: true });

    return { regular, bold };
  } catch {
    const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    return { regular, bold };
  }
}

function fitText(font: PDFFont, text: string, size: number, maxWidth: number) {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) {
    return text;
  }

  let value = text;

  while (value.length > 1 && font.widthOfTextAtSize(`${value}…`, size) > maxWidth) {
    value = value.slice(0, -1);
  }

  return `${value}…`;
}

function drawTextLine(input: {
  page: PDFPage;
  font: PDFFont;
  text: string;
  x: number;
  y: number;
  size: number;
  color?: ReturnType<typeof rgb>;
  maxWidth?: number;
}) {
  input.page.drawText(
    input.maxWidth
      ? fitText(input.font, input.text, input.size, input.maxWidth)
      : input.text,
    {
      x: input.x,
      y: input.y,
      size: input.size,
      font: input.font,
      color: input.color ?? rgb(0.12, 0.16, 0.24),
    },
  );
}

function drawMetricCard(input: {
  page: PDFPage;
  title: string;
  value: string;
  helper: string;
  x: number;
  y: number;
  width: number;
  regularFont: PDFFont;
  boldFont: PDFFont;
}) {
  input.page.drawRectangle({
    x: input.x,
    y: input.y - 72,
    width: input.width,
    height: 72,
    color: rgb(0.985, 0.988, 0.995),
    borderColor: rgb(0.86, 0.89, 0.94),
    borderWidth: 1,
  });

  drawTextLine({
    page: input.page,
    font: input.regularFont,
    text: input.title,
    x: input.x + 12,
    y: input.y - 18,
    size: 9,
    color: rgb(0.35, 0.39, 0.47),
    maxWidth: input.width - 24,
  });
  drawTextLine({
    page: input.page,
    font: input.boldFont,
    text: input.value,
    x: input.x + 12,
    y: input.y - 40,
    size: 16,
    color: rgb(0.08, 0.11, 0.16),
    maxWidth: input.width - 24,
  });
  drawTextLine({
    page: input.page,
    font: input.regularFont,
    text: input.helper,
    x: input.x + 12,
    y: input.y - 58,
    size: 8,
    color: rgb(0.45, 0.47, 0.54),
    maxWidth: input.width - 24,
  });
}

function drawTable(input: {
  page: PDFPage;
  title: string;
  columns: Array<{ label: string; width: number; align?: "left" | "right" }>;
  rows: string[][];
  x: number;
  y: number;
  width: number;
  regularFont: PDFFont;
  boldFont: PDFFont;
  maxRows: number;
}) {
  drawTextLine({
    page: input.page,
    font: input.boldFont,
    text: input.title,
    x: input.x,
    y: input.y,
    size: 12,
  });

  const headerY = input.y - 20;
  const rowHeight = 22;
  const visibleRows = input.rows.slice(0, input.maxRows);

  input.page.drawRectangle({
    x: input.x,
    y: headerY - rowHeight,
    width: input.width,
    height: rowHeight,
    color: rgb(0.965, 0.97, 0.98),
    borderColor: rgb(0.86, 0.89, 0.94),
    borderWidth: 1,
  });

  let currentX = input.x;

  input.columns.forEach((column) => {
    drawTextLine({
      page: input.page,
      font: input.boldFont,
      text: column.label,
      x: currentX + 8,
      y: headerY - 14,
      size: 8,
      color: rgb(0.32, 0.36, 0.43),
      maxWidth: column.width - 16,
    });
    currentX += column.width;
  });

  visibleRows.forEach((row, rowIndex) => {
    const top = headerY - rowHeight * (rowIndex + 1);
    const fillColor = rowIndex % 2 === 0 ? rgb(1, 1, 1) : rgb(0.985, 0.988, 0.995);

    input.page.drawRectangle({
      x: input.x,
      y: top - rowHeight,
      width: input.width,
      height: rowHeight,
      color: fillColor,
      borderColor: rgb(0.9, 0.92, 0.95),
      borderWidth: 1,
    });

    let cellX = input.x;

    row.forEach((cell, cellIndex) => {
      const column = input.columns[cellIndex];

      if (!column) {
        cellX += 0;
        return;
      }

      const textWidth = input.regularFont.widthOfTextAtSize(cell, 8.5);
      const drawX =
        column.align === "right"
          ? cellX + column.width - Math.min(textWidth, column.width - 16) - 8
          : cellX + 8;

      drawTextLine({
        page: input.page,
        font: input.regularFont,
        text: cell,
        x: drawX,
        y: top - 14,
        size: 8.5,
        color: rgb(0.14, 0.18, 0.25),
        maxWidth: column.width - 16,
      });

      cellX += column.width;
    });
  });
}

export async function buildDashboardPdf(report: DashboardReportData) {
  const pdfDoc = await PDFDocument.create();
  const fonts = await loadKoreanFont(pdfDoc);
  const page = pdfDoc.addPage([pageSize.width, pageSize.height]);
  const selectedStoreLabel =
    report.availableStores.find((store) => store.id === report.filters.storeId)?.name ??
    "전체 매장";
  const selectedStaffLabel =
    report.availableStaffs.find((staff) => staff.id === report.filters.staffId)?.name ??
    "전체 직원";

  page.drawRectangle({
    x: 0,
    y: 0,
    width: pageSize.width,
    height: pageSize.height,
    color: rgb(0.99, 0.99, 0.995),
  });

  drawTextLine({
    page,
    font: fonts.bold,
    text: "PhoneShop 매장 매출 리포트",
    x: margin,
    y: pageSize.height - 42,
    size: 22,
  });
  drawTextLine({
    page,
    font: fonts.regular,
    text: `${report.periodLabel} / ${selectedStoreLabel} / ${selectedStaffLabel}`,
    x: margin,
    y: pageSize.height - 62,
    size: 10,
    color: rgb(0.35, 0.39, 0.47),
  });
  drawTextLine({
    page,
    font: fonts.regular,
    text: `생성일 ${report.generatedAt}`,
    x: pageSize.width - margin - 120,
    y: pageSize.height - 62,
    size: 10,
    color: rgb(0.35, 0.39, 0.47),
  });

  const cardWidth = (pageSize.width - margin * 2 - 24) / 4;
  const metricY = pageSize.height - 92;

  [
    ["선택 기간 매출", formatWon(report.summary.periodSalesAmount), `판매 ${report.summary.periodSalesCount}건`],
    ["선택 기간 수금", formatWon(report.summary.periodCollectedAmount), `추가 수납 ${formatWon(report.summary.periodAdditionalPaymentAmount)}`],
    ["현재 미수금", formatWon(report.summary.currentReceivableBalance), `미수 ${report.summary.currentReceivableCount}건`],
    ["선택 기간 순이익", formatWon(report.summary.periodProfitAmount), `개통 가능 ${report.summary.activationEligibleCount}건`],
  ].forEach(([title, value, helper], index) => {
    drawMetricCard({
      page,
      title,
      value,
      helper,
      x: margin + index * (cardWidth + 8),
      y: metricY,
      width: cardWidth,
      regularFont: fonts.regular,
      boldFont: fonts.bold,
    });
  });

  drawTable({
    page,
    title: "매장별 매출 실적",
    x: margin,
    y: pageSize.height - 192,
    width: 374,
    regularFont: fonts.regular,
    boldFont: fonts.bold,
    maxRows: 10,
    columns: [
      { label: "매장", width: 122 },
      { label: "판매", width: 48, align: "right" },
      { label: "매출", width: 76, align: "right" },
      { label: "수금", width: 64, align: "right" },
      { label: "이익", width: 64, align: "right" },
    ],
    rows: report.storeSummaries.map((row) => [
      row.storeName,
      `${row.salesCount}건`,
      formatWon(row.salesAmount),
      formatWon(row.collectedAmount),
      formatWon(row.profitAmount),
    ]),
  });

  drawTable({
    page,
    title: "직원별 실적 기여도",
    x: margin + 400,
    y: pageSize.height - 192,
    width: 374,
    regularFont: fonts.regular,
    boldFont: fonts.bold,
    maxRows: 10,
    columns: [
      { label: "직원", width: 122 },
      { label: "판매", width: 48, align: "right" },
      { label: "매출", width: 76, align: "right" },
      { label: "수금", width: 64, align: "right" },
      { label: "이익", width: 64, align: "right" },
    ],
    rows: report.staffSummaries.map((row) => [
      row.staffName,
      `${row.salesCount}건`,
      formatWon(row.salesAmount),
      formatWon(row.collectedAmount),
      formatWon(row.profitAmount),
    ]),
  });

  drawTable({
    page,
    title: "일자별 흐름",
    x: margin,
    y: 176,
    width: pageSize.width - margin * 2,
    regularFont: fonts.regular,
    boldFont: fonts.bold,
    maxRows: 8,
    columns: [
      { label: "일자", width: 86 },
      { label: "판매", width: 56, align: "right" },
      { label: "매출", width: 120, align: "right" },
      { label: "수금", width: 120, align: "right" },
      { label: "리베이트", width: 120, align: "right" },
      { label: "정책 수익", width: 120, align: "right" },
      { label: "순이익", width: 120, align: "right" },
    ],
    rows: report.dailySummaries
      .filter((row) => row.salesCount > 0 || row.collectedAmount > 0)
      .slice(-8)
      .map((row) => [
        row.date,
        `${row.salesCount}건`,
        formatWon(row.salesAmount),
        formatWon(row.collectedAmount),
        formatWon(row.rebateAmount),
        formatWon(row.policyRevenueAmount),
        formatWon(row.profitAmount),
      ]),
  });

  return pdfDoc.save();
}
