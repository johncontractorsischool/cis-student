import { NextResponse, type NextRequest } from "next/server";

import { ApiError } from "@/lib/api/errors";
import { routeError } from "@/lib/api/route-error";
import type { User } from "@/lib/api/types";
import { authenticatedRequest } from "@/lib/auth/request";
import {
  normalizeLiveClassCatalogue,
  normalizeLiveClassDetail,
  type RawLiveClassDetailPayload,
  type RawLiveClassesPayload,
} from "@/lib/live/normalize";
import type { StudyLanguage } from "@/lib/study/types";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ videoId: string }> },
) {
  try {
    const { videoId } = await context.params;
    const language: StudyLanguage = request.nextUrl.searchParams.get("l") === "es" ? "es" : "en";
    const user = await authenticatedRequest<User>("/account/me");
    const [classes, detail] = await Promise.all([
      authenticatedRequest<RawLiveClassesPayload>("/live_classes_test"),
      authenticatedRequest<RawLiveClassDetailPayload>(
        `/live_class_video_detail/${encodeURIComponent(videoId)}`,
      ),
    ]);
    const visible = normalizeLiveClassCatalogue(classes, user, 0, {}, language);
    const mayView = visible.sections.some((section) =>
      section.sessions.some((session) => session.id === videoId && session.status !== "live"),
    );
    if (!mayView) throw new ApiError("Live Class recording not found.", 404);
    return NextResponse.json({ data: normalizeLiveClassDetail(detail, language) });
  } catch (error) {
    return routeError(error);
  }
}
