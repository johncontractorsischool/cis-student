import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PracticeOverview } from "@/components/practice-overview";
import { hasSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Practice Test Guidelines" };

export default async function PracticeOverviewPage({ params, searchParams }: { params: Promise<{ testId: string }>; searchParams: Promise<{ l?: string | string[] }> }) {
  if (!(await hasSession())) redirect("/login");
  const [{ testId }, query] = await Promise.all([params, searchParams]);
  return <PracticeOverview language={query.l === "es" ? "es" : "en"} testId={testId} />;
}
