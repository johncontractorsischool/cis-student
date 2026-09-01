import type { Metadata } from "next";

import { VideoPlayer } from "@/components/video-player";
import { requirePortalUser } from "@/lib/auth/page";

export const metadata: Metadata = { title: "Video Lesson" };

export default async function VideoLessonPage({ params, searchParams }: { params: Promise<{ videoId: string }>; searchParams: Promise<{ l?: string | string[] }> }) {
  await requirePortalUser();
  const [{ videoId }, query] = await Promise.all([params, searchParams]);
  return <VideoPlayer language={query.l === "es" ? "es" : "en"} videoId={videoId} />;
}
