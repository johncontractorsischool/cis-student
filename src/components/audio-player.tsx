"use client";

import { ArrowLeft, Check, ChevronLeft, ChevronRight, Headphones, RotateCcw, RotateCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { AudioCourse, StudyLanguage } from "@/lib/study/types";

export function AudioPlayer({ audioId, classId, language }: { audioId: string; classId: string; language: StudyLanguage }) {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [course, setCourse] = useState<AudioCourse | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const lesson = useMemo(() => course?.sections.flatMap((section) => section.lessons).find((item) => item.id === audioId) || null, [audioId, course]);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`/api/audio/${encodeURIComponent(classId)}${language === "es" ? "?l=es" : ""}`, { cache: "no-store", signal: controller.signal });
        const payload = (await response.json()) as { data?: AudioCourse; error?: { message?: string } };
        if (response.status === 401) return router.replace("/login");
        if (!response.ok || !payload.data) throw new Error(payload.error?.message || "Unable to load this audio lesson.");
        setCourse(payload.data);
      } catch (loadError) {
        if (!controller.signal.aborted) setError(loadError instanceof Error ? loadError.message : "Unable to load this audio lesson.");
      }
    }
    void load();
    return () => controller.abort();
  }, [classId, language, router]);

  const navigateTo = useCallback((id: string) => {
    const query = course?.language === "es" ? "?l=es" : "";
    router.push(`/audio/${classId}/${id}${query}`);
  }, [classId, course?.language, router]);

  const complete = useCallback(async (advance: boolean) => {
    if (!lesson || saving) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/audio/${encodeURIComponent(classId)}/${encodeURIComponent(lesson.id)}/complete`, { method: "POST" });
      if (!response.ok) throw new Error("We couldn’t save your audio progress.");
      if (advance) {
        if (lesson.nextId) navigateTo(lesson.nextId);
        else router.push(`/audio/${classId}${course?.language === "es" ? "?l=es" : ""}`);
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save progress.");
    } finally {
      setSaving(false);
    }
  }, [classId, course, lesson, navigateTo, router, saving]);

  useEffect(() => {
    if (!lesson || !("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({ album: course?.title, artist: "Contractors Intelligence School", title: lesson.title });
    navigator.mediaSession.setActionHandler("seekbackward", () => { if (audioRef.current) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 15); });
    navigator.mediaSession.setActionHandler("seekforward", () => { if (audioRef.current) audioRef.current.currentTime = Math.min(audioRef.current.duration || Infinity, audioRef.current.currentTime + 15); });
    navigator.mediaSession.setActionHandler("previoustrack", lesson.previousId ? () => navigateTo(lesson.previousId as string) : null);
    navigator.mediaSession.setActionHandler("nexttrack", lesson.nextId ? () => navigateTo(lesson.nextId as string) : null);
    return () => { navigator.mediaSession.metadata = null; };
  }, [course?.title, lesson, navigateTo]);

  function jump(seconds: number) {
    if (audioRef.current) audioRef.current.currentTime = Math.max(0, Math.min(audioRef.current.duration || Infinity, audioRef.current.currentTime + seconds));
  }

  if (error && !course) return <main className="centered-state"><h1>Audio unavailable</h1><p>{error}</p><Link className="primary-button reading-link-button" href="/courses/audio">Back to audio courses</Link></main>;
  if (!course) return <main className="reading-entry-state" aria-busy="true"><span className="reading-loader" /><h1>Loading audio</h1><p>Preparing the lesson player…</p></main>;
  if (!lesson) return <main className="centered-state"><h1>Audio lesson not found</h1><p>This lesson is not part of your active course.</p><Link className="primary-button reading-link-button" href={`/audio/${classId}`}>Back to course</Link></main>;
  const query = course.language === "es" ? "?l=es" : "";

  return (
    <div className="player-page audio-player-page">
      <header className="study-topbar"><Link href={`/audio/${classId}${query}`} aria-label="Back to audio course"><ArrowLeft aria-hidden="true" /></Link><div><span>Audio lesson</span><strong>{lesson.title}</strong></div><span className="reading-language-badge">{course.language.toUpperCase()}</span></header>
      <main className="player-main"><section className="audio-player-card"><div className="audio-art"><span><Headphones aria-hidden="true" /></span><p>Now playing</p><h1>{lesson.title}</h1><small>{course.title}</small></div><audio ref={audioRef} controls preload="metadata" src={lesson.sourceUrl} onEnded={() => void complete(true)} /><div className="audio-jump-controls"><button onClick={() => jump(-15)}><RotateCcw aria-hidden="true" />15 sec</button><button onClick={() => jump(15)}>15 sec<RotateCw aria-hidden="true" /></button></div>{error ? <span className="player-error">{error}</span> : null}<nav className="player-navigation" aria-label="Audio navigation">{lesson.previousId ? <Link href={`/audio/${classId}/${lesson.previousId}${query}`}><ChevronLeft aria-hidden="true" />Previous audio</Link> : <span />}<button onClick={() => void complete(true)} disabled={saving}><Check aria-hidden="true" />{saving ? "Saving…" : lesson.nextId ? "Complete & next" : "Complete course"}<ChevronRight aria-hidden="true" /></button></nav></section></main>
    </div>
  );
}
