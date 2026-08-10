import { NextResponse } from "next/server";
import { z } from "zod";

import { routeError } from "@/lib/api/route-error";
import { authenticatedRequest } from "@/lib/auth/request";
import type { RawPracticeDetailPayload } from "@/lib/practice/normalize";

export const dynamic = "force-dynamic";

const resultSchema = z.object({ score: z.number().min(0).max(100) });

export async function POST(
  request: Request,
  context: { params: Promise<{ testId: string }> },
) {
  try {
    const { testId } = await context.params;
    const { score } = resultSchema.parse(await request.json());
    await authenticatedRequest<RawPracticeDetailPayload>(`/practice_test_details/${encodeURIComponent(testId)}`);
    await authenticatedRequest(`/exam_attempt/save/${encodeURIComponent(testId)}/${score.toFixed(2)}`);
    return NextResponse.json({ data: { saved: true } });
  } catch (error) {
    return routeError(error);
  }
}
