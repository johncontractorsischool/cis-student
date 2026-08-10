import { ApiError } from "@/lib/api/errors";
import { classifyIApplicationAvailability } from "@/lib/iapplication/availability";
import { iApplicationRequest } from "@/lib/iapplication/client";
import { logIApplicationDashboard } from "@/lib/iapplication/debug";
import type {
  IApplicationActionCenter,
  IApplicationDashboardData,
  IApplicationOverview,
} from "@/lib/iapplication/types";

type Settled<T> =
  | { ok: true; value: T }
  | { error: unknown; ok: false };

async function settle<T>(promise: Promise<T>): Promise<Settled<T>> {
  try {
    return { ok: true, value: await promise };
  } catch (error) {
    return { error, ok: false };
  }
}

function statusOf(result: Settled<unknown>): number | null {
  return !result.ok && result.error instanceof ApiError ? result.error.status : null;
}

export async function loadIApplicationDashboard(
  customerId: number | string | null | undefined,
): Promise<IApplicationDashboardData | null> {
  if (customerId == null || String(customerId).trim() === "") return null;

  const [overviewResult, actionResult] = await Promise.all([
    settle(iApplicationRequest<IApplicationOverview>(customerId, "overview")),
    settle(iApplicationRequest<IApplicationActionCenter>(customerId, "action-center")),
  ]);

  const overview = overviewResult.ok ? overviewResult.value : null;
  const actionCenter = actionResult.ok ? actionResult.value : null;
  const statuses = [statusOf(overviewResult), statusOf(actionResult)];

  const availability = classifyIApplicationAvailability({
    actionCenter,
    failedStatuses: statuses,
    overview,
  });

  const result = { actionCenter, availability, overview } satisfies IApplicationDashboardData;
  logIApplicationDashboard(result);
  return result;
}
