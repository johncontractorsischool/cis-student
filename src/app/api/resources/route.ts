import { NextResponse } from "next/server";

import { routeError } from "@/lib/api/route-error";
import { authenticatedRequest } from "@/lib/auth/request";
import { normalizeResourceCatalogue } from "@/lib/resources/normalize";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [payload, renewal] = await Promise.all([
      authenticatedRequest<unknown>("/resource_classes"),
      authenticatedRequest<unknown>("/renewal-checkout-ctas").catch(() => null),
    ]);
    return NextResponse.json({ data: normalizeResourceCatalogue(payload, renewal) });
  } catch (error) {
    return routeError(error);
  }
}
