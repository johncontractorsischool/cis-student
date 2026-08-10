import { NextResponse, type NextRequest } from "next/server";

import { routeError } from "@/lib/api/route-error";
import { resolveReadingEntry } from "@/lib/reading/access";
import type { ReadingLanguage } from "@/lib/reading/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const language: ReadingLanguage =
      request.nextUrl.searchParams.get("l") === "es" ? "es" : "en";
    const access = await resolveReadingEntry(language);
    return NextResponse.json({ data: access });
  } catch (error) {
    return routeError(error);
  }
}
