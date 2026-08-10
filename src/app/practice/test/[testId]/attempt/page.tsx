import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PracticeExam } from "@/components/practice-exam";
import { hasSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Practice Test" };

export default async function PracticeAttemptPage({ params, searchParams }: { params: Promise<{ testId: string }>; searchParams: Promise<{ l?: string | string[] }> }) {
  if (!(await hasSession())) redirect("/login");
  const [{ testId }, query] = await Promise.all([params, searchParams]);
  return <PracticeExam language={query.l === "es" ? "es" : "en"} testId={testId} />;
}
