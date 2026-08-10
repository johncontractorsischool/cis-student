import { NextResponse, type NextRequest } from "next/server";

import { routeError } from "@/lib/api/route-error";
import { authenticatedRequest } from "@/lib/auth/request";
import { normalizePracticeIndex, type RawPracticeIndexPayload } from "@/lib/practice/normalize";
import type { StudyLanguage } from "@/lib/study/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const language: StudyLanguage = request.nextUrl.searchParams.get("l") === "es" ? "es" : "en";
    const payload = await authenticatedRequest<RawPracticeIndexPayload>("/practice_test_classes/opt");
    return NextResponse.json({ data: normalizePracticeIndex(payload, language) });
  } catch (error) {
    return routeError(error);
  }
}
