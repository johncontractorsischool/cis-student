import AxeBuilder from "@axe-core/playwright";
import { expect, test, type APIRequestContext, type BrowserContext } from "@playwright/test";

async function resetBackend(request: APIRequestContext) {
  await request.get("http://127.0.0.1:4011/__reset");
}

async function addSession(context: BrowserContext, token = "fixture-active", expired = false) {
  await context.addCookies([
    { name: "cis_session", value: token, domain: "127.0.0.1", path: "/", httpOnly: true, sameSite: "Lax" },
    { name: "cis_session_expires_at", value: String(expired ? Date.now() - 1_000 : Date.now() + 3_600_000), domain: "127.0.0.1", path: "/", httpOnly: true, sameSite: "Lax" },
  ]);
}

test.beforeEach(async ({ request }) => resetBackend(request));

test("existing student can sign in and reach the dashboard", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email address").fill("student@example.com");
  await page.locator("#login-password").fill("password1");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Fixture Student" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Renew access" })).toBeVisible();
});

test("first-login agreement and prescreen complete before dashboard access", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email address").fill("firstlogin@example.com");
  await page.locator("#login-password").fill("password1");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/first-login$/);
  await page.getByLabel("I accept the terms and conditions.").check();
  await page.getByRole("button", { name: "Accept and continue" }).click();
  await expect(page.getByRole("heading", { name: "Is this your first California contractor license?" })).toBeVisible();
  await page.getByRole("button", { name: "Yes" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("password recovery and legal routes are public", async ({ page }) => {
  await page.goto("/forgot-password");
  await page.getByLabel("Email address").fill("student@example.com");
  await page.getByRole("button", { name: "Send recovery email" }).click();
  await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
  await page.goto("/legal/privacy");
  await expect(page.getByRole("heading", { name: "Privacy policy" })).toBeVisible();
});

test("resource states and submissions use the verified browser contract", async ({ context, page }) => {
  await addSession(context);
  await page.goto("/resources");
  await expect(page.getByRole("heading", { name: "Choose a resource collection" })).toBeVisible();
  await expect(page.getByText("Expired Aug 1, 2026")).toBeVisible();
  await expect(page.getByText("Inactive")).toBeVisible();
  await page.getByRole("link", { name: /General Building/ }).click();
  await page.getByRole("link", { name: "Recommend a resource" }).click();
  await page.getByLabel("Resource link").fill("https://example.com/help");
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByRole("heading", { name: "Thank you" })).toBeVisible();
});

test("device registration, device limits, and session refresh are enforced", async ({ context, page }) => {
  await addSession(context, "fixture-register");
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Register this browser" })).toBeVisible();
  await page.getByRole("button", { name: "Register browser" }).click();
  await expect(page.getByRole("heading", { name: "Study" })).toBeVisible();

  await context.clearCookies();
  await addSession(context, "fixture-limit");
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Device limit reached" })).toBeVisible();

  await context.clearCookies();
  await addSession(context, "fixture-active", true);
  await page.goto("/resources");
  await expect(page.getByRole("heading", { name: "Choose a resource collection" })).toBeVisible();
});

test("core learning destinations resolve for an entitled student", async ({ context, page }) => {
  await addSession(context);
  const destinations = [
    ["/practice", "Practice tests"],
    ["/courses/video", "Video courses"],
    ["/courses/reading", "Law and Business"],
    ["/courses/audio", "Audio courses"],
    ["/live", "Live Class"],
  ] as const;
  for (const [path, heading] of destinations) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: heading }).first()).toBeVisible();
  }
});

test("dashboard has no serious accessibility violations", async ({ context, page }) => {
  await addSession(context);
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Fixture Student" })).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter(({ impact }) => impact === "critical" || impact === "serious")).toEqual([]);
});
