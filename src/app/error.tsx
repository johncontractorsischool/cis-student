"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="centered-state">
      <h1>Something went wrong</h1>
      <p>ExamPrep could not load this page. Your account data was not changed.</p>
      <button className="primary-button compact" type="button" onClick={reset}>Try again</button>
    </main>
  );
}
