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

test("first-login agreement, prescreen, password, and profile complete before dashboard access", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email address").fill("firstlogin@example.com");
  await page.locator("#login-password").fill("password1");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/first-login$/);
  await page.goto("/resources");
  await expect(page).toHaveURL(/\/first-login$/);
  await page.getByLabel("I accept the terms and conditions.").check();
  await page.getByRole("button", { name: "Accept and continue" }).click();
  await expect(page.getByRole("heading", { name: "Do you already hold a California contractor license?" })).toBeVisible();
  await page.getByRole("button", { name: "Yes" }).click();
  await expect(page.getByRole("heading", { name: "Change your temporary password" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Change your temporary password" })).toBeVisible();
  await page.getByLabel("Current password").fill("password1");
  await page.getByLabel("New password", { exact: true }).fill("newpass1");
  await page.getByLabel("Confirm new password").fill("newpass1");
  await page.getByRole("button", { name: "Update password" }).click();
  await expect(page.getByRole("heading", { name: "Confirm your student profile" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Confirm your student profile" })).toBeVisible();
  await page.getByRole("button", { name: "Save and continue" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("student can manage profile, language, password, and exam history", async ({ context, page }) => {
  await addSession(context);
  await page.goto("/account");
  await expect(page.getByRole("heading", { name: "My Account" })).toBeVisible();

  await page.getByLabel("City").fill("Oakland");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByText("Profile updated.")).toBeVisible();

  await page.getByRole("button", { name: "Español" }).click();
  await expect(page.getByText("Language preference updated.")).toBeVisible();

  await page.getByLabel("Current password").fill("password1");
  await page.getByLabel("New password", { exact: true }).fill("newpass1");
  await page.getByLabel("Confirm new password").fill("newpass1");
  await page.getByRole("button", { name: "Update password" }).click();
  await expect(page.getByText("Password updated.")).toBeVisible();

  page.on("dialog", (dialog) => void dialog.accept());
  await page.getByRole("button", { name: "Reset exams" }).click();
  await expect(page.getByText("Completed exams were reset.")).toBeVisible();
});

test("eligible app-created student can delete their account", async ({ context, page }) => {
  await addSession(context, "fixture-delete");
  await page.goto("/account");
  await expect(page.getByRole("heading", { name: "Delete account" })).toBeVisible();
  await page.getByLabel("Type DELETE to confirm").fill("DELETE");
  page.on("dialog", (dialog) => void dialog.accept());
  await page.getByRole("button", { name: "Delete account" }).click();
  await expect(page).toHaveURL(/\/login$/);
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
