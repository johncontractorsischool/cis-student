import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ResourceFeedbackForm } from "@/components/resource-feedback-form";
import { hasSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Recommend a Resource" };

export default async function RecommendResourcePage({ params }: PageProps<"/resources/[classId]/recommend">) {
  if (!(await hasSession())) redirect("/login");
  const { classId } = await params;
  return <ResourceFeedbackForm classId={classId} mode="recommend" />;
}
