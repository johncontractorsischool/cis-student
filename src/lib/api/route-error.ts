import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { ApiError, publicErrorMessage } from "@/lib/api/errors";

export function routeError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: { message: error.issues[0]?.message || "Check the form and try again." } },
      { status: 422 },
    );
  }

  const status = error instanceof ApiError ? error.status : 500;
  return NextResponse.json(
    {
      error: {
        message: publicErrorMessage(error),
        details: error instanceof ApiError ? error.details : undefined,
      },
    },
    { status },
  );
}
