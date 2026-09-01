import "server-only";

import { cookies } from "next/headers";

import { backendRequest } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { RefreshData } from "@/lib/api/types";

const TOKEN_COOKIE = "cis_session";
const EXPIRY_COOKIE = "cis_session_expires_at";
const FIRST_LOGIN_COOKIE = "cis_first_login_setup";
const FIRST_LOGIN_PASSWORD_COOKIE = "cis_first_login_password_done";
const REFRESH_SKEW_MS = 30_000;

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

function expiryTimestamp(expiresIn: number | string): number {
  const seconds = Number(expiresIn);
  return Date.now() + (Number.isFinite(seconds) ? seconds : 0) * 1000;
}

export async function setSession(
  token: string,
  expiresIn: number | string,
): Promise<void> {
  const store = await cookies();
  const options = cookieOptions();
  store.set(TOKEN_COOKIE, token, options);
  store.set(EXPIRY_COOKIE, String(expiryTimestamp(expiresIn)), options);
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.set(TOKEN_COOKIE, "", { ...cookieOptions(), maxAge: 0 });
  store.set(EXPIRY_COOKIE, "", { ...cookieOptions(), maxAge: 0 });
  store.set(FIRST_LOGIN_COOKIE, "", { ...cookieOptions(), maxAge: 0 });
  store.set(FIRST_LOGIN_PASSWORD_COOKIE, "", { ...cookieOptions(), maxAge: 0 });
}

export async function startFirstLoginSetup(): Promise<void> {
  const store = await cookies();
  store.set(FIRST_LOGIN_COOKIE, "1", cookieOptions());
  store.set(FIRST_LOGIN_PASSWORD_COOKIE, "", { ...cookieOptions(), maxAge: 0 });
}

export async function markFirstLoginPasswordComplete(): Promise<void> {
  (await cookies()).set(FIRST_LOGIN_PASSWORD_COOKIE, "1", cookieOptions());
}

export async function finishFirstLoginSetup(): Promise<void> {
  const store = await cookies();
  store.set(FIRST_LOGIN_COOKIE, "", { ...cookieOptions(), maxAge: 0 });
  store.set(FIRST_LOGIN_PASSWORD_COOKIE, "", { ...cookieOptions(), maxAge: 0 });
}

export async function hasPendingFirstLoginSetup(): Promise<boolean> {
  return (await cookies()).get(FIRST_LOGIN_COOKIE)?.value === "1";
}

export async function hasCompletedFirstLoginPassword(): Promise<boolean> {
  return (await cookies()).get(FIRST_LOGIN_PASSWORD_COOKIE)?.value === "1";
}

export async function hasSession(): Promise<boolean> {
  return Boolean((await cookies()).get(TOKEN_COOKIE)?.value);
}

async function refreshSession(token: string, persistRefresh: boolean): Promise<string> {
  const params = new URLSearchParams({ token });
  const refreshed = await backendRequest<RefreshData>(
    `/auth/refresh?${params.toString()}`,
  );

  if (!refreshed.token) {
    throw new ApiError("Your session has expired. Please sign in again.", 401);
  }

  if (persistRefresh) await setSession(refreshed.token, refreshed.expires_in);
  return refreshed.token;
}

export async function getValidSessionToken(
  forceRefresh = false,
  persistRefresh = true,
): Promise<string> {
  const store = await cookies();
  const token = store.get(TOKEN_COOKIE)?.value;
  const expiresAt = Number(store.get(EXPIRY_COOKIE)?.value || 0);

  if (!token) {
    throw new ApiError("Your session has expired. Please sign in again.", 401);
  }

  if (!forceRefresh && expiresAt > Date.now() + REFRESH_SKEW_MS) {
    return token;
  }

  try {
    return await refreshSession(token, persistRefresh);
  } catch (error) {
    if (persistRefresh) await clearSession();
    throw error;
  }
}
