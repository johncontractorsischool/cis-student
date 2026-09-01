import Link from "next/link";

export default function NotFound() {
  return (
    <main className="centered-state">
      <h1>Page not found</h1>
      <p>The page you requested is not part of the ExamPrep MVP.</p>
      <Link className="primary-button reading-link-button" href="/">Return to ExamPrep</Link>
    </main>
  );
}
