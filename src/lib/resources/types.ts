export type ResourceCategoryStatus = "active" | "expired" | "inactive";

export type ResourceCategory = {
  courseId: string;
  expirationDate: string | null;
  id: string;
  status: ResourceCategoryStatus;
  title: string;
};

export type ResourceCatalogue = {
  categories: ResourceCategory[];
  renewal: RenewalCheckoutCtas;
  type: "demo_resource" | "resource";
};

export type ResourceLink = {
  description: string;
  id: string;
  organization: string;
  title: string;
  url: string;
};

export type ResourceCollection = {
  classId: string;
  resources: ResourceLink[];
  title: string;
};

export const RESOURCE_REPORT_ISSUES = [
  "Irrelevant to my studies (I don't think its applicable)",
  "Link Doesn't Work",
  "User Interface (Displays incorrectly)",
  "Other",
] as const;

export type ResourceReportIssue = (typeof RESOURCE_REPORT_ISSUES)[number];
import type { RenewalCheckoutCtas } from "../dashboard/presentation";
