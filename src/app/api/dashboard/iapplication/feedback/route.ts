import { NextResponse } from "next/server";

import { ApiError } from "@/lib/api/errors";
import { routeError } from "@/lib/api/route-error";
import type { User } from "@/lib/api/types";
import { authenticatedRequest } from "@/lib/auth/request";
import { iApplicationRequest } from "@/lib/iapplication/client";
import { logIApplicationFeedback } from "@/lib/iapplication/debug";
import type { IApplicationFeedback } from "@/lib/iapplication/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await authenticatedRequest<User>("/account/me");
    if (user.customerid == null || String(user.customerid).trim() === "") {
      throw new ApiError("Student account details are unavailable.", 404);
    }

    const feedback = await iApplicationRequest<IApplicationFeedback>(
      user.customerid,
      "feedback",
    );
    logIApplicationFeedback(feedback);
    return NextResponse.json({ data: feedback });
  } catch (error) {
    return routeError(error);
  }
}
