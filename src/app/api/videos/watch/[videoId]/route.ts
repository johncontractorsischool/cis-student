import { NextResponse, type NextRequest } from "next/server";

import { ApiError } from "@/lib/api/errors";
import { routeError } from "@/lib/api/route-error";
import { authenticatedRequest } from "@/lib/auth/request";
import { verifyStudyCourseAccess } from "@/lib/study/courses";
import { normalizeVideoDetail, type RawVideoDetailPayload } from "@/lib/study/normalize";
import type { StudyLanguage } from "@/lib/study/types";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ videoId: string }> },
) {
  try {
    const { videoId } = await context.params;
    const language: StudyLanguage = request.nextUrl.searchParams.get("l") === "es" ? "es" : "en";
    const payload = await authenticatedRequest<RawVideoDetailPayload>(`/video_courses_detail/${encodeURIComponent(videoId)}`);
    const rawClassId = payload.video?.clas_id;
    if (rawClassId == null) throw new ApiError("Video details are unavailable.", 404);
    const access = await verifyStudyCourseAccess("video", String(rawClassId), language);
    return NextResponse.json({ data: normalizeVideoDetail(payload, access) });
  } catch (error) {
    return routeError(error);
  }
}
