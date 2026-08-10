import { type NextRequest, NextResponse } from "next/server";

import { backendRequest } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { routeError } from "@/lib/api/route-error";
import type { User } from "@/lib/api/types";
import { persistDeviceId, resolveDeviceId } from "@/lib/auth/device";
import { authenticatedRequest } from "@/lib/auth/request";
import { clearSession } from "@/lib/auth/session";
import type { DashboardPayload } from "@/lib/dashboard/types";
import { loadIApplicationDashboard } from "@/lib/iapplication/dashboard";
import type { IApplicationChecklistCollection } from "@/lib/iapplication/types";

export const dynamic = "force-dynamic";

async function optional<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const deviceId = resolveDeviceId(request);
    const user = await authenticatedRequest<User>("/account/me");

    const [
      app,
      upgrades,
      deviceStatus,
      liveClassStatus,
      studyProgress,
      practice,
      renewal,
      iApplication,
      iApplicationChecklists,
    ] =
      await Promise.all([
        optional(backendRequest<Record<string, unknown>>("/app")),
        optional(authenticatedRequest<Record<string, unknown>>("/upgrade-demo-text")),
        optional(
          authenticatedRequest<Record<string, unknown>>(
            `/device/status/${encodeURIComponent(deviceId)}`,
          ),
        ),
        optional(authenticatedRequest<unknown>("/live_class_status")),
        optional(
          authenticatedRequest<DashboardPayload["studyProgress"]>("/study_progress"),
        ),
        optional(
          authenticatedRequest<Record<string, unknown>>("/practice_test_classes/opt"),
        ),
        optional(
          authenticatedRequest<Record<string, unknown>>("/renewal-checkout-ctas"),
        ),
        loadIApplicationDashboard(user.customerid),
        optional(
          authenticatedRequest<IApplicationChecklistCollection>(
            "/iapplication/application-checklists",
          ),
        ),
      ]);

    const response = NextResponse.json({
      data: {
        app,
        deviceId,
        deviceStatus,
        iApplication,
        iApplicationChecklists,
        liveClassStatus,
        practice,
        renewal,
        studyProgress,
        upgrades,
        user,
      } satisfies DashboardPayload,
    });
    persistDeviceId(response, deviceId);
    return response;
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      await clearSession();
    }
    return routeError(error);
  }
}
