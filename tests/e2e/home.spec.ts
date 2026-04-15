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
  await expect(
    page.getByRole("heading", {
      name: "매출 흐름과 후속 관리 숫자를 한 화면에서 확인합니다",
    }),
  ).toBeVisible();

  const sidebar = page.getByRole("navigation", { name: "워크스페이스 사이드바" });
  const sidebarLinks = sidebar.locator("ul > li > a");

  await expect(
    sidebar.getByRole("link", { name: "판매 등록" }),
  ).toHaveAttribute("href", "/sales/new");
  await expect(
    sidebar.getByRole("link", { name: "재고 입고" }),
  ).toHaveAttribute("href", "/inventory");
  await expect(sidebarLinks).toHaveCount(7);
  await expect(sidebarLinks.nth(0)).toHaveAttribute("href", "/");
  await expect(sidebarLinks.nth(1)).toHaveAttribute("href", "/sales");
  await expect(sidebarLinks.nth(2)).toHaveAttribute("href", "/receivables");
  await expect(sidebarLinks.nth(3)).toHaveAttribute("href", "/customers");
  await expect(sidebarLinks.nth(4)).toHaveAttribute("href", "/inventory");
  await expect(sidebarLinks.nth(5)).toHaveAttribute("href", "/settings/base");
  await expect(sidebarLinks.nth(6)).toHaveAttribute("href", "/settings/policies");
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

  await datePickers.nth(1).click();
  await page.locator('button[aria-label="2026-04-11"]').click();
  await expect(page).toHaveURL(/preset=custom/);
  await expect(page.getByText("2026-04-11 ~ 2026-04-11").first()).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.locator('a[href^="/api/reports/summary?"]').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain("phoneshop-summary-");

  await page.getByRole("link", { name: "인쇄용 보고서" }).click();
  await expect(page).toHaveURL(/\/reports\/summary/);
  await expect(
    page.getByRole("heading", { name: "PhoneShop 기간 운영 보고서" }),
  ).toBeVisible();
  await expect(page.getByText("일자별 요약")).toBeVisible();
  await expect(page.getByText("최근 판매 상세")).toBeVisible();
  await expect(page.locator("table").first()).toBeVisible();

  await page.goto("/settings/base");
  await expect(page.getByText("5GX").first()).toBeVisible();
  await expect(page.getByText("KT").first()).toBeVisible();

  await page.goto("/settings/policies");
  await expect(page.getByText("KT iPhone 16").first()).toBeVisible();

  await page.goto("/inventory");
  await expect(
    page.getByText("357000001245871", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("359300001245118", { exact: true })).toBeVisible();

  await page.goto("/customers");
  await expect(page.getByRole("heading", { name: "고객 목록" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "고객 상세" })).toBeVisible();

  await page.goto("/sales");
  const salesHistoryTable = page.getByRole("table");
  await expect(
    page.getByRole("button", { name: "판매 등록 화면 열기" }).first(),
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
    page.locator('a[href*="receivableId="]').first(),
  ).toBeVisible();
});

test("staff accounts cannot access admin-only settings", async ({ page }) => {
  await login(page, "jihu_kim", "staff1234!");

  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("heading", {
      name: "매출 흐름과 후속 관리 숫자를 한 화면에서 확인합니다",
    }),
  ).toBeVisible();
  await expect(page.locator('a[href="/settings/base"]')).toHaveCount(0);

  await page.goto("/settings/base");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText("오늘 판매 건수")).toBeVisible();

  await page.goto("/customers");
  await expect(page.getByRole("heading", { name: "고객 목록" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "고객 상세" })).toBeVisible();
});
