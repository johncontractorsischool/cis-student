import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LiveClassList } from "@/components/live-class-list";
import { hasSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Live Class" };

export default async function LiveClassPage({
  searchParams,
}: {
  searchParams: Promise<{ l?: string | string[] }>;
}) {
  if (!(await hasSession())) redirect("/login");
  const query = await searchParams;
  return <LiveClassList language={query.l === "es" ? "es" : "en"} />;
}
