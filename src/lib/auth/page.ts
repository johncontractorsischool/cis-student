import "server-only";

import { redirect } from "next/navigation";

import { ApiError } from "@/lib/api/errors";
import type { User } from "@/lib/api/types";
import { authenticatedRequest } from "@/lib/auth/request";
import { hasSession } from "@/lib/auth/session";

export async function requireCurrentUser(): Promise<User> {
  if (!(await hasSession())) redirect("/login");
  try {
    return await authenticatedRequest<User>("/account/me");
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) redirect("/login");
    throw error;
  }
}
