"use client";

import {
  ArrowLeft,
  ChevronRight,
  CirclePlay,
  ExternalLink,
  Info,
  Radio,
  Video,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { LiveClassCatalogue, LiveClassSessionStatus } from "@/lib/live/types";
import type { StudyLanguage } from "@/lib/study/types";

const copy = {
  en: {
    archive: "Archive",
    clickHere: "Open the web viewer",
    empty: "There are no Live Class sessions available right now.",
    heading: "Live Class",
    intro: "Join an active session or watch a previous class recording.",
    live: "Live",
    pre_recorded: "Pre Recorded",
    trouble: "Having trouble with a video?",
  },
  es: {
    archive: "Archivo",
    clickHere: "Abrir el visor web",
    empty: "No hay sesiones de clase en vivo disponibles en este momento.",
    heading: "Clase en vivo",
    intro: "Únase a una sesión activa o vea una grabación anterior.",
    live: "En vivo",
    pre_recorded: "Pregrabado",
    trouble: "¿Tiene problemas con un video?",
  },
} as const;

export function LiveClassList({ language }: { language: StudyLanguage }) {
  const router = useRouter();
  const [data, setData] = useState<LiveClassCatalogue | null>(null);
  const [error, setError] = useState("");
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const ui = copy[language];

  const load = useCallback(async () => {
    setError("");
    try {
      const response = await fetch(`/api/live${language === "es" ? "?l=es" : ""}`, { cache: "no-store" });
      const payload = (await response.json()) as { data?: LiveClassCatalogue; error?: { message?: string } };
      if (response.status === 401) return router.replace("/login");
      if (!response.ok || !payload.data) throw new Error(payload.error?.message || "Unable to load Live Class.");
      setData(payload.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load Live Class.");
    }
  }, [language, router]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(initialLoad);
  }, [load]);

  useEffect(() => {
    if (!announcementOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAnnouncementOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [announcementOpen]);

  const sessionCount = useMemo(
    () => data?.sections.reduce((total, section) => total + section.sessions.length, 0) || 0,
    [data],
  );
  const liveCount = useMemo(
    () => data?.sections.reduce(
      (total, section) => total + section.sessions.filter((session) => session.status === "live").length,
      0,
    ) || 0,
    [data],
  );

  if (error && !data) {
    return <LiveClassState language={language} title="Live Class is unavailable" message={error} action={<button onClick={() => void load()}>Try again</button>} />;
  }
  if (!data) return <LiveClassLoading language={language} />;
  const languageQuery = language === "es" ? "?l=es" : "";

  return (
    <div className="live-class-page">
      <LiveClassTopbar language={language} title={ui.heading} />
      <main className="live-class-main">
        {data.announcement ? (
          <button className="live-announcement" type="button" onClick={() => setAnnouncementOpen(true)}>
            <span><Radio aria-hidden="true" /></span>
            <strong>{data.announcement.title}</strong>
            <Info aria-hidden="true" />
          </button>
        ) : null}

        <section className={`live-class-hero ${data.isLive ? "is-live" : ""}`}>
          <span><Radio aria-hidden="true" /></span>
          <div><p>{data.isLive ? (language === "es" ? "Sesión en progreso" : "Session in progress") : (language === "es" ? "Aula en línea" : "Online classroom")}</p><h1>{ui.heading}</h1><strong>{ui.intro}</strong></div>
          <div className="live-class-counts"><span><strong>{sessionCount}</strong> {language === "es" ? "sesiones" : "sessions"}</span>{data.isLive || liveCount ? <span className="live-now-pill"><i />{ui.live}</span> : null}</div>
        </section>

        {data.fallbackUrl ? (
          <p className="live-class-trouble">{ui.trouble} <a href={data.fallbackUrl} target="_blank" rel="noopener noreferrer">{ui.clickHere}<ExternalLink aria-hidden="true" /></a></p>
        ) : null}

        {data.sections.length ? (
          <div className="live-class-sections">
            {data.sections.map((section) => (
              <section className="live-class-section" key={section.id}>
                <header><div><p>{language === "es" ? "Programa de clase" : "Class schedule"}</p><h2>{section.title}</h2></div><span>{section.sessions.length}</span></header>
                <div className="live-session-list">
                  {section.sessions.map((session) => {
                    const content = <><StatusIcon status={session.status} /><div><h3>{session.title}</h3><span className={`live-session-badge ${session.status}`}>{session.status === "live" ? <i /> : null}{ui[session.status]}</span></div>{session.status === "live" ? <ExternalLink aria-hidden="true" /> : <ChevronRight aria-hidden="true" />}</>;
                    if (session.status === "live") {
                      return session.destinationUrl ? (
                        <a className="live-session-row" href={session.destinationUrl} target="_blank" rel="noopener noreferrer" key={session.id}>{content}</a>
                      ) : (
                        <div className="live-session-row unavailable" aria-disabled="true" key={session.id}>{content}</div>
                      );
                    }
                    return <Link className="live-session-row" href={`/live/watch/${session.id}${languageQuery}`} key={session.id}>{content}</Link>;
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <section className="live-class-empty"><Video aria-hidden="true" /><h2>{language === "es" ? "No hay clases disponibles" : "No classes available"}</h2><p>{ui.empty}</p></section>
        )}
      </main>

      {announcementOpen && data.announcement ? (
        <div className="live-announcement-modal" role="dialog" aria-modal="true" aria-labelledby="live-announcement-title" onMouseDown={(event) => { if (event.currentTarget === event.target) setAnnouncementOpen(false); }}>
          <div><header><div><span>{language === "es" ? "Actualización de clase" : "Class update"}</span><h2 id="live-announcement-title">{data.announcement.title}</h2></div><button autoFocus type="button" onClick={() => setAnnouncementOpen(false)} aria-label="Close announcement"><X aria-hidden="true" /></button></header><p>{data.announcement.description}</p></div>
        </div>
      ) : null}
    </div>
  );
}

function StatusIcon({ status }: { status: LiveClassSessionStatus }) {
  if (status === "live") return <span className="live-session-icon live"><Radio aria-hidden="true" /></span>;
  if (status === "pre_recorded") return <span className="live-session-icon prerecorded"><CirclePlay aria-hidden="true" /></span>;
  return <span className="live-session-icon"><Video aria-hidden="true" /></span>;
}

function LiveClassTopbar({ language, title }: { language: StudyLanguage; title: string }) {
  return <header className="study-topbar live-class-topbar"><Link href="/dashboard" aria-label="Back to dashboard"><ArrowLeft aria-hidden="true" /></Link><div><span>{language === "es" ? "Aula" : "Classroom"}</span><strong>{title}</strong></div><span className="reading-language-badge">{language.toUpperCase()}</span></header>;
}

function LiveClassLoading({ language }: { language: StudyLanguage }) {
  return <div className="live-class-page"><LiveClassTopbar language={language} title={copy[language].heading} /><main className="live-class-main live-class-loading" aria-busy="true"><div className="skeleton live-class-hero-skeleton" /><div className="skeleton live-class-section-skeleton" /><div className="skeleton live-class-section-skeleton" /></main></div>;
}

function LiveClassState({ action, language, message, title }: { action: React.ReactNode; language: StudyLanguage; message: string; title: string }) {
  return <div className="live-class-page"><LiveClassTopbar language={language} title={copy[language].heading} /><main className="live-class-state"><span><Radio aria-hidden="true" /></span><h1>{title}</h1><p>{message}</p>{action}</main></div>;
}
