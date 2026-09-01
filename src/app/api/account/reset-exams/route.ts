import { NextResponse } from "next/server";

import { routeError } from "@/lib/api/route-error";
import { authenticatedRequest } from "@/lib/auth/request";

export async function POST() {
  try {
    await authenticatedRequest("/exam_attempt/reset");
    return NextResponse.json({ data: { reset: true } });
  } catch (error) {
    return routeError(error);
  }
}
