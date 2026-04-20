import { expect, test, type Page } from "@playwright/test";

async function login(page: Page, username: string, password: string) {
  await page.goto("/login");
  await page.locator('input[name="username"]').fill(username);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
}

test("protected routes redirect to login and admin sees live dashboard plus reports", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/login/);
  await expect(page.locator('input[name="username"]')).toBeVisible();

  await login(page, "admin", "admin1234!");

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "대시보드" })).toBeVisible();

  const sidebar = page.getByRole("navigation", { name: "워크스페이스 사이드바" });
  const sidebarLinks = sidebar.locator("ul > li > a");

  await expect(sidebarLinks).toHaveCount(8);
  await expect(sidebarLinks.nth(0)).toHaveAttribute("href", "/");
  await expect(sidebarLinks.nth(1)).toHaveAttribute("href", "/sales");
  await expect(sidebarLinks.nth(2)).toHaveAttribute("href", "/receivables");
  await expect(sidebarLinks.nth(3)).toHaveAttribute("href", "/customers");
  await expect(sidebarLinks.nth(4)).toHaveAttribute("href", "/schedule");
  await expect(sidebarLinks.nth(5)).toHaveAttribute("href", "/inventory");
  await expect(sidebarLinks.nth(6)).toHaveAttribute("href", "/settings/base");
  await expect(sidebarLinks.nth(7)).toHaveAttribute("href", "/settings/policies");
  await expect(sidebar).not.toContainText("MVP");
  await expect(page.getByText("오늘 판매 건수")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "운영 체크" }),
  ).toBeVisible();

  const datePickers = page.locator('button[aria-haspopup="dialog"]');
  const startDateTrigger = datePickers.nth(0);
  const startDateBox = await startDateTrigger.boundingBox();

  expect(startDateBox).not.toBeNull();
  await page.mouse.click(
    startDateBox!.x + startDateBox!.width - 18,
    startDateBox!.y + startDateBox!.height / 2,
  );
  await page.locator('button[aria-label="2026-04-11"]').click();
  await expect(page).toHaveURL(/preset=custom/);
  await expect(page).toHaveURL(/dateFrom=2026-04-11/);

  const downloadPromise = page.waitForEvent("download");
  await page.locator('a[href^="/api/reports/summary?"]').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain("phoneshop-summary-");

  const reportLink = page.getByRole("link", { name: "인쇄용 보고서" });
  await expect(reportLink).toHaveAttribute("href", /\/reports\/summary\?/);
  const reportHref = await reportLink.getAttribute("href");

  expect(reportHref).not.toBeNull();
  await page.goto(reportHref!);
  await expect(page).toHaveURL(/\/reports\/summary/);
  await expect(
    page.getByRole("heading", { name: "기간 보고서" }),
  ).toBeVisible();
  await expect(page.getByText("일자별 요약")).toBeVisible();
  await expect(page.getByText("최근 판매 상세")).toBeVisible();
  await expect(page.locator("table").first()).toBeVisible();

  await page.goto("/settings/base");
  await expect(page.getByRole("heading", { name: "기초정보" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "매장 관리" })).toBeVisible();

  await page.goto("/settings/policies");
  await expect(page.getByRole("heading", { name: "정책 관리" })).toBeVisible();
  await expect(page.getByRole("button", { name: "개통 가능 규칙" })).toBeVisible();

  await page.goto("/schedule");
  await expect(page.getByRole("heading", { name: "일정 관리" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "월간 캘린더" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "다가오는 일정" })).toBeVisible();

  await page.goto("/inventory");
  await expect(
    page.getByText("357000001245871", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("359300001245118", { exact: true })).toBeVisible();

  await page.goto("/customers");
  await expect(page.getByRole("heading", { name: "고객 관리" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "고객 목록" })).toBeVisible();
  await page.locator('a[aria-label$="고객 상세"]').first().click();
  await expect(page.getByRole("dialog")).toContainText("기본 정보");
  await page.getByRole("button", { name: "모달 닫기" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await page.goto("/sales");
  const salesHistoryTable = page.getByRole("table");
  await expect(
    page.getByRole("button", { name: "판매 등록" }).first(),
  ).toBeVisible();
  await expect(salesHistoryTable).toContainText("Galaxy S25");
  await expect(salesHistoryTable).toContainText("iPhone 16");

  await page.getByLabel("판매 검색어").fill("357000001245871");

  await expect(page).toHaveURL(/\/sales\?q=357000001245871/);
  await expect(salesHistoryTable).toContainText("Galaxy S25");
  await expect(salesHistoryTable).not.toContainText("iPhone 16");
  await page.locator('button[aria-label^="상세 보기"]').first().click();
  await expect(page.getByRole("dialog")).toContainText("357000001245871");
  await page.locator('button[aria-label="상세 모달 닫기"]').click();

  await page.goto("/receivables");
  await expect(
    page.getByRole("button", { name: /수납 등록$/ }).first(),
  ).toBeVisible();
});

test("staff accounts cannot access admin-only settings", async ({ page }) => {
  await login(page, "jihu_kim", "staff1234!");

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "대시보드" })).toBeVisible();
  await expect(page.locator('a[href="/settings/base"]')).toHaveCount(0);

  await page.goto("/settings/base");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText("오늘 판매 건수")).toBeVisible();

  await page.goto("/customers");
  await expect(page.getByRole("heading", { name: "고객 관리" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "고객 목록" })).toBeVisible();
});
