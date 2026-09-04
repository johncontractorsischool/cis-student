import { NextResponse, type NextRequest } from "next/server";

import { ApiError } from "@/lib/api/errors";
import { routeError } from "@/lib/api/route-error";
import type { User } from "@/lib/api/types";
import { authenticatedRequest } from "@/lib/auth/request";
import { loadPracticeQuestion } from "@/lib/practice/access";
import { practiceFeedbackSchema } from "@/lib/practice/parity";
import type { StudyLanguage } from "@/lib/study/types";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ questionId: string; testId: string }> },
) {
  try {
    const { questionId, testId } = await context.params;
    const language: StudyLanguage = request.nextUrl.searchParams.get("l") === "es" ? "es" : "en";
    const input = practiceFeedbackSchema.parse(await request.json());
    const [user, authorizedQuestion] = await Promise.all([
      authenticatedRequest<User>("/account/me"),
      loadPracticeQuestion(testId, questionId, language),
    ]);
    if (Number(user.question_feedback_disabled) === 1) {
      throw new ApiError("Question feedback is not available for this account.", 403);
    }
    await authenticatedRequest("/practice_test_question_feedback", {
      method: "POST",
      body: {
        feedback_comment: input.comment,
        feedback_type: input.feedbackType,
        platform: "web",
        question_id: authorizedQuestion.question.id,
        test_id: authorizedQuestion.testId,
      },
    });
    return NextResponse.json({
      data: { submitted: true },
      message: "Question feedback submitted.",
    });
  } catch (error) {
    return routeError(error);
  }
}
