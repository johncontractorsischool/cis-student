import { NextResponse } from "next/server";

import { routeError } from "@/lib/api/route-error";
import type { User } from "@/lib/api/types";
import { authenticatedRequest } from "@/lib/auth/request";
import { accountProfileSchema } from "@/lib/auth/schemas";
import {
  finishFirstLoginSetup,
  hasCompletedFirstLoginPassword,
  hasPendingFirstLoginSetup,
} from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    if (!(await hasPendingFirstLoginSetup())) {
      return NextResponse.json({ data: { nextPath: "/dashboard" } });
    }
    if (!(await hasCompletedFirstLoginPassword())) {
      return NextResponse.json(
        { error: { message: "Change your temporary password before completing setup." } },
        { status: 409 },
      );
    }
    const profile = accountProfileSchema.parse(await request.json());
    await authenticatedRequest<User>("/account/update-profile", {
      method: "POST",
      body: profile,
    });
    await finishFirstLoginSetup();
    return NextResponse.json({ data: { nextPath: "/dashboard" } });
  } catch (error) {
    return routeError(error);
  }
}
