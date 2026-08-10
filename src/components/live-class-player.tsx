"use client";

import { ArrowLeft, ExternalLink, Radio, Video } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { LiveClassVideoDetail } from "@/lib/live/types";
import type { StudyLanguage } from "@/lib/study/types";

export function LiveClassPlayer({ language, videoId }: { language: StudyLanguage; videoId: string }) {
  const router = useRouter();
  const [detail, setDetail] = useState<LiveClassVideoDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`/api/live/${encodeURIComponent(videoId)}${language === "es" ? "?l=es" : ""}`, { cache: "no-store", signal: controller.signal });
        const payload = (await response.json()) as { data?: LiveClassVideoDetail; error?: { message?: string } };
        if (response.status === 401) return router.replace("/login");
        if (!response.ok || !payload.data) throw new Error(payload.error?.message || "Unable to load this recording.");
        setDetail(payload.data);
      } catch (loadError) {
        if (!controller.signal.aborted) setError(loadError instanceof Error ? loadError.message : "Unable to load this recording.");
      }
    }
    void load();
    return () => controller.abort();
  }, [language, router, videoId]);

  const query = language === "es" ? "?l=es" : "";
  if (error && !detail) return <main className="centered-state"><h1>Recording unavailable</h1><p>{error}</p><Link className="primary-button reading-link-button" href={`/live${query}`}>Back to Live Class</Link></main>;
  if (!detail) return <main className="reading-entry-state" aria-busy="true"><span className="reading-loader" /><h1>Loading class recording</h1><p>Preparing the video player…</p></main>;

  return (
    <div className="player-page live-player-page">
      <header className="study-topbar"><Link href={`/live${query}`} aria-label="Back to Live Class"><ArrowLeft aria-hidden="true" /></Link><div><span>{detail.categoryTitle}</span><strong>{detail.title}</strong></div><span className="reading-language-badge">{language.toUpperCase()}</span></header>
      <main className="player-main">
        <section className="player-card">
          <div className="video-stage">
            {detail.asset.videoUrl && !detail.asset.redirect ? (
              <video controls playsInline poster={detail.asset.thumbnailUrl || undefined} src={detail.asset.videoUrl} onEnded={() => router.push(`/live${query}`)} />
            ) : (
              <div className="external-media"><Video aria-hidden="true" /><h1>{detail.title}</h1><p>This recording opens in the school’s secure video viewer.</p>{detail.asset.redirectUrl ? <a href={detail.asset.redirectUrl} target="_blank" rel="noopener noreferrer">Open recording <ExternalLink aria-hidden="true" /></a> : null}</div>
            )}
          </div>
          <div className="live-player-copy"><span className={`live-session-badge ${detail.status}`}>{detail.status === "live" ? <i /> : null}{detail.status === "pre_recorded" ? "Pre Recorded" : detail.status === "live" ? "Live" : "Archive"}</span><p>{detail.categoryTitle}</p><h1>{detail.title}</h1></div>
          <footer className="live-player-footer"><Link href={`/live${query}`}><ArrowLeft aria-hidden="true" />Back to Live Class</Link><span><Radio aria-hidden="true" />Contractors Intelligence School</span></footer>
        </section>
      </main>
    </div>
  );
}
