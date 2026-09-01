import type { User } from "@/lib/api/types";
import type { StudyProgressGroup } from "@/lib/domain/progress";
import type {
  DashboardAppSettings,
  DeviceAccessState,
  RenewalCheckoutCtas,
} from "@/lib/dashboard/presentation";
import type {
  IApplicationChecklistCollection,
  IApplicationDashboardData,
} from "@/lib/iapplication/types";

export type DashboardPayload = {
  app: DashboardAppSettings;
  deviceId: string;
  deviceStatus: DeviceAccessState;
  liveClassStatus: unknown;
  iApplication: IApplicationDashboardData | null;
  iApplicationChecklists: IApplicationChecklistCollection | null;
  practice: Record<string, unknown> | null;
  renewal: RenewalCheckoutCtas;
  studyProgress: {
    law?: StudyProgressGroup;
    trade?: StudyProgressGroup;
  } | null;
  upgrades: Record<string, unknown> | null;
  user: User;
};
