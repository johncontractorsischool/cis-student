import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PracticeTestList } from "@/components/practice-test-list";
import { hasSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Practice Exams" };

export default async function PracticeTestsPage({ params, searchParams }: { params: Promise<{ categoryId: string; classId: string }>; searchParams: Promise<{ l?: string | string[] }> }) {
  if (!(await hasSession())) redirect("/login");
  const [{ categoryId, classId }, query] = await Promise.all([params, searchParams]);
  return <PracticeTestList categoryId={categoryId} classId={classId} language={query.l === "es" ? "es" : "en"} />;
}
