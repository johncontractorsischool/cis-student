"use client";

import { ArrowLeft, Check, ChevronLeft, ChevronRight, ExternalLink, PlayCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import type { StudyLanguage, VideoLessonDetail } from "@/lib/study/types";

export function VideoPlayer({ language, videoId }: { language: StudyLanguage; videoId: string }) {
  const router = useRouter();
  const [detail, setDetail] = useState<VideoLessonDetail | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`/api/videos/watch/${encodeURIComponent(videoId)}${language === "es" ? "?l=es" : ""}`, { cache: "no-store", signal: controller.signal });
        const payload = (await response.json()) as { data?: VideoLessonDetail; error?: { message?: string } };
        if (response.status === 401) return router.replace("/login");
        if (!response.ok || !payload.data) throw new Error(payload.error?.message || "Unable to load this video.");
        setDetail(payload.data);
      } catch (loadError) {
        if (!controller.signal.aborted) setError(loadError instanceof Error ? loadError.message : "Unable to load this video.");
      }
    }
    void load();
    return () => controller.abort();
  }, [language, router, videoId]);

  const complete = useCallback(async (advance: boolean) => {
    if (!detail || saving) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/videos/watch/${encodeURIComponent(detail.id)}/complete`, { method: "POST" });
      if (!response.ok) throw new Error("We couldn’t save your video progress.");
      if (advance) {
        const languageQuery = detail.language === "es" ? "?l=es" : "";
        router.push(detail.nextId ? `/videos/watch/${detail.nextId}${languageQuery}` : `/videos/${detail.classId}${languageQuery}`);
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save progress.");
    } finally {
      setSaving(false);
    }
  }, [detail, router, saving]);

  if (error && !detail) return <main className="centered-state"><h1>Video unavailable</h1><p>{error}</p><Link className="primary-button reading-link-button" href="/courses/video">Back to video courses</Link></main>;
  if (!detail) return <main className="reading-entry-state" aria-busy="true"><span className="reading-loader" /><h1>Loading video</h1><p>Preparing the lesson player…</p></main>;
  const query = detail.language === "es" ? "?l=es" : "";

  return (
    <div className="player-page">
      <header className="study-topbar"><Link href={`/videos/${detail.classId}${query}`} aria-label="Back to video course"><ArrowLeft aria-hidden="true" /></Link><div><span>Video lesson</span><strong>{detail.title}</strong></div><span className="reading-language-badge">{detail.language.toUpperCase()}</span></header>
      <main className="player-main">
        <section className="player-card">
          <div className="video-stage">
            {detail.asset.videoUrl && !detail.asset.redirect ? <video controls playsInline poster={detail.asset.thumbnailUrl || undefined} src={detail.asset.videoUrl} onEnded={() => void complete(true)} /> : <div className="external-media"><PlayCircle aria-hidden="true" /><h1>{detail.title}</h1><p>This lesson opens in the school’s secure video viewer.</p>{detail.asset.redirectUrl ? <a href={detail.asset.redirectUrl} target="_blank" rel="noreferrer">Open video <ExternalLink aria-hidden="true" /></a> : null}</div>}
          </div>
          <div className="player-copy"><p>Course video</p><h1>{detail.title}</h1>{error ? <span className="player-error">{error}</span> : null}</div>
          <nav className="player-navigation" aria-label="Video navigation">
            {detail.previousId ? <Link href={`/videos/watch/${detail.previousId}${query}`}><ChevronLeft aria-hidden="true" />Previous video</Link> : <span />}
            <button onClick={() => void complete(true)} disabled={saving}><Check aria-hidden="true" />{saving ? "Saving…" : detail.nextId ? "Complete & next" : "Complete course"}<ChevronRight aria-hidden="true" /></button>
          </nav>
        </section>
      </main>
    </div>
  );
}
