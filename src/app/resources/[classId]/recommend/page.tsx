import type { Metadata } from "next";

import { ResourceFeedbackForm } from "@/components/resource-feedback-form";
import { requirePortalUser } from "@/lib/auth/page";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Recommend a Resource" };

export default async function RecommendResourcePage({ params }: PageProps<"/resources/[classId]/recommend">) {
  await requirePortalUser();
  const { classId } = await params;
  return <ResourceFeedbackForm classId={classId} mode="recommend" />;
}
