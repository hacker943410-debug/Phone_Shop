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

test("manual schedules can be created, edited, and deleted from the schedule page", async ({
  page,
}) => {
  const createdTitle = "E2E 수동 일정 등록";
  const updatedTitle = "E2E 수동 일정 완료";

  await login(page, "admin", "admin1234!");
  await page.goto("/schedule");

  await page.getByRole("button", { name: "2026-04-23 일정 추가" }).click();
  await expect(page.getByRole("dialog", { name: "일정 등록" })).toBeVisible();

  await page.getByLabel("제목").fill(createdTitle);
  await page.getByLabel("고객").click();
  await page.getByRole("option", { name: /김서현/ }).click();
  await page.getByLabel("메모").fill("E2E 후속 연락 테스트");
  await page.getByRole("button", { name: "일정 저장" }).click();

  await expect(page.getByRole("dialog", { name: "일정 등록" })).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: `${createdTitle} 일정 수정` }).first(),
  ).toBeVisible();

  await page.getByRole("button", { name: `${createdTitle} 일정 수정` }).first().click();
  await expect(page.getByRole("dialog", { name: "일정 수정" })).toBeVisible();

  await page.getByLabel("제목").fill(updatedTitle);
  await page.getByLabel("상태").click();
  await page.getByRole("option", { name: "완료" }).click();
  await page.getByRole("button", { name: "일정 저장" }).click();

  await expect(page.getByRole("dialog", { name: "일정 수정" })).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: `${updatedTitle} 일정 수정` }).first(),
  ).toBeVisible();

  await page.getByRole("button", { name: `${updatedTitle} 일정 수정` }).first().click();
  await expect(page.getByRole("dialog", { name: "일정 수정" })).toBeVisible();
  await page.getByRole("button", { name: "삭제" }).click();

  await expect(page.getByRole("dialog", { name: "일정 수정" })).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: `${updatedTitle} 일정 수정` }),
  ).toHaveCount(0);
});
