import type { Page, Response } from "@playwright/test";
import { z } from "zod";

const accountSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

const accountsSchema = z.object({
  active: accountSchema.optional(),
  contractFormsEligible: accountSchema.optional(),
  contractFormsIneligible: accountSchema.optional(),
  demoEnglish: accountSchema.optional(),
  demoSpanish: accountSchema.optional(),
  deviceLimit: accountSchema.optional(),
  deviceUnregistered: accountSchema.optional(),
  expired: accountSchema.optional(),
  iApplication: accountSchema.optional(),
  iApplicationPartialOutage: accountSchema.optional(),
  inactive: accountSchema.optional(),
});

export type LiveAccount = z.infer<typeof accountSchema>;
export type LiveAccountRole = keyof z.infer<typeof accountsSchema>;

let parsedAccounts: z.infer<typeof accountsSchema> | null = null;

function accounts(): z.infer<typeof accountsSchema> {
  if (parsedAccounts) return parsedAccounts;
  const source = process.env.E2E_ACCOUNTS_JSON;
  if (!source) throw new Error("E2E_ACCOUNTS_JSON is required for deployed-environment tests.");
  try {
    parsedAccounts = accountsSchema.parse(JSON.parse(source));
    return parsedAccounts;
  } catch {
    throw new Error("E2E_ACCOUNTS_JSON is invalid. Check its role names and credential fields.");
  }
}

export function accountFor(role: LiveAccountRole): LiveAccount {
  const account = accounts()[role];
  if (!account) throw new Error(`E2E_ACCOUNTS_JSON is missing the ${role} account.`);
  return account;
}

export function requireAccounts(roles: LiveAccountRole[]): void {
  roles.forEach(accountFor);
}

export function expectedHosts(variable: "E2E_EXPECTED_RENEWAL_HOSTS" | "E2E_EXPECTED_SHOPIFY_HOST"): string[] {
  const value = process.env[variable]?.trim();
  if (!value) throw new Error(`${variable} is required for deployed-environment tests.`);
  const hosts = value.split(",").map((host) => host.trim().toLowerCase()).filter(Boolean);
  if (!hosts.length || hosts.some((host) => host.includes("://") || host.includes("/"))) {
    throw new Error(`${variable} must contain comma-separated hostnames without protocols or paths.`);
  }
  return hosts;
}

export function deployedOrigin(): string {
  const value = process.env.E2E_BASE_URL;
  if (!value) throw new Error("E2E_BASE_URL is required for deployed-environment tests.");
  const url = new URL(value);
  if (process.env.E2E_TARGET === "production" && url.protocol !== "https:") {
    throw new Error("Production smoke tests require an HTTPS E2E_BASE_URL.");
  }
  return url.origin;
}

export async function signIn(page: Page, account: LiveAccount): Promise<Response> {
  await page.goto("/login");
  const responsePromise = page.waitForResponse((response) =>
    response.url().includes("/api/auth/login") && response.request().method() === "POST",
  );
  await page.getByLabel("Email address").fill(account.email);
  await page.locator("#login-password").fill(account.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  return responsePromise;
}

export async function signInSuccessfully(page: Page, account: LiveAccount): Promise<void> {
  const response = await signIn(page, account);
  if (!response.ok()) throw new Error(`The configured account could not sign in (${response.status()}).`);
  await page.waitForURL(/\/(dashboard|first-login)$/);
  if (page.url().endsWith("/first-login")) {
    throw new Error("The configured account still requires first-login setup.");
  }
}
