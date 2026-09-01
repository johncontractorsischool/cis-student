import { NextResponse } from "next/server";

import { routeError } from "@/lib/api/route-error";
import { authenticatedRequest } from "@/lib/auth/request";
import { resourceIdentifierSchema, resourceRecommendationSchema } from "@/lib/resources/submissions";

export async function POST(
  request: Request,
  context: { params: Promise<{ classId: string }> },
) {
  try {
    const { classId: rawClassId } = await context.params;
    const classId = resourceIdentifierSchema.parse(rawClassId);
    const input = resourceRecommendationSchema.parse(await request.json());
    await authenticatedRequest(`/recommend-resources/${encodeURIComponent(classId)}`, {
      method: "POST",
      body: input,
    });
    return NextResponse.json({ data: { submitted: true }, message: "Resource recommendation submitted." });
  } catch (error) {
    return routeError(error);
  }
}
