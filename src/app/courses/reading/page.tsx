import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ReadingEntry } from "@/components/reading-entry";
import { hasSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Reading Course" };

export default async function ReadingEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ l?: string | string[] }>;
}) {
  if (!(await hasSession())) redirect("/login");
  const params = await searchParams;
  return <ReadingEntry language={params.l === "es" ? "es" : "en"} />;
}
