import { NextResponse, type NextRequest } from "next/server";

import { ApiError } from "@/lib/api/errors";
import { routeError } from "@/lib/api/route-error";
import type { User } from "@/lib/api/types";
import { authenticatedRequest } from "@/lib/auth/request";
import {
  normalizePracticeTestDetail,
  type RawPracticeDetailPayload,
} from "@/lib/practice/normalize";
import type { StudyLanguage } from "@/lib/study/types";

export const dynamic = "force-dynamic";

type HistoryPayload = { attempt_history?: Array<Record<string, unknown>> };

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ testId: string }> },
) {
  try {
    const { testId } = await context.params;
    const language: StudyLanguage = request.nextUrl.searchParams.get("l") === "es" ? "es" : "en";
    const languageQuery = language === "es" ? "?l=es" : "";
    const [detail, history, user] = await Promise.all([
      authenticatedRequest<RawPracticeDetailPayload>(`/practice_test_details/${encodeURIComponent(testId)}${languageQuery}`),
      authenticatedRequest<HistoryPayload>(`/exam_attempt/history/${encodeURIComponent(testId)}`),
      authenticatedRequest<User>("/account/me"),
    ]);
    if (user.customerid == null) throw new ApiError("Student account details are unavailable.", 403);
    const normalized = normalizePracticeTestDetail(detail, history, language, String(user.customerid));
    return NextResponse.json({
      data: {
        ...normalized,
        questionFeedbackEnabled: Number(user.question_feedback_disabled) !== 1,
      },
    });
  } catch (error) {
    return routeError(error);
  }
}
