import type { User } from "@/lib/api/types";
import type { StudyProgressGroup } from "@/lib/domain/progress";
import type {
  IApplicationChecklistCollection,
  IApplicationDashboardData,
} from "@/lib/iapplication/types";

export type DashboardPayload = {
  app: Record<string, unknown> | null;
  deviceId: string;
  deviceStatus: Record<string, unknown> | null;
  liveClassStatus: unknown;
  iApplication: IApplicationDashboardData | null;
  iApplicationChecklists: IApplicationChecklistCollection | null;
  practice: Record<string, unknown> | null;
  renewal: Record<string, unknown> | null;
  studyProgress: {
    law?: StudyProgressGroup;
    trade?: StudyProgressGroup;
  } | null;
  upgrades: Record<string, unknown> | null;
  user: User;
};
