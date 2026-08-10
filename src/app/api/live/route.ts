import { NextResponse, type NextRequest } from "next/server";

import { backendRequest } from "@/lib/api/client";
import { routeError } from "@/lib/api/route-error";
import type { User } from "@/lib/api/types";
import { authenticatedRequest } from "@/lib/auth/request";
import { normalizeLiveClassCatalogue, type RawLiveClassesPayload } from "@/lib/live/normalize";
import type { StudyLanguage } from "@/lib/study/types";

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
    const language: StudyLanguage = request.nextUrl.searchParams.get("l") === "es" ? "es" : "en";
    const user = await authenticatedRequest<User>("/account/me");
    const [classes, status, app] = await Promise.all([
      authenticatedRequest<RawLiveClassesPayload>("/live_classes_test"),
      optional(authenticatedRequest<unknown>("/live_class_status")),
      optional(backendRequest<unknown>("/app")),
    ]);
    return NextResponse.json({
      data: normalizeLiveClassCatalogue(classes, user, status, app, language),
    });
  } catch (error) {
    return routeError(error);
  }
}
