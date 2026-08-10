import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AudioPlayer } from "@/components/audio-player";
import { hasSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Audio Lesson" };

export default async function AudioLessonPage({ params, searchParams }: { params: Promise<{ audioId: string; classId: string }>; searchParams: Promise<{ l?: string | string[] }> }) {
  if (!(await hasSession())) redirect("/login");
  const [{ audioId, classId }, query] = await Promise.all([params, searchParams]);
  return <AudioPlayer audioId={audioId} classId={classId} language={query.l === "es" ? "es" : "en"} />;
}
