import { type NextRequest, NextResponse } from "next/server";

import { routeError } from "@/lib/api/route-error";
import { resolveDeviceId, persistDeviceId } from "@/lib/auth/device";
import { authenticatedRequest } from "@/lib/auth/request";
import { normalizeDeviceAccess } from "@/lib/dashboard/presentation";

export async function POST(request: NextRequest) {
  try {
    const deviceId = resolveDeviceId(request);
    const payload = await authenticatedRequest<unknown>("/device/register", {
      method: "POST",
      body: {
        device_type: "Web",
        fingerprint: deviceId,
        user_agent: request.headers.get("user-agent") || "Web browser",
      },
    });
    const response = NextResponse.json({ data: normalizeDeviceAccess(payload) });
    persistDeviceId(response, deviceId);
    return response;
  } catch (error) {
    return routeError(error);
  }
}
