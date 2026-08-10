import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ReadingOutline } from "@/components/reading-outline";
import { hasSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Reading Course" };

export default async function ReadingOutlinePage({
  params,
  searchParams,
}: {
  params: Promise<{ classId: string }>;
  searchParams: Promise<{ l?: string | string[] }>;
}) {
  if (!(await hasSession())) redirect("/login");
  const { classId } = await params;
  const query = await searchParams;
  return <ReadingOutline classId={classId} language={query.l === "es" ? "es" : "en"} />;
}
