"use client";

import { Check, ChevronRight, ClipboardCheck, Home, RotateCcw, Trophy, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import type { PracticeResultData } from "@/lib/practice/types";

export function PracticeResult({ testId }: { testId: string }) {
  const [result, setResult] = useState<PracticeResultData | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const stored = window.sessionStorage.getItem(`cis:practice-result:${testId}`);
    const timer = window.setTimeout(() => {
      if (stored) {
        try { setResult(JSON.parse(stored) as PracticeResultData); } catch { /* The empty state below handles invalid session data. */ }
      }
      setLoaded(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [testId]);
  if (!loaded) return <main className="reading-entry-state" aria-busy="true"><span className="reading-loader" /><h1>Loading your result</h1><p>Preparing your score and answer review…</p></main>;
  if (!result) return <main className="centered-state"><h1>Result unavailable</h1><p>This result is no longer stored in this browser session.</p><Link className="primary-button reading-link-button" href={`/practice/test/${testId}`}>Return to test</Link></main>;
  const passed = result.percent >= result.passingPercent;
  return <div className="result-page"><main className="result-main"><section className={`result-hero ${passed ? "passed" : "review"}`}><span>{passed ? <Trophy aria-hidden="true" /> : <ClipboardCheck aria-hidden="true" />}</span><p>{result.categoryTitle}</p><h1>{passed ? "You passed!" : "Keep practicing"}</h1><strong>{result.percent}%</strong><small>{result.title} · Passing score {result.passingPercent}%</small></section><section className="result-stats"><div><strong>{result.answers.length}</strong><span>Total</span></div><div className="correct"><strong>{result.correctCount}</strong><span>Correct</span></div><div className="wrong"><strong>{result.incorrectCount}</strong><span>Incorrect</span></div><div><strong>{result.missedCount}</strong><span>Missed</span></div></section><section className="result-review"><h2>Review answers</h2>{result.answers.map((answer, index) => <details key={answer.question.id}><summary><span className={answer.correct ? "correct" : "wrong"}>{answer.correct ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}</span><strong>Question {index + 1}</strong><small>{answer.answer ? `Your answer: ${answer.answer}` : "Not answered"}</small><ChevronRight aria-hidden="true" /></summary><div><div className="practice-rich-html" dangerouslySetInnerHTML={{ __html: answer.question.html }} /><p>Your answer: <strong>{answer.answer || "Missed"}</strong> · Correct answer: <strong>{answer.question.correctAnswer}</strong></p>{answer.question.explanationHtml ? <div className="practice-rich-html result-explanation" dangerouslySetInnerHTML={{ __html: answer.question.explanationHtml }} /> : null}</div></details>)}</section><nav className="result-actions"><Link href={`/practice/test/${testId}`}><RotateCcw aria-hidden="true" />Try again</Link><Link className="primary" href="/dashboard"><Home aria-hidden="true" />Back to dashboard</Link></nav></main></div>;
}
