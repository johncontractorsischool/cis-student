import { NextResponse } from "next/server";

import { ApiError } from "@/lib/api/errors";
import { routeError } from "@/lib/api/route-error";
import { authenticatedRequest } from "@/lib/auth/request";
import { verifyStudyCourseAccess } from "@/lib/study/courses";
import { normalizeAudioCourse, type RawMediaCoursePayload } from "@/lib/study/normalize";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  context: { params: Promise<{ audioId: string; classId: string }> },
) {
  try {
    const { audioId, classId } = await context.params;
    const access = await verifyStudyCourseAccess("audio", classId, "en");
    const payload = await authenticatedRequest<RawMediaCoursePayload>(`/audio_courses_batch/${encodeURIComponent(classId)}`);
    const course = normalizeAudioCourse(payload, access);
    const allowed = course.sections.some((section) => section.lessons.some((lesson) => lesson.id === audioId));
    if (!allowed) throw new ApiError("Audio lesson not found in this course.", 404);
    await authenticatedRequest(`/save_watch_audio/${encodeURIComponent(audioId)}`);
    return NextResponse.json({ data: { complete: true } });
  } catch (error) {
    return routeError(error);
  }
}
