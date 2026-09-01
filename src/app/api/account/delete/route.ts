import { NextResponse } from "next/server";

import { ApiError } from "@/lib/api/errors";
import { routeError } from "@/lib/api/route-error";
import type { User } from "@/lib/api/types";
import { canDeleteAccount } from "@/lib/account/presentation";
import { authenticatedRequest } from "@/lib/auth/request";
import { deleteAccountSchema } from "@/lib/auth/schemas";
import { clearSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    deleteAccountSchema.parse(await request.json());
    const user = await authenticatedRequest<User>("/account/me");
    if (!canDeleteAccount(user)) throw new ApiError("This account cannot be deleted online.", 403);
    await authenticatedRequest("/account/delete", { method: "POST" });
    await clearSession();
    return NextResponse.json({ data: { deleted: true } });
  } catch (error) {
    return routeError(error);
  }
}
