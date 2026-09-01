import { NextResponse } from "next/server";

import { routeError } from "@/lib/api/route-error";
import { authenticatedRequest } from "@/lib/auth/request";
import { normalizeResourceCollection } from "@/lib/resources/normalize";
import { resourceIdentifierSchema } from "@/lib/resources/submissions";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ classId: string }> },
) {
  try {
    const { classId: rawClassId } = await context.params;
    const classId = resourceIdentifierSchema.parse(rawClassId);
    const payload = await authenticatedRequest<unknown>(`/resources/${encodeURIComponent(classId)}`);
    return NextResponse.json({ data: normalizeResourceCollection(payload, classId) });
  } catch (error) {
    return routeError(error);
  }
}
