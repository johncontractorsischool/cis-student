import { NextResponse, type NextRequest } from "next/server";

import { ApiError } from "@/lib/api/errors";
import { routeError } from "@/lib/api/route-error";
import { getStudyCourseCatalogue } from "@/lib/study/courses";
import type { CourseMedium, StudyLanguage } from "@/lib/study/types";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ type: string }> },
) {
  try {
    const { type } = await context.params;
    if (type !== "video" && type !== "audio") {
      throw new ApiError("Unsupported course type.", 404);
    }
    const language: StudyLanguage = request.nextUrl.searchParams.get("l") === "es" ? "es" : "en";
    const data = await getStudyCourseCatalogue(type as CourseMedium, language);
    return NextResponse.json({ data });
  } catch (error) {
    return routeError(error);
  }
}
