"use client";

import { ArrowLeft, Check, ChevronRight, ClipboardList } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { PracticeTestList as PracticeTestListData, PracticeTestSummary } from "@/lib/practice/types";
import type { StudyLanguage } from "@/lib/study/types";

export function PracticeTestList({ categoryId, classId, language }: { categoryId: string; classId: string; language: StudyLanguage }) {
  const router = useRouter();
  const [data, setData] = useState<PracticeTestListData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`/api/practice/${encodeURIComponent(classId)}/${encodeURIComponent(categoryId)}${language === "es" ? "?l=es" : ""}`, { cache: "no-store", signal: controller.signal });
        const payload = (await response.json()) as { data?: PracticeTestListData; error?: { message?: string } };
        if (response.status === 401) return router.replace("/login");
        if (!response.ok || !payload.data) throw new Error(payload.error?.message || "Unable to load these tests.");
        setData(payload.data);
      } catch (loadError) {
        if (!controller.signal.aborted) setError(loadError instanceof Error ? loadError.message : "Unable to load these tests.");
      }
    }
    void load();
    return () => controller.abort();
  }, [categoryId, classId, language, router]);

  if (error) return <main className="centered-state"><h1>Tests unavailable</h1><p>{error}</p><Link className="primary-button reading-link-button" href="/practice">Back to practice tests</Link></main>;
  if (!data) return <main className="reading-entry-state" aria-busy="true"><span className="reading-loader" /><h1>Loading exams</h1><p>Checking scores and previous attempts…</p></main>;
  const query = data.language === "es" ? "?l=es" : "";

  return (
    <div className="study-page"><header className="study-topbar"><Link href={`/practice${query}`} aria-label="Back to practice categories"><ArrowLeft aria-hidden="true" /></Link><div><span>Practice tests</span><strong>{data.categoryTitle}</strong></div><span className="reading-language-badge">{data.language.toUpperCase()}</span></header><main className="study-main practice-main"><section className="study-page-heading"><span><ClipboardList aria-hidden="true" /></span><div><p>Classification</p><h1>{data.categoryTitle}</h1><span>Select an exam to review the guidelines and begin.</span></div></section><TestGroup label="Practice exams" tests={data.tests} query={query} />{data.safetyTests.length ? <TestGroup label="Safety review" tests={data.safetyTests} query={query} /> : null}</main></div>
  );
}

function TestGroup({ label, query, tests }: { label: string; query: string; tests: PracticeTestSummary[] }) {
  return <section className="practice-test-group"><div className="course-section-heading"><div><p>Exam set</p><h2>{label}</h2></div><span>{tests.length}</span></div><div>{tests.map((test) => <Link href={`/practice/test/${test.id}${query}`} className="practice-test-row" key={test.id}><span className={test.completed ? "complete" : ""}>{test.completed ? <Check aria-hidden="true" /> : <ClipboardList aria-hidden="true" />}</span><div><h3>{test.title}</h3><p>{test.lastAttemptScore == null ? "Not attempted" : `Last attempt: ${test.lastAttemptScore}%`}</p></div>{test.lastAttemptScore != null ? <strong className={test.lastAttemptScore >= 80 ? "passing" : ""}>{test.lastAttemptScore}%</strong> : null}<ChevronRight aria-hidden="true" /></Link>)}{!tests.length ? <p className="practice-no-tests">No tests were found in this classification.</p> : null}</div></section>;
}
