import type { Metadata } from "next";

import { PracticeOverview } from "@/components/practice-overview";
import { requirePortalUser } from "@/lib/auth/page";

export const metadata: Metadata = { title: "Practice Test Guidelines" };

export default async function PracticeOverviewPage({ params, searchParams }: { params: Promise<{ testId: string }>; searchParams: Promise<{ l?: string | string[] }> }) {
  await requirePortalUser();
  const [{ testId }, query] = await Promise.all([params, searchParams]);
  return <PracticeOverview language={query.l === "es" ? "es" : "en"} testId={testId} />;
}
