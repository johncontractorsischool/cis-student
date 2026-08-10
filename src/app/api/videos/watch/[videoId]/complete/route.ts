import { NextResponse } from "next/server";

import { ApiError } from "@/lib/api/errors";
import { routeError } from "@/lib/api/route-error";
import { authenticatedRequest } from "@/lib/auth/request";
import { verifyStudyCourseAccess } from "@/lib/study/courses";
import type { RawVideoDetailPayload } from "@/lib/study/normalize";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  context: { params: Promise<{ videoId: string }> },
) {
  try {
    const { videoId } = await context.params;
    const detail = await authenticatedRequest<RawVideoDetailPayload>(`/video_courses_detail/${encodeURIComponent(videoId)}`);
    const classId = detail.video?.clas_id;
    const code = detail.video?.code;
    if (classId == null || code == null) throw new ApiError("Video details are unavailable.", 404);
    await verifyStudyCourseAccess("video", String(classId), "en");
    await authenticatedRequest(`/save_watch_video/${encodeURIComponent(String(code))}`);
    return NextResponse.json({ data: { complete: true } });
  } catch (error) {
    return routeError(error);
  }
}
