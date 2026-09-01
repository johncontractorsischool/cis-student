import type { Metadata } from "next";

import { PracticeResult } from "@/components/practice-result";
import { requirePortalUser } from "@/lib/auth/page";

export const metadata: Metadata = { title: "Practice Test Result" };

export default async function PracticeResultPage({ params }: { params: Promise<{ testId: string }> }) {
  await requirePortalUser();
  const { testId } = await params;
  return <PracticeResult testId={testId} />;
}
