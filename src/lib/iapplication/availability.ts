import type {
  IApplicationActionCenter,
  IApplicationAvailability,
  IApplicationOverview,
} from "@/lib/iapplication/types";

export function classifyIApplicationAvailability({
  actionCenter,
  failedStatuses,
  overview,
}: {
  actionCenter: IApplicationActionCenter | null;
  failedStatuses: Array<number | null>;
  overview: IApplicationOverview | null;
}): IApplicationAvailability {
  if ((overview !== null && overview.iapplication_link == null) || actionCenter?.linked === false) {
    return "not_linked";
  }
  if (overview || actionCenter) return "available";
  if (failedStatuses.includes(404)) return "not_found";
  return "unavailable";
}
