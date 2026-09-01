import type { Metadata } from "next";

import { AudioPlayer } from "@/components/audio-player";
import { requirePortalUser } from "@/lib/auth/page";

export const metadata: Metadata = { title: "Audio Lesson" };

export default async function AudioLessonPage({ params, searchParams }: { params: Promise<{ audioId: string; classId: string }>; searchParams: Promise<{ l?: string | string[] }> }) {
  await requirePortalUser();
  const [{ audioId, classId }, query] = await Promise.all([params, searchParams]);
  return <AudioPlayer audioId={audioId} classId={classId} language={query.l === "es" ? "es" : "en"} />;
}
