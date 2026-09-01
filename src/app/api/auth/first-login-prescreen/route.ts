import { NextResponse } from "next/server";

import type { User } from "@/lib/api/types";
import { routeError } from "@/lib/api/route-error";
import { entryPathForUser } from "@/lib/auth/entry";
import { authenticatedRequest } from "@/lib/auth/request";
import { firstLoginPrescreenSchema } from "@/lib/auth/schemas";

export async function POST(request: Request) {
  try {
    const input = firstLoginPrescreenSchema.parse(await request.json());
    await authenticatedRequest("/account/first-login-prescreen", {
      method: "POST",
      body: { has_license: input.hasLicense ? "yes" : "no" },
    });
    const user = await authenticatedRequest<User>("/account/me");
    return NextResponse.json({ data: { nextPath: entryPathForUser(user) } });
  } catch (error) {
    return routeError(error);
  }
}
