import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { routeError } from "@/lib/api/route-error";
import { authenticatedRequest } from "@/lib/auth/request";
import {
  IAPPLICATION_CHECKLIST_KEYS,
  type IApplicationChecklist,
} from "@/lib/iapplication/types";

const updateSchema = z.object({
  item: z.enum(IAPPLICATION_CHECKLIST_KEYS),
  completed: z.boolean(),
});

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ applicationId: string }> },
) {
  try {
    const { applicationId: rawApplicationId } = await context.params;
    const applicationId = z.string().trim().min(1).max(191).parse(rawApplicationId);
    const input = updateSchema.parse(await request.json());
    const checklist = await authenticatedRequest<IApplicationChecklist>(
      `/iapplication/application-checklists/${encodeURIComponent(applicationId)}`,
      { method: "PATCH", body: input },
    );

    return NextResponse.json({ data: checklist });
  } catch (error) {
    return routeError(error);
  }
}
