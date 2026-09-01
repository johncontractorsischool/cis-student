import type { Metadata } from "next";

import { LiveClassPlayer } from "@/components/live-class-player";
import { requirePortalUser } from "@/lib/auth/page";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Live Class Recording" };

export default async function LiveClassRecordingPage({
  params,
  searchParams,
}: {
  params: Promise<{ videoId: string }>;
  searchParams: Promise<{ l?: string | string[] }>;
}) {
  await requirePortalUser();
  const [{ videoId }, query] = await Promise.all([params, searchParams]);
  return <LiveClassPlayer language={query.l === "es" ? "es" : "en"} videoId={videoId} />;
}
