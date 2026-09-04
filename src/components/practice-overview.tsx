"use client";

import { ArrowLeft, ChevronRight, Clock3, Gauge, History, ListChecks, Trophy } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { PracticeTestDetail } from "@/lib/practice/types";
import type { StudyLanguage } from "@/lib/study/types";

function timeLabel(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours ? `${hours} hr${hours === 1 ? "" : "s"}${minutes ? ` ${minutes} min` : ""}` : `${minutes} min`;
}

export function PracticeOverview({ language, testId }: { language: StudyLanguage; testId: string }) {
  const router = useRouter();
  const [detail, setDetail] = useState<PracticeTestDetail | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`/api/practice/test/${encodeURIComponent(testId)}${language === "es" ? "?l=es" : ""}`, { cache: "no-store", signal: controller.signal });
        const payload = (await response.json()) as { data?: PracticeTestDetail; error?: { message?: string } };
        if (response.status === 401) return router.replace("/login");
        if (!response.ok || !payload.data) throw new Error(payload.error?.message || "Unable to load this test.");
        setDetail(payload.data);
      } catch (loadError) { if (!controller.signal.aborted) setError(loadError instanceof Error ? loadError.message : "Unable to load this test."); }
    }
    void load(); return () => controller.abort();
  }, [language, router, testId]);
  if (error) return <main className="centered-state"><h1>Test unavailable</h1><p>{error}</p><Link className="primary-button reading-link-button" href="/practice">Back to practice tests</Link></main>;
  if (!detail) return <main className="reading-entry-state" aria-busy="true"><span className="reading-loader" /><h1>Loading test guidelines</h1><p>Preparing the exam details…</p></main>;
  const query = detail.language === "es" ? "?l=es" : "";
  const passingScore = Math.ceil((detail.passingPercent / 100) * detail.questions.length);
  const stats = [{ icon: ListChecks, label: "Questions", value: detail.questions.length }, { icon: Trophy, label: "Full score", value: detail.fullScore }, { icon: Gauge, label: "Passing score", value: `${passingScore} (${detail.passingPercent}%)` }, { icon: Clock3, label: "Time limit", value: timeLabel(detail.timeLimitSeconds) }];
  return <div className="study-page"><header className="study-topbar"><Link href={`/practice${query}`} aria-label="Back to practice tests"><ArrowLeft aria-hidden="true" /></Link><div><span>Test guidelines</span><strong>{detail.title}</strong></div><span className="reading-language-badge">{detail.language.toUpperCase()}</span></header><main className="study-main practice-overview-main"><section className="exam-overview-hero"><p>{detail.categoryTitle}</p><h1>{detail.title}</h1><span>Answer one question at a time. Submit each answer to see the explanation before moving on.</span></section><section className="exam-stat-grid">{stats.map((stat) => { const Icon = stat.icon; return <div key={stat.label}><Icon aria-hidden="true" /><span>{stat.label}</span><strong>{stat.value}</strong></div>; })}</section><section className="attempt-history"><div className="course-section-heading"><div><p>Performance</p><h2><History aria-hidden="true" /> Previous attempts</h2></div><span>{detail.attemptHistory.length}</span></div>{detail.attemptHistory.length ? <div>{detail.attemptHistory.map((attempt) => <p key={attempt.id}><span>{attempt.date}</span><strong className={attempt.score >= detail.passingPercent ? "passing" : ""}>{attempt.score}%</strong></p>)}</div> : <p className="practice-no-tests">No previous attempts yet.</p>}</section><Link className="exam-start-button" href={`/practice/test/${detail.id}/attempt${query}`}>{detail.attemptHistory.length ? "Try this test again" : "Start practice test"} <ChevronRight aria-hidden="true" /></Link></main></div>;
}
