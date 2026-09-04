import { NextResponse } from "next/server";

import { ApiError } from "@/lib/api/errors";
import { routeError } from "@/lib/api/route-error";
import type { User } from "@/lib/api/types";
import { authenticatedRequest } from "@/lib/auth/request";
import { CONTRACT_FORM_PRODUCTS } from "@/lib/contract-forms/catalog";
import type { ContractFormsPayload } from "@/lib/contract-forms/types";
import { isDemoAccount } from "@/lib/domain/demo";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await authenticatedRequest<User>("/account/me");
    if (!isDemoAccount(user) && Number(user.account_type) !== 1) {
      throw new ApiError(
        "Contract Forms are available for demo and contractor accounts.",
        403,
      );
    }

    return NextResponse.json({
      data: {
        checkoutBaseUrl: env.SHOPIFY_DOMAIN,
        products: [...CONTRACT_FORM_PRODUCTS],
      } satisfies ContractFormsPayload,
    });
  } catch (error) {
    return routeError(error);
  }
}
