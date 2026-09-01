import { NextResponse } from "next/server";

import { routeError } from "@/lib/api/route-error";
import { authenticatedRequest } from "@/lib/auth/request";
import { resourceIdentifierSchema, resourceReportSchema } from "@/lib/resources/submissions";

export async function POST(
  request: Request,
  context: { params: Promise<{ classId: string; linkId: string }> },
) {
  try {
    const { classId: rawClassId, linkId: rawLinkId } = await context.params;
    resourceIdentifierSchema.parse(rawClassId);
    const linkId = resourceIdentifierSchema.parse(rawLinkId);
    const input = resourceReportSchema.parse(await request.json());
    await authenticatedRequest(`/report-resources/${encodeURIComponent(linkId)}`, {
      method: "POST",
      body: input,
    });
    return NextResponse.json({ data: { submitted: true }, message: "Resource report submitted." });
  } catch (error) {
    return routeError(error);
  }
}
