import { NextResponse } from "next/server";

import { routeError } from "@/lib/api/route-error";
import type { User } from "@/lib/api/types";
import { accountProfileFromUser } from "@/lib/account/presentation";
import { authenticatedRequest } from "@/lib/auth/request";
import { accountProfileSchema } from "@/lib/auth/schemas";

export async function PATCH(request: Request) {
  try {
    const profile = accountProfileSchema.parse(await request.json());
    const user = await authenticatedRequest<User>("/account/update-profile", {
      method: "POST",
      body: profile,
    });
    return NextResponse.json({ data: accountProfileFromUser(user) });
  } catch (error) {
    return routeError(error);
  }
}
