import { NextResponse } from "next/server";

import { backendRequestWithMessage } from "@/lib/api/client";
import { routeError } from "@/lib/api/route-error";
import { forgotPasswordSchema } from "@/lib/auth/schemas";

export async function POST(request: Request) {
  try {
    const input = forgotPasswordSchema.parse(await request.json());
    const result = await backendRequestWithMessage<unknown>("/auth/forgot-password", {
      method: "POST",
      body: input,
      retryTransientOnce: true,
    });
    return NextResponse.json({
      data: { submitted: true },
      message: result.message || "If an account matches that email, password recovery instructions have been sent.",
    });
  } catch (error) {
    return routeError(error);
  }
}
