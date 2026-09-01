import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ResourceFeedbackForm } from "@/components/resource-feedback-form";
import { hasSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Report a Resource" };

export default async function ReportResourcePage({ params }: PageProps<"/resources/[classId]/report/[linkId]">) {
  if (!(await hasSession())) redirect("/login");
  const { classId, linkId } = await params;
  return <ResourceFeedbackForm classId={classId} linkId={linkId} mode="report" />;
}
