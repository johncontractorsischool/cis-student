import { NextResponse } from "next/server";

import { backendRequest } from "@/lib/api/client";
import { routeError } from "@/lib/api/route-error";
import type { LoginData } from "@/lib/api/types";
import { loginSchema } from "@/lib/auth/schemas";
import { entryPathForUser, hasPendingFirstLoginFlag } from "@/lib/auth/entry";
import { finishFirstLoginSetup, setSession, startFirstLoginSetup } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const credentials = loginSchema.parse(await request.json());
    const login = await backendRequest<LoginData>("/auth/login", {
      method: "POST",
      body: credentials,
      retryTransientOnce: true,
    });

    await setSession(login.token, login.expires_in);
    if (hasPendingFirstLoginFlag(login.user)) await startFirstLoginSetup();
    else await finishFirstLoginSetup();
    return NextResponse.json({ data: { nextPath: entryPathForUser(login.user) } });
  } catch (error) {
    return routeError(error);
  }
}
