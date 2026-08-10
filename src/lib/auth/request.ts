import "server-only";

import { backendRequest } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { clearSession, getValidSessionToken } from "@/lib/auth/session";

type AuthenticatedOptions = Omit<RequestInit, "body"> & { body?: unknown };

export async function authenticatedRequest<T>(
  path: string,
  options: AuthenticatedOptions = {},
): Promise<T> {
  const token = await getValidSessionToken();

  try {
    return await backendRequest<T>(path, { ...options, token });
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) {
      throw error;
    }

    try {
      const refreshedToken = await getValidSessionToken(true);
      return await backendRequest<T>(path, { ...options, token: refreshedToken });
    } catch (refreshError) {
      await clearSession();
      throw refreshError;
    }
  }
}
