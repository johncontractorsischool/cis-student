import { NextResponse } from "next/server";

import type { User } from "@/lib/api/types";
import { routeError } from "@/lib/api/route-error";
import { entryPathForUser, hasPendingFirstLoginFlag } from "@/lib/auth/entry";
import { authenticatedRequest } from "@/lib/auth/request";
import { firstLoginPrescreenSchema } from "@/lib/auth/schemas";
import {
  hasCompletedFirstLoginPassword,
  hasPendingFirstLoginSetup,
  startFirstLoginSetup,
} from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const input = firstLoginPrescreenSchema.parse(await request.json());
    if (!(await hasPendingFirstLoginSetup())) {
      const initialUser = await authenticatedRequest<User>("/account/me");
      if (hasPendingFirstLoginFlag(initialUser)) await startFirstLoginSetup();
    }
    await authenticatedRequest("/account/first-login-prescreen", {
      method: "POST",
      body: { has_license: input.hasLicense ? "yes" : "no" },
    });
    const user = await authenticatedRequest<User>("/account/me");
    const setupPending = await hasPendingFirstLoginSetup();
    const passwordComplete = await hasCompletedFirstLoginPassword();
    return NextResponse.json({
      data: {
        nextPath: entryPathForUser(user, setupPending),
        nextStep: setupPending ? passwordComplete ? "profile" : "password" : "complete",
      },
    });
  } catch (error) {
    return routeError(error);
  }
}
