import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PracticeResult } from "@/components/practice-result";
import { hasSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Practice Test Result" };

export default async function PracticeResultPage({ params }: { params: Promise<{ testId: string }> }) {
  if (!(await hasSession())) redirect("/login");
  const { testId } = await params;
  return <PracticeResult testId={testId} />;
}
