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
  await expect(page).toHaveTitle(/PhoneShop/i);
  await expect(
    page.getByRole("heading", {
      name: "오늘 숫자와 기간 보고를 한 화면에서 봅니다.",
    }),
  ).toBeVisible();
  await expect(page.getByText("오늘 판매 건수")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "운영 체크" }),
  ).toBeVisible();
  await expect(page.locator('a[href="/inventory"]')).toBeVisible();
  await expect(page.locator('a[href="/settings/base"]')).toBeVisible();

  await page.locator('input[name="dateFrom"]').fill("2026-04-11");
  await page.locator('input[name="dateTo"]').fill("2026-04-11");
  await page.getByRole("button", { name: "기간 적용" }).click();
  await expect(page).toHaveURL(/preset=custom/);
  await expect(
    page.getByText("기준 기간 2026-04-11 ~ 2026-04-11"),
  ).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "CSV 다운로드" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain("phoneshop-summary-");

  await page.getByRole("link", { name: "인쇄용 보고서" }).click();
  await expect(page).toHaveURL(/\/reports\/summary/);
  await expect(
    page.getByRole("heading", { name: "PhoneShop 기간 운영 보고서" }),
  ).toBeVisible();
  await expect(page.getByText("날짜별 요약")).toBeVisible();
  await expect(page.getByText("최근 판매 상세")).toBeVisible();
  await expect(page.getByText("김서현").first()).toBeVisible();

  await page.goto("/settings/base");
  await expect(page.getByText("5GX").first()).toBeVisible();
  await expect(page.getByText("KT").first()).toBeVisible();

  await page.goto("/settings/policies");
  await expect(page.getByText("KT iPhone 16").first()).toBeVisible();

  await page.goto("/inventory");
  await expect(
    page.getByText("IMEI 357000001245871", { exact: true }),
  ).toBeVisible();

  await page.goto("/customers");
  await expect(page.getByText("김서현").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "고객 상세" })).toBeVisible();

  await page.goto("/sales");
  await expect(
    page.getByRole("button", { name: "판매 등록" }),
  ).toBeVisible();
  await expect(
    page.getByText("IMEI 357000001245871", { exact: true }),
  ).toBeVisible();

  await page.goto("/receivables");
  await expect(
    page.getByRole("button", { name: "수납 등록" }).first(),
  ).toBeVisible();
});

test("staff accounts cannot access admin-only settings", async ({ page }) => {
  await login(page, "jihu_kim", "staff1234!");

  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("heading", {
      name: "오늘 숫자와 기간 보고를 한 화면에서 봅니다.",
    }),
  ).toBeVisible();
  await expect(page.locator('a[href="/settings/base"]')).toHaveCount(0);

  await page.goto("/settings/base");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText("오늘 판매 건수")).toBeVisible();

  await page.goto("/customers");
  await expect(page.getByText("김서현").first()).toBeVisible();
});
