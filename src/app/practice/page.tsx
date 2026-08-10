import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PracticeHome } from "@/components/practice-home";
import { hasSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Practice Tests" };

export default async function PracticePage({ searchParams }: { searchParams: Promise<{ l?: string | string[] }> }) {
  if (!(await hasSession())) redirect("/login");
  const query = await searchParams;
  return <PracticeHome language={query.l === "es" ? "es" : "en"} />;
}
