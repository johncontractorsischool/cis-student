import type { Metadata } from "next";

import { PracticeTestList } from "@/components/practice-test-list";
import { requirePortalUser } from "@/lib/auth/page";

export const metadata: Metadata = { title: "Practice Exams" };

export default async function PracticeTestsPage({ params, searchParams }: { params: Promise<{ categoryId: string; classId: string }>; searchParams: Promise<{ l?: string | string[] }> }) {
  await requirePortalUser();
  const [{ categoryId, classId }, query] = await Promise.all([params, searchParams]);
  return <PracticeTestList categoryId={categoryId} classId={classId} language={query.l === "es" ? "es" : "en"} />;
}
