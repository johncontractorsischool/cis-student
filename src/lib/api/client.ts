import "server-only";

import { ApiError } from "@/lib/api/errors";
import type { BackendEnvelope, BackendErrorShape } from "@/lib/api/types";
import { env } from "@/lib/env";

const TRANSIENT_STATUSES = new Set([408, 429, 500, 502, 503, 504]);
const RETRY_DELAY_MS = 600;

type BackendRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  retryTransientOnce?: boolean;
  token?: string;
};

export type BackendResult<T> = {
  data: T;
  message?: string;
};

function makeUrl(path: string): string {
  const normalizedBase = env.API_BASE_URL.replace(/\/$/, "");
  return `${normalizedBase}/${path.replace(/^\//, "")}`;
}

async function parseResponse<T>(response: Response): Promise<BackendResult<T>> {
  let payload: BackendEnvelope<T> | null = null;

  try {
    payload = (await response.json()) as BackendEnvelope<T>;
  } catch {
    // The public error below intentionally avoids including response bodies.
  }

  if (!response.ok) {
    const backendError: BackendErrorShape | undefined = payload?.error;
    throw new ApiError(
      backendError?.message ||
        (response.status === 401
          ? "Your session has expired. Please sign in again."
          : "Something went wrong. Please try again."),
      response.status,
      backendError,
    );
  }

  if (!payload) {
    throw new ApiError("The server returned an invalid response.", 502);
  }

  return {
    data: "data" in payload ? payload.data : (payload as T),
    message: typeof payload.message === "string" ? payload.message : undefined,
  };
}

async function fetchOnce<T>(
  path: string,
  options: BackendRequestOptions,
): Promise<BackendResult<T>> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  let body: BodyInit | undefined;
  if (options.body instanceof FormData) {
    body = options.body;
  } else if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(options.body);
  }

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  let response: Response;
  try {
    response = await fetch(makeUrl(path), {
      ...options,
      body,
      headers,
      cache: options.cache ?? "no-store",
    });
  } catch {
    throw new ApiError("Temporary network issue. Please try again.", 503);
  }

  return parseResponse<T>(response);
}

export async function backendRequest<T>(
  path: string,
  options: BackendRequestOptions = {},
): Promise<T> {
  try {
    return (await fetchOnce<T>(path, options)).data;
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 0;
    if (!options.retryTransientOnce || !TRANSIENT_STATUSES.has(status)) {
      throw error;
    }

    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    return (await fetchOnce<T>(path, { ...options, retryTransientOnce: false })).data;
  }
}

export async function backendRequestWithMessage<T>(
  path: string,
  options: BackendRequestOptions = {},
): Promise<BackendResult<T>> {
  try {
    return await fetchOnce<T>(path, options);
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 0;
    if (!options.retryTransientOnce || !TRANSIENT_STATUSES.has(status)) {
      throw error;
    }

    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    return fetchOnce<T>(path, { ...options, retryTransientOnce: false });
  }
}
