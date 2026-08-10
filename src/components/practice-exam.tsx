"use client";

import { ArrowLeft, Check, ChevronRight, Clock3, Flag, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import type { PracticeAnswer, PracticeResultData, PracticeTestDetail } from "@/lib/practice/types";
import type { StudyLanguage } from "@/lib/study/types";

type SavedAttempt = {
  index: number;
  remaining: number;
  selections: Record<string, PracticeAnswer["key"]>;
  submitted: Record<string, boolean>;
};

function clock(seconds: number): string {
  const value = Math.max(0, seconds);
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const secs = value % 60;
  return [hours, minutes, secs].map((part) => String(part).padStart(2, "0")).join(":");
}

export function PracticeExam({ language, testId }: { language: StudyLanguage; testId: string }) {
  const router = useRouter();
  const [detail, setDetail] = useState<PracticeTestDetail | null>(null);
  const [error, setError] = useState("");
  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [selections, setSelections] = useState<Record<string, PracticeAnswer["key"]>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const [resume, setResume] = useState<SavedAttempt | null>(null);
  const [started, setStarted] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const finishRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`/api/practice/test/${encodeURIComponent(testId)}${language === "es" ? "?l=es" : ""}`, { cache: "no-store", signal: controller.signal });
        const payload = (await response.json()) as { data?: PracticeTestDetail; error?: { message?: string } };
        if (response.status === 401) return router.replace("/login");
        if (!response.ok || !payload.data) throw new Error(payload.error?.message || "Unable to load this test.");
        if (!payload.data.questions.length) throw new Error("This test does not contain any questions.");
        setDetail(payload.data);
        const saved = window.sessionStorage.getItem(payload.data.attemptKey);
        if (saved) {
          try { setResume(JSON.parse(saved) as SavedAttempt); return; } catch { window.sessionStorage.removeItem(payload.data.attemptKey); }
        }
        setRemaining(payload.data.timeLimitSeconds);
        setStarted(true);
      } catch (loadError) { if (!controller.signal.aborted) setError(loadError instanceof Error ? loadError.message : "Unable to load this test."); }
    }
    void load(); return () => controller.abort();
  }, [language, router, testId]);

  const finish = useCallback(async () => {
    if (!detail || finishing) return;
    setFinishing(true);
    const answers = detail.questions.map((question) => {
      const answer = selections[question.id] || null;
      return { answer, correct: answer === question.correctAnswer, question };
    });
    const correctCount = answers.filter((answer) => answer.correct).length;
    const missedCount = answers.filter((answer) => answer.answer === null).length;
    const incorrectCount = answers.length - correctCount - missedCount;
    const percent = Number(((correctCount / answers.length) * 100).toFixed(2));
    const result: PracticeResultData = { answers, categoryTitle: detail.categoryTitle, correctCount, incorrectCount, missedCount, passingPercent: detail.passingPercent, percent, testId: detail.id, title: detail.title };
    try {
      const response = await fetch(`/api/practice/test/${encodeURIComponent(detail.id)}/result`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ score: percent }) });
      const payload = (await response.json()) as { error?: { message?: string } };
      if (!response.ok) throw new Error(payload.error?.message || "Unable to save your result.");
      window.sessionStorage.removeItem(detail.attemptKey);
      window.sessionStorage.setItem(`cis:practice-result:${detail.id}`, JSON.stringify(result));
      router.replace(`/practice/test/${detail.id}/result${detail.language === "es" ? "?l=es" : ""}`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save your result.");
      setFinishing(false);
    }
  }, [detail, finishing, router, selections]);

  useEffect(() => { finishRef.current = () => void finish(); }, [finish]);
  useEffect(() => {
    if (!started || finishing || remaining <= 0) return;
    const timer = window.setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [finishing, remaining, started]);
  useEffect(() => { if (started && remaining === 0 && detail) finishRef.current(); }, [detail, remaining, started]);
  useEffect(() => {
    if (!detail || !started || finishing) return;
    window.sessionStorage.setItem(detail.attemptKey, JSON.stringify({ index, remaining, selections, submitted } satisfies SavedAttempt));
  }, [detail, finishing, index, remaining, selections, started, submitted]);
  useEffect(() => {
    if (!started || finishing) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [finishing, started]);

  function resumeAttempt() {
    if (!resume || !detail) return;
    setIndex(Math.max(0, Math.min(resume.index, detail.questions.length - 1)));
    setRemaining(Math.max(1, resume.remaining));
    setSelections(resume.selections || {});
    setSubmitted(resume.submitted || {});
    setResume(null);
    setStarted(true);
  }

  function discardAttempt() {
    if (!detail) return;
    window.sessionStorage.removeItem(detail.attemptKey);
    setIndex(0); setRemaining(detail.timeLimitSeconds); setSelections({}); setSubmitted({}); setResume(null); setStarted(true);
  }

  if (error && !detail) return <main className="centered-state"><h1>Test unavailable</h1><p>{error}</p><button className="primary-button compact" onClick={() => router.push("/practice")}>Back to practice tests</button></main>;
  if (!detail) return <main className="reading-entry-state" aria-busy="true"><span className="reading-loader" /><h1>Preparing your test</h1><p>Loading questions securely…</p></main>;
  if (resume && !started) return <main className="resume-attempt"><div><Clock3 aria-hidden="true" /><p>Saved attempt found</p><h1>Continue where you left off?</h1><span>Your answers and remaining time are saved for this browser session.</span><button onClick={resumeAttempt}>Resume test</button><button className="secondary" onClick={discardAttempt}>Start over</button></div></main>;

  const question = detail.questions[index];
  const chosen = selections[question.id];
  const isSubmitted = Boolean(submitted[question.id]);
  const percent = Math.round(((index + 1) / detail.questions.length) * 100);
  return (
    <div className="exam-page">
      <header className="exam-topbar"><button aria-label="End test" onClick={() => { if (window.confirm("End this test and score the answers completed so far?")) void finish(); }}><ArrowLeft aria-hidden="true" /></button><div><span>{detail.title}</span><strong>Question {index + 1} of {detail.questions.length}</strong></div><p><Clock3 aria-hidden="true" />{clock(remaining)}</p></header>
      <div className="exam-progress"><span style={{ width: `${percent}%` }} /></div>
      <main className="exam-main">
        <section className="exam-question-card">
          <header><span>Question {index + 1}</span><button onClick={() => { if (window.confirm("End this test now?")) void finish(); }}><Flag aria-hidden="true" />End test</button></header>
          <div className="practice-rich-html exam-question" dangerouslySetInnerHTML={{ __html: question.html }} />
          <div className="exam-answers" role="radiogroup" aria-label="Answer choices">
            {question.answers.map((answer) => {
              const selected = chosen === answer.key;
              const correct = isSubmitted && answer.key === question.correctAnswer;
              const wrong = isSubmitted && selected && !correct;
              return <button className={`${selected ? "selected" : ""} ${correct ? "correct" : ""} ${wrong ? "wrong" : ""}`} disabled={isSubmitted} key={answer.key} onClick={() => setSelections((current) => ({ ...current, [question.id]: answer.key }))} role="radio" aria-checked={selected}><span>{correct ? <Check aria-hidden="true" /> : wrong ? <X aria-hidden="true" /> : answer.key}</span><span className="practice-rich-html" dangerouslySetInnerHTML={{ __html: answer.html }} /></button>;
            })}
          </div>
          {isSubmitted ? <div className={`exam-feedback ${chosen === question.correctAnswer ? "correct" : "wrong"}`}><strong>{chosen === question.correctAnswer ? "Correct" : `The correct answer is ${question.correctAnswer}`}</strong>{question.explanationHtml ? <div className="practice-rich-html" dangerouslySetInnerHTML={{ __html: question.explanationHtml }} /> : <p>Continue to the next question when you’re ready.</p>}</div> : null}
          {error ? <p className="player-error">{error}</p> : null}
          <footer>
            {!isSubmitted ? <button className="exam-primary-action" disabled={!chosen || finishing} onClick={() => setSubmitted((current) => ({ ...current, [question.id]: true }))}>Submit answer</button> : index < detail.questions.length - 1 ? <button className="exam-primary-action" onClick={() => setIndex((value) => value + 1)}>Next question <ChevronRight aria-hidden="true" /></button> : <button className="exam-primary-action" disabled={finishing} onClick={() => void finish()}>{finishing ? "Saving result…" : "Finish test"}<ChevronRight aria-hidden="true" /></button>}
          </footer>
        </section>
      </main>
    </div>
  );
}
