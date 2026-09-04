import { expect, test, type Page } from "@playwright/test";

import {
  accountFor,
  expectedHosts,
  requireAccounts,
  signIn,
  signInSuccessfully,
} from "./support/live-config";

type DashboardEnvelope = {
  data?: {
    deviceStatus?: string;
    iApplication?: {
      actionCenter?: unknown;
      availability?: string;
      overview?: unknown;
    } | null;
    renewal?: { buttons?: Array<{ label?: string; url?: string }> };
    user?: { demo_account?: unknown; lang?: string };
  };
};

async function dashboardData(page: Page) {
  const response = await page.request.get("/api/dashboard");
  expect(response.status()).toBe(200);
  const payload = await response.json() as DashboardEnvelope;
  expect(payload.data).toBeTruthy();
  return payload.data!;
}

test.describe("@staging staging account matrix", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(() => {
    requireAccounts([
      "active",
      "expired",
      "inactive",
      "demoEnglish",
      "demoSpanish",
      "deviceUnregistered",
      "deviceLimit",
      "iApplication",
      "iApplicationPartialOutage",
    ]);
  });

  test("active student reaches every core learning destination", async ({ page }) => {
    await signInSuccessfully(page, accountFor("active"));
    const dashboard = await dashboardData(page);
    expect(dashboard.user?.demo_account).not.toBeTruthy();
    expect(dashboard.deviceStatus).toBe("verified");

    for (const path of ["/dashboard", "/practice", "/courses/video", "/courses/reading", "/courses/audio", "/live", "/resources"]) {
      const response = await page.goto(path);
      expect(response?.status(), `${path} should load`).toBeLessThan(400);
      await expect(page).not.toHaveURL(/\/login$/);
      await expect(page.getByText("Page not found")).toHaveCount(0);
    }
  });

  test("expired student receives only backend-authored renewal destinations", async ({ page }) => {
    await signInSuccessfully(page, accountFor("expired"));
    const dashboard = await dashboardData(page);
    const buttons = dashboard.renewal?.buttons || [];
    expect(buttons.length).toBeGreaterThan(0);
    const allowedHosts = expectedHosts("E2E_EXPECTED_RENEWAL_HOSTS");

    for (const button of buttons) {
      const url = new URL(button.url || "");
      expect(url.protocol).toBe("https:");
      expect(allowedHosts).toContain(url.hostname.toLowerCase());
    }

    await page.goto("/dashboard");
    const primary = buttons[0]!;
    await expect(page.getByRole("link", { name: primary.label || "" })).toHaveAttribute("href", primary.url || "");
  });

  test("inactive or disabled student is denied without leaving the sign-in page", async ({ page }) => {
    const response = await signIn(page, accountFor("inactive"));
    expect(response.status()).toBe(403);
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("alert")).toBeVisible();
  });

  for (const [role, language, heading] of [
    ["demoEnglish", "en", "Study"],
    ["demoSpanish", "es", "Estudiar"],
  ] as const) {
    test(`${language.toUpperCase()} demo uses its language and bypasses the device gate`, async ({ page }) => {
      await signInSuccessfully(page, accountFor(role));
      const dashboard = await dashboardData(page);
      expect(dashboard.user?.demo_account).toBeTruthy();
      expect(dashboard.user?.lang).toBe(language);
      await page.goto("/dashboard");
      await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
      await expect(page.getByText("Personal device access")).toHaveCount(0);
    });
  }

  test("unregistered browser receives the registration gate", async ({ page }) => {
    await signInSuccessfully(page, accountFor("deviceUnregistered"));
    const dashboard = await dashboardData(page);
    expect(dashboard.deviceStatus).toBe("register");
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Register this browser" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Register browser" })).toBeVisible();
  });

  test("three-device account is blocked without a registration action", async ({ page }) => {
    await signInSuccessfully(page, accountFor("deviceLimit"));
    const dashboard = await dashboardData(page);
    expect(dashboard.deviceStatus).toBe("limit_reached");
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Device limit reached" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Register browser" })).toHaveCount(0);
  });

  test("iApplication-enabled account loads both dashboard feeds", async ({ page }) => {
    await signInSuccessfully(page, accountFor("iApplication"));
    const iApplication = (await dashboardData(page)).iApplication;
    expect(iApplication?.availability).toBe("available");
    expect(iApplication?.overview).toBeTruthy();
    expect(iApplication?.actionCenter).toBeTruthy();
  });

  test("partial iApplication outage preserves the surviving feed", async ({ page }) => {
    await signInSuccessfully(page, accountFor("iApplicationPartialOutage"));
    const iApplication = (await dashboardData(page)).iApplication;
    expect(iApplication?.availability).toBe("available");
    const loadedFeeds = [iApplication?.overview, iApplication?.actionCenter].filter(Boolean);
    expect(loadedFeeds).toHaveLength(1);
    await page.goto("/dashboard");
    await expect(page.getByRole("region", { name: "iApplication status" })).toBeVisible();
  });
});
