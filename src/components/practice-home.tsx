"use client";

import { ArrowLeft, Check, ChevronRight, ClipboardCheck, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { PracticeIndex } from "@/lib/practice/types";
import type { StudyLanguage } from "@/lib/study/types";

export function PracticeHome({ language }: { language: StudyLanguage }) {
  const router = useRouter();
  const [data, setData] = useState<PracticeIndex | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`/api/practice${language === "es" ? "?l=es" : ""}`, { cache: "no-store", signal: controller.signal });
        const payload = (await response.json()) as { data?: PracticeIndex; error?: { message?: string } };
        if (response.status === 401) return router.replace("/login");
        if (!response.ok || !payload.data) throw new Error(payload.error?.message || "Unable to load practice tests.");
        setData(payload.data);
      } catch (loadError) {
        if (!controller.signal.aborted) setError(loadError instanceof Error ? loadError.message : "Unable to load practice tests.");
      }
    }
    void load();
    return () => controller.abort();
  }, [language, router]);

  if (error) return <main className="centered-state"><h1>Practice tests unavailable</h1><p>{error}</p><Link className="primary-button reading-link-button" href="/dashboard">Back to dashboard</Link></main>;
  if (!data) return <main className="reading-entry-state" aria-busy="true"><span className="reading-loader" /><h1>Loading practice tests</h1><p>Finding your classifications and progress…</p></main>;
  return (
    <div className="study-page">
      <header className="study-topbar"><Link href="/dashboard" aria-label="Back to dashboard"><ArrowLeft aria-hidden="true" /></Link><div><span>Study</span><strong>Practice tests</strong></div><span className="reading-language-badge">{data.language.toUpperCase()}</span></header>
      <main className="study-main practice-main">
        <section className="study-page-heading"><span><ClipboardCheck aria-hidden="true" /></span><div><p>Exam preparation</p><h1>Practice tests</h1><span>Choose a classification and continue building your score.</span></div></section>
        <section className="practice-category-list" aria-label="Practice-test classifications">
          {data.categories.map((category) => {
            const percent = category.totalCount ? Math.round((category.completedCount / category.totalCount) * 100) : 0;
            const query = category.language === "es" ? "?l=es" : "";
            const href = data.type === "demo_test"
              ? `/practice/test/${category.testCategoryId}${query}`
              : `/practice/${category.id}/${category.testCategoryId}${query}`;
            const content = <><span className={`practice-category-icon ${percent === 100 ? "complete" : ""}`}>{percent === 100 ? <Check aria-hidden="true" /> : category.expired ? <LockKeyhole aria-hidden="true" /> : <ClipboardCheck aria-hidden="true" />}</span><div><h2>{category.title}</h2><p>{category.expired ? `Expired ${category.expirationDate || ""}` : `${category.completedCount} of ${category.totalCount} tests complete`}</p><span className="course-option-progress"><i style={{ width: `${percent}%` }} /></span></div><strong>{percent}%</strong><ChevronRight aria-hidden="true" /></>;
            return category.expired ? <div className="practice-category disabled" key={category.id}>{content}</div> : <Link className="practice-category" href={href} key={category.id}>{content}</Link>;
          })}
          {!data.categories.length ? <div className="study-empty-card embedded"><ClipboardCheck aria-hidden="true" /><h2>No practice tests available</h2><p>Your account does not currently have a practice-test classification.</p></div> : null}
        </section>
      </main>
    </div>
  );
}
