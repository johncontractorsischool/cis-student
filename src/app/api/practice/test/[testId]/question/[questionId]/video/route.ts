import { NextResponse, type NextRequest } from "next/server";

import { ApiError } from "@/lib/api/errors";
import { routeError } from "@/lib/api/route-error";
import { authenticatedRequest } from "@/lib/auth/request";
import { loadPracticeQuestion } from "@/lib/practice/access";
import {
  normalizePracticeVideoExplanation,
  type RawPracticeVideoPayload,
} from "@/lib/practice/normalize";
import type { StudyLanguage } from "@/lib/study/types";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ questionId: string; testId: string }> },
) {
  try {
    const { questionId, testId } = await context.params;
    const language: StudyLanguage = request.nextUrl.searchParams.get("l") === "es" ? "es" : "en";
    const { question } = await loadPracticeQuestion(testId, questionId, language);
    if (!question.videoExplanationId) {
      throw new ApiError("This question does not have a video explanation.", 404);
    }
    const payload = await authenticatedRequest<RawPracticeVideoPayload>(
      `/practice_test_video_explanations/${encodeURIComponent(question.videoExplanationId)}`,
    );
    const explanation = normalizePracticeVideoExplanation(payload);
    if (!explanation) throw new ApiError("The video explanation is unavailable.", 502);
    return NextResponse.json({ data: explanation });
  } catch (error) {
    return routeError(error);
  }
}
