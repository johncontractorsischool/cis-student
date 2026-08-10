import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { ApiError } from "@/lib/api/errors";
import { routeError } from "@/lib/api/route-error";
import { authenticatedRequest } from "@/lib/auth/request";
import { verifyReadingAccess } from "@/lib/reading/access";
import {
  normalizeReadingCourse,
  type RawReadingPayload,
} from "@/lib/reading/normalize";
import type { ReadingLanguage } from "@/lib/reading/types";

const progressSchema = z.object({
  contentIds: z.array(z.union([z.string(), z.number()])).min(1).max(100),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ classId: string }> },
) {
  try {
    const { classId } = await context.params;
    const language: ReadingLanguage =
      request.nextUrl.searchParams.get("l") === "es" ? "es" : "en";
    const input = progressSchema.parse(await request.json());
    const requestedIds = [...new Set(input.contentIds.map(String))];

    const access = await verifyReadingAccess(classId, language);
    const rawCourse = await authenticatedRequest<RawReadingPayload>(
      `/reading_courses_with_detail/${encodeURIComponent(classId)}`,
    );
    const course = normalizeReadingCourse(rawCourse, access);
    const allowedIds = new Set(
      course.chapters.flatMap((chapter) => chapter.topics.map((topic) => topic.id)),
    );

    if (requestedIds.some((id) => !allowedIds.has(id))) {
      throw new ApiError("One or more reading sections do not belong to this course.", 403);
    }

    await Promise.all(
      requestedIds.map((id) =>
        authenticatedRequest(`/save_read_reading_course/${encodeURIComponent(id)}`),
      ),
    );
    return NextResponse.json({ data: { completedIds: requestedIds } });
  } catch (error) {
    return routeError(error);
  }
}
