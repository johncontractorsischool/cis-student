import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { routeError } from "@/lib/api/route-error";
import { authenticatedRequest } from "@/lib/auth/request";
import type { IApplicationExamSchedule } from "@/lib/iapplication/types";

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid exam date.");
const updateSchema = z.object({
  law_date: dateOnly,
  trade_date: dateOnly,
});

type ExamDateUpdate = {
  application_id: string;
  exam_schedule: IApplicationExamSchedule;
};

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ applicationId: string }> },
) {
  try {
    const { applicationId: rawApplicationId } = await context.params;
    const applicationId = z.string().trim().min(1).max(191).parse(rawApplicationId);
    const input = updateSchema.parse(await request.json());
    const update = await authenticatedRequest<ExamDateUpdate>(
      `/iapplication/applications/${encodeURIComponent(applicationId)}/exam-dates`,
      { method: "PATCH", body: input },
    );

    return NextResponse.json({ data: update });
  } catch (error) {
    return routeError(error);
  }
}
