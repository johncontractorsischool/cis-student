import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { VideoPlayer } from "@/components/video-player";
import { hasSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Video Lesson" };

export default async function VideoLessonPage({ params, searchParams }: { params: Promise<{ videoId: string }>; searchParams: Promise<{ l?: string | string[] }> }) {
  if (!(await hasSession())) redirect("/login");
  const [{ videoId }, query] = await Promise.all([params, searchParams]);
  return <VideoPlayer language={query.l === "es" ? "es" : "en"} videoId={videoId} />;
}
