import "server-only";

import { ApiError } from "@/lib/api/errors";
import { authenticatedRequest } from "@/lib/auth/request";
import {
  normalizePracticeTestDetail,
  type RawPracticeDetailPayload,
} from "@/lib/practice/normalize";
import { practiceIdentifierSchema } from "@/lib/practice/parity";
import type { PracticeQuestion } from "@/lib/practice/types";
import type { StudyLanguage } from "@/lib/study/types";

export async function loadPracticeQuestion(
  rawTestId: string,
  rawQuestionId: string,
  language: StudyLanguage,
): Promise<{ question: PracticeQuestion; testId: string }> {
  const testId = practiceIdentifierSchema.parse(rawTestId);
  const questionId = practiceIdentifierSchema.parse(rawQuestionId);
  const languageQuery = language === "es" ? "?l=es" : "";
  const payload = await authenticatedRequest<RawPracticeDetailPayload>(
    `/practice_test_details/${encodeURIComponent(testId)}${languageQuery}`,
  );
  const detail = normalizePracticeTestDetail(payload, {}, language, "access-check");
  if (detail.id !== testId) throw new ApiError("Practice test details do not match this test.", 404);
  const question = detail.questions.find((item) => item.id === questionId);
  if (!question) throw new ApiError("This question is not part of the selected test.", 404);
  return { question, testId };
}
