import { NextResponse, type NextRequest } from "next/server";

import { ApiError } from "@/lib/api/errors";
import { routeError } from "@/lib/api/route-error";
import { authenticatedRequest } from "@/lib/auth/request";
import {
  normalizePracticeIndex,
  normalizePracticeTestList,
  type RawPracticeIndexPayload,
  type RawPracticeTestsPayload,
} from "@/lib/practice/normalize";
import type { StudyLanguage } from "@/lib/study/types";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ categoryId: string; classId: string }> },
) {
  try {
    const { categoryId, classId } = await context.params;
    const language: StudyLanguage = request.nextUrl.searchParams.get("l") === "es" ? "es" : "en";
    const indexPayload = await authenticatedRequest<RawPracticeIndexPayload>("/practice_test_classes/opt");
    const index = normalizePracticeIndex(indexPayload, language);
    const category = index.categories.find((item) => item.id === classId && item.testCategoryId === categoryId);
    if (!category || index.type !== "practice_test") {
      throw new ApiError("You do not have access to these practice tests.", 403);
    }
    if (category.expired) throw new ApiError("This practice-test course has expired.", 403);
    const payload = await authenticatedRequest<RawPracticeTestsPayload>(
      `/get_practice_tests/${encodeURIComponent(classId)}/${encodeURIComponent(categoryId)}`,
    );
    return NextResponse.json({ data: normalizePracticeTestList(payload, category, category.language) });
  } catch (error) {
    return routeError(error);
  }
}
