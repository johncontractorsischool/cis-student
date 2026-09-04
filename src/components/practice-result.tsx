"use client";

import { Check, ChevronRight, ClipboardCheck, Home, RotateCcw, Trophy, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { PracticeQuestionTools } from "@/components/practice-question-tools";
import type { PracticeResultData, PracticeTestDetail } from "@/lib/practice/types";

type ReviewFilter = "all" | "correct" | "incorrect" | "missed";

export function PracticeResult({ testId }: { testId: string }) {
  const [result, setResult] = useState<PracticeResultData | null>(null);
  const [recentAttempt, setRecentAttempt] = useState<PracticeTestDetail | null>(null);
  const [filter, setFilter] = useState<ReviewFilter>("all");
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const stored = window.sessionStorage.getItem(`cis:practice-result:${testId}`);
    const timer = window.setTimeout(async () => {
      if (stored) {
        try { setResult(JSON.parse(stored) as PracticeResultData); } catch { /* The empty state below handles invalid session data. */ }
      } else {
        try {
          const response = await fetch(`/api/practice/test/${encodeURIComponent(testId)}`, { cache: "no-store" });
          const payload = (await response.json()) as { data?: PracticeTestDetail };
          if (response.ok && payload.data) setRecentAttempt(payload.data);
        } catch { /* The fallback below still gives the student a safe next action. */ }
      }
      setLoaded(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [testId]);
  if (!loaded) return <main className="reading-entry-state" aria-busy="true"><span className="reading-loader" /><h1>Loading your result</h1><p>Preparing your score and answer review…</p></main>;
  if (!result) {
    const latest = recentAttempt?.attemptHistory[0];
    return <main className="centered-state"><ClipboardCheck aria-hidden="true" /><h1>{latest ? `Latest score: ${latest.score}%` : "Answer review unavailable"}</h1><p>{latest ? `Your result from ${latest.date} is saved. Detailed answers are only available immediately after the attempt.` : "Your completed score remains in your attempt history even though this detailed review is no longer open."}</p><Link className="primary-button reading-link-button" href={`/practice/test/${testId}`}>View test history</Link></main>;
  }
  const passed = result.percent >= result.passingPercent;
  const visibleAnswers = result.answers.map((answer, index) => ({ answer, index })).filter(({ answer }) => filter === "all" || (filter === "correct" && answer.correct) || (filter === "incorrect" && !answer.correct && answer.answer !== null) || (filter === "missed" && answer.answer === null));
  return <div className="result-page"><main className="result-main"><section className={`result-hero ${passed ? "passed" : "review"}`}><span>{passed ? <Trophy aria-hidden="true" /> : <ClipboardCheck aria-hidden="true" />}</span><p>{result.categoryTitle}</p><h1>{passed ? "You passed!" : "Keep practicing"}</h1><strong>{result.percent}%</strong><small>{result.title} · Passing score {result.passingPercent}%</small></section><section className="result-stats"><div><strong>{result.answers.length}</strong><span>Total</span></div><div className="correct"><strong>{result.correctCount}</strong><span>Correct</span></div><div className="wrong"><strong>{result.incorrectCount}</strong><span>Incorrect</span></div><div><strong>{result.missedCount}</strong><span>Missed</span></div></section><section className="result-review"><header><div><h2>Review answers</h2><p>Focus on the questions that need another look.</p></div><div className="result-filters" role="group" aria-label="Filter answer review">{(["all", "incorrect", "missed", "correct"] as ReviewFilter[]).map((value) => <button className={filter === value ? "active" : ""} key={value} onClick={() => setFilter(value)}>{value[0].toUpperCase() + value.slice(1)}</button>)}</div></header>{visibleAnswers.map(({ answer, index }) => <details key={answer.question.id} open={filter === "incorrect" || filter === "missed"}><summary><span className={answer.correct ? "correct" : "wrong"}>{answer.correct ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}</span><strong>Question {index + 1}</strong><small>{answer.answer ? `Your answer: ${answer.answer}` : "Not answered"}</small><ChevronRight aria-hidden="true" /></summary><div><div className="practice-rich-html" dangerouslySetInnerHTML={{ __html: answer.question.html }} /><p>Your answer: <strong>{answer.answer || "Missed"}</strong> · Correct answer: <strong>{answer.question.correctAnswer}</strong></p>{answer.question.explanationHtml ? <div className="practice-rich-html result-explanation" dangerouslySetInnerHTML={{ __html: answer.question.explanationHtml }} /> : null}<PracticeQuestionTools feedbackEnabled={result.questionFeedbackEnabled === true} language={result.language === "es" ? "es" : "en"} questionId={answer.question.id} showVideo testId={result.testId} videoExplanationId={answer.question.videoExplanationId} /></div></details>)}{!visibleAnswers.length ? <p className="result-empty-filter">No answers match this filter.</p> : null}</section><nav className="result-actions">{result.incorrectCount || result.missedCount ? <button onClick={() => setFilter(result.incorrectCount ? "incorrect" : "missed")}><ClipboardCheck aria-hidden="true" />Review weak answers</button> : null}<Link href={`/practice/test/${testId}${result.language === "es" ? "?l=es" : ""}`}><RotateCcw aria-hidden="true" />Try again</Link><Link className="primary" href="/dashboard"><Home aria-hidden="true" />Back to dashboard</Link></nav></main></div>;
}
