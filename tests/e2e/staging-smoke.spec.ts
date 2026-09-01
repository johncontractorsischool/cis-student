import { expect, test } from "@playwright/test";

test("@staging existing student can reach core MVP routes", async ({ page }) => {
  const email = process.env.E2E_STAGING_EMAIL;
  const password = process.env.E2E_STAGING_PASSWORD;
  test.skip(!process.env.E2E_BASE_URL || !email || !password, "Staging URL and credentials are required.");

  await page.goto("/login");
  await page.getByLabel("Email address").fill(email!);
  await page.locator("#login-password").fill(password!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/(dashboard|first-login)$/);
  if (page.url().endsWith("/first-login")) test.skip(true, "Use a staging account that has completed first-login acceptance.");

  for (const path of ["/dashboard", "/practice", "/courses/video", "/courses/reading", "/courses/audio", "/live", "/resources"]) {
    await page.goto(path);
    await expect(page).not.toHaveURL(/\/login$/);
    await expect(page.getByText("Page not found")).toHaveCount(0);
  }
});
