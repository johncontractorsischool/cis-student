import { NextResponse } from "next/server";

import { accountProfileFromUser } from "@/lib/account/presentation";
import { routeError } from "@/lib/api/route-error";
import type { User } from "@/lib/api/types";
import { authenticatedRequest } from "@/lib/auth/request";
import { languageSchema } from "@/lib/auth/schemas";

export async function POST(request: Request) {
  try {
    const language = languageSchema.parse(await request.json());
    const user = await authenticatedRequest<User>("/account/update-lang", {
      method: "POST",
      body: language,
    });
    return NextResponse.json({ data: accountProfileFromUser(user) });
  } catch (error) {
    return routeError(error);
  }
}
