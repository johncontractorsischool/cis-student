import type { BackendErrorShape } from "@/lib/api/types";

export class ApiError extends Error {
  readonly status: number;
  readonly code?: number | string;
  readonly details?: Record<string, string[] | string>;

  constructor(
    message: string,
    status = 500,
    error?: BackendErrorShape,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = error?.code;
    this.details = error?.details;
  }
}

export function publicErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return "Something went wrong. Please try again.";
  }

  if (error.status === 422 && error.details) {
    const messages = Object.values(error.details).flatMap((value) => value);
    return messages.filter(Boolean).join(" ") || error.message;
  }

  if (error.status === 408 || error.status === 429 || error.status >= 500) {
    return error.status >= 500
      ? "Server is temporarily unavailable. Please try again."
      : "Temporary network issue. Please try again.";
  }

  return error.message || "Something went wrong. Please try again.";
}
