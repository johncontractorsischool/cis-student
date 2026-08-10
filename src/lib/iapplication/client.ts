import "server-only";

import { backendRequest } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { env } from "@/lib/env";

const REQUEST_TIMEOUT_MS = 8_000;

export async function iApplicationRequest<T>(
  customerId: number | string,
  resource: "overview" | "action-center" | "timeline" | "feedback",
): Promise<T> {
  if (!env.CIS_API_KEY) {
    throw new ApiError("iApplication integration is unavailable.", 503);
  }

  return backendRequest<T>(
    `/ai_forms/customers/${encodeURIComponent(String(customerId))}/${resource}`,
    {
      headers: { "X-CIS-API-Key": env.CIS_API_KEY },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    },
  );
}
