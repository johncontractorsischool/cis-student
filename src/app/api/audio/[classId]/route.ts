import { NextResponse, type NextRequest } from "next/server";

import { routeError } from "@/lib/api/route-error";
import { authenticatedRequest } from "@/lib/auth/request";
import { verifyStudyCourseAccess } from "@/lib/study/courses";
import { normalizeAudioCourse, type RawMediaCoursePayload } from "@/lib/study/normalize";
import type { StudyLanguage } from "@/lib/study/types";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ classId: string }> },
) {
  try {
    const { classId } = await context.params;
    const language: StudyLanguage = request.nextUrl.searchParams.get("l") === "es" ? "es" : "en";
    const access = await verifyStudyCourseAccess("audio", classId, language);
    const payload = await authenticatedRequest<RawMediaCoursePayload>(`/audio_courses_batch/${encodeURIComponent(classId)}`);
    return NextResponse.json({ data: normalizeAudioCourse(payload, access) });
  } catch (error) {
    return routeError(error);
  }
}
