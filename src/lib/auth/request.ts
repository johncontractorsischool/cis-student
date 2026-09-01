import "server-only";

import { backendRequest } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { clearSession, getValidSessionToken } from "@/lib/auth/session";

type AuthenticatedOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  persistSessionRefresh?: boolean;
};

export async function authenticatedRequest<T>(
  path: string,
  options: AuthenticatedOptions = {},
): Promise<T> {
  const { persistSessionRefresh = true, ...requestOptions } = options;
  const token = await getValidSessionToken(false, persistSessionRefresh);

  try {
    return await backendRequest<T>(path, { ...requestOptions, token });
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) {
      throw error;
    }

    try {
      const refreshedToken = await getValidSessionToken(true, persistSessionRefresh);
      return await backendRequest<T>(path, { ...requestOptions, token: refreshedToken });
    } catch (refreshError) {
      if (persistSessionRefresh) await clearSession();
      throw refreshError;
    }
  }
}
