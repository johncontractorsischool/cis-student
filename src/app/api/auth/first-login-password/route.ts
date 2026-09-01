import { NextResponse } from "next/server";

import { routeError } from "@/lib/api/route-error";
import type { User } from "@/lib/api/types";
import { hasPendingFirstLoginFlag } from "@/lib/auth/entry";
import { authenticatedRequest } from "@/lib/auth/request";
import { changePasswordSchema } from "@/lib/auth/schemas";
import { hasPendingFirstLoginSetup, markFirstLoginPasswordComplete, startFirstLoginSetup } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    if (!(await hasPendingFirstLoginSetup())) {
      const user = await authenticatedRequest<User>("/account/me");
      if (hasPendingFirstLoginFlag(user)) await startFirstLoginSetup();
      else return NextResponse.json({ data: { nextPath: "/dashboard" } });
    }
    const password = changePasswordSchema.parse(await request.json());
    await authenticatedRequest("/account/change-password", {
      method: "POST",
      body: {
        old_password: password.currentPassword,
        password: password.newPassword,
        confirm_password: password.confirmPassword,
      },
    });
    await markFirstLoginPasswordComplete();
    return NextResponse.json({ data: { nextStep: "profile" } });
  } catch (error) {
    return routeError(error);
  }
}
