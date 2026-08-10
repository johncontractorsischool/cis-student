import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LiveClassPlayer } from "@/components/live-class-player";
import { hasSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Live Class Recording" };

export default async function LiveClassRecordingPage({
  params,
  searchParams,
}: {
  params: Promise<{ videoId: string }>;
  searchParams: Promise<{ l?: string | string[] }>;
}) {
  if (!(await hasSession())) redirect("/login");
  const [{ videoId }, query] = await Promise.all([params, searchParams]);
  return <LiveClassPlayer language={query.l === "es" ? "es" : "en"} videoId={videoId} />;
}
