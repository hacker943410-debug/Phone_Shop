import { expect, test, type Page } from "@playwright/test";

async function login(page: Page, username: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("아이디").fill(username);
  await page.getByLabel("비밀번호").fill(password);

  await Promise.all([
    page.waitForURL((url) => url.pathname !== "/login"),
    page.getByRole("button", { name: "로그인" }).click(),
  ]);
}

async function expectBackdropToCoverViewport(page: Page) {
  const metrics = await page
    .locator(".dashboard-dialog-backdrop")
    .last()
    .evaluate((element) => {
      const rect = element.getBoundingClientRect();

      return {
        height: rect.height,
        left: rect.left,
        top: rect.top,
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth,
        width: rect.width,
      };
    });

  const edgeTolerance = 16;

  expect(metrics.left).toBeLessThanOrEqual(edgeTolerance);
  expect(metrics.top).toBeLessThanOrEqual(edgeTolerance);
  expect(metrics.width).toBeGreaterThanOrEqual(
    metrics.viewportWidth - edgeTolerance,
  );
  expect(metrics.height).toBeGreaterThanOrEqual(
    metrics.viewportHeight - edgeTolerance,
  );
}

async function expectBodyScrollLocked(page: Page) {
  await expect
    .poll(async () =>
      page.evaluate(() => getComputedStyle(document.body).overflow),
    )
    .toBe("hidden");
}

async function expectBodyScrollUnlocked(page: Page) {
  await expect
    .poll(async () =>
      page.evaluate(() => getComputedStyle(document.body).overflow),
    )
    .not.toBe("hidden");
}

test("workspace modals lock scroll, trap focus, and restore focus", async ({
  page,
}) => {
  await login(page, "admin", "admin1234!");

  await page.goto("/sales");

  const salesLaunchButton = page.getByRole("button", { name: "판매 등록" });
  await salesLaunchButton.focus();
  await expect(salesLaunchButton).toBeFocused();
  await salesLaunchButton.click();

  const salesLaunchDialog = page.getByRole("dialog", { name: "판매 등록 시작" });
  const salesLaunchCloseButton = page.getByRole("button", { name: "모달 닫기" });
  const newCustomerButton = page.getByRole("button", { name: "신규 고객" });

  await expect(salesLaunchDialog).toBeVisible();
  await expectBackdropToCoverViewport(page);
  await expectBodyScrollLocked(page);
  await expect(salesLaunchCloseButton).toBeFocused();

  await page.keyboard.press("Shift+Tab");
  await expect(newCustomerButton).toBeFocused();

  await page.keyboard.press("Tab");
  await expect(salesLaunchCloseButton).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(salesLaunchDialog).toBeHidden();
  await expectBodyScrollUnlocked(page);
  await expect(salesLaunchButton).toBeFocused();

  await page.goto("/receivables");

  const registerPaymentButton = page.getByRole("button", {
    name: "정하은 수납 등록",
  });
  await registerPaymentButton.focus();
  await expect(registerPaymentButton).toBeFocused();
  await registerPaymentButton.click();

  const registerPaymentDialog = page.getByRole("dialog", { name: "정하은 수납 등록" });
  const registerPaymentCloseButton = page.getByRole("button", { name: "모달 닫기" });

  await expect(registerPaymentDialog).toBeVisible();
  await expectBackdropToCoverViewport(page);
  await expectBodyScrollLocked(page);
  await expect(registerPaymentCloseButton).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(registerPaymentDialog).toBeHidden();
  await expectBodyScrollUnlocked(page);
  await expect(registerPaymentButton).toBeFocused();
});

test("custom dialogs also render against the viewport and return focus", async ({
  page,
}) => {
  await login(page, "admin", "admin1234!");

  await page.goto("/");

  const dashboardExpandButton = page.getByRole("button", { name: "전체 보기" }).first();
  await dashboardExpandButton.focus();
  await expect(dashboardExpandButton).toBeFocused();
  await dashboardExpandButton.click();

  const dashboardDialog = page.getByRole("dialog", { name: "미수금 잔액 상세" });
  const dashboardCloseButton = page.getByRole("button", { name: "모달 닫기" });

  await expect(dashboardDialog).toBeVisible();
  await expectBackdropToCoverViewport(page);
  await expectBodyScrollLocked(page);
  await expect(dashboardCloseButton).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(dashboardDialog).toBeHidden();
  await expectBodyScrollUnlocked(page);
  await expect(dashboardExpandButton).toBeFocused();

  await page.goto("/sales");

  const saleDetailButton = page.getByRole("button", { name: "상세 보기 이재민" });
  await saleDetailButton.focus();
  await expect(saleDetailButton).toBeFocused();
  await saleDetailButton.click();

  const saleDetailDialog = page.getByRole("dialog", { name: "이재민 판매 상세" });
  const saleDetailCloseButton = page.getByRole("button", { name: "상세 모달 닫기" });
  const saleCancelTabButton = page.getByRole("button", { name: "취소 처리" });

  await expect(saleDetailDialog).toBeVisible();
  await expectBackdropToCoverViewport(page);
  await expectBodyScrollLocked(page);
  await expect(saleDetailCloseButton).toBeFocused();

  await page.keyboard.press("Shift+Tab");
  await expect(saleCancelTabButton).toBeFocused();

  await page.keyboard.press("Tab");
  await expect(saleDetailCloseButton).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(saleDetailDialog).toBeHidden();
  await expectBodyScrollUnlocked(page);
  await expect(saleDetailButton).toBeFocused();
});
