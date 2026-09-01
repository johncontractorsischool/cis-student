import type { Metadata } from "next";

import { PracticeExam } from "@/components/practice-exam";
import { requirePortalUser } from "@/lib/auth/page";

export const metadata: Metadata = { title: "Practice Test" };

export default async function PracticeAttemptPage({ params, searchParams }: { params: Promise<{ testId: string }>; searchParams: Promise<{ l?: string | string[] }> }) {
  await requirePortalUser();
  const [{ testId }, query] = await Promise.all([params, searchParams]);
  return <PracticeExam language={query.l === "es" ? "es" : "en"} testId={testId} />;
}
