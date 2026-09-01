import type { Metadata } from "next";

import { ResourceFeedbackForm } from "@/components/resource-feedback-form";
import { requirePortalUser } from "@/lib/auth/page";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Report a Resource" };

export default async function ReportResourcePage({ params }: PageProps<"/resources/[classId]/report/[linkId]">) {
  await requirePortalUser();
  const { classId, linkId } = await params;
  return <ResourceFeedbackForm classId={classId} linkId={linkId} mode="report" />;
}
