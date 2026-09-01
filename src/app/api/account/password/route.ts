import { NextResponse } from "next/server";

import { routeError } from "@/lib/api/route-error";
import { authenticatedRequest } from "@/lib/auth/request";
import { changePasswordSchema } from "@/lib/auth/schemas";

export async function POST(request: Request) {
  try {
    const password = changePasswordSchema.parse(await request.json());
    await authenticatedRequest("/account/change-password", {
      method: "POST",
      body: {
        old_password: password.currentPassword,
        password: password.newPassword,
        confirm_password: password.confirmPassword,
      },
    });
    return NextResponse.json({ data: { updated: true } });
  } catch (error) {
    return routeError(error);
  }
}
