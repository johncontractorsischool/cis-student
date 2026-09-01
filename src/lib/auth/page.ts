import "server-only";

import { redirect } from "next/navigation";

import { ApiError } from "@/lib/api/errors";
import type { User } from "@/lib/api/types";
import { authenticatedRequest } from "@/lib/auth/request";
import { entryPathForUser, entryStageForUser, type EntryStage } from "@/lib/auth/entry";
import { hasPendingFirstLoginSetup, hasSession } from "@/lib/auth/session";

export async function requireCurrentUser(): Promise<User> {
  const user = await currentUserForPage();
  if (!user) redirect("/login");
  return user;
}

export async function currentUserForPage(): Promise<User | null> {
  if (!(await hasSession())) return null;
  try {
    return await authenticatedRequest<User>("/account/me", { persistSessionRefresh: false });
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) return null;
    throw error;
  }
}

export async function entryStageForSession(user: User): Promise<EntryStage> {
  return entryStageForUser(user, await hasPendingFirstLoginSetup());
}

export async function entryPathForSession(user: User): Promise<"/dashboard" | "/first-login"> {
  return entryPathForUser(user, await hasPendingFirstLoginSetup());
}

export async function requirePortalUser(): Promise<User> {
  const user = await requireCurrentUser();
  if ((await entryPathForSession(user)) === "/first-login") redirect("/first-login");
  return user;
}
