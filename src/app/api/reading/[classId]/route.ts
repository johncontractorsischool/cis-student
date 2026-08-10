import { NextResponse, type NextRequest } from "next/server";

import { authenticatedRequest } from "@/lib/auth/request";
import { routeError } from "@/lib/api/route-error";
import { verifyReadingAccess } from "@/lib/reading/access";
import {
  normalizeReadingCourse,
  type RawReadingPayload,
} from "@/lib/reading/normalize";
import type { ReadingLanguage } from "@/lib/reading/types";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ classId: string }> },
) {
  try {
    const { classId } = await context.params;
    const language: ReadingLanguage =
      request.nextUrl.searchParams.get("l") === "es" ? "es" : "en";
    const access = await verifyReadingAccess(classId, language);
    const payload = await authenticatedRequest<RawReadingPayload>(
      `/reading_courses_with_detail/${encodeURIComponent(classId)}`,
    );
    return NextResponse.json({ data: normalizeReadingCourse(payload, access) });
  } catch (error) {
    return routeError(error);
  }
}
