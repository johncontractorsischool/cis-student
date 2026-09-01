import { type NextRequest, NextResponse } from "next/server";

import type { User } from "@/lib/api/types";
import { routeError } from "@/lib/api/route-error";
import { entryPathForUser } from "@/lib/auth/entry";
import { hasPendingFirstLoginFlag } from "@/lib/auth/entry";
import { resolveDeviceId, persistDeviceId } from "@/lib/auth/device";
import { authenticatedRequest } from "@/lib/auth/request";
import { hasPendingFirstLoginSetup, startFirstLoginSetup } from "@/lib/auth/session";

type PrescreenStatus = { show_modal?: boolean };

export async function POST(request: NextRequest) {
  try {
    const initialUser = await authenticatedRequest<User>("/account/me");
    if (hasPendingFirstLoginFlag(initialUser)) await startFirstLoginSetup();
    const deviceId = resolveDeviceId(request);
    const params = new URLSearchParams({ device_name: "Web browser", platform: "Web" });
    await authenticatedRequest<User>(
      `/account/accept-terms/${encodeURIComponent(deviceId)}?${params.toString()}`,
    );
    const prescreen = await authenticatedRequest<PrescreenStatus>("/account/first-login-prescreen");
    const user = await authenticatedRequest<User>("/account/me");
    const setupPending = await hasPendingFirstLoginSetup();
    const response = NextResponse.json({
      data: {
        nextPath: entryPathForUser(user, setupPending),
        nextStep: prescreen?.show_modal === true ? "prescreen" : setupPending ? "password" : "complete",
        showPrescreen: prescreen?.show_modal === true,
      },
    });
    persistDeviceId(response, deviceId);
    return response;
  } catch (error) {
    return routeError(error);
  }
}
