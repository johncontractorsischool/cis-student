import Link from "next/link";

export function LegalPage({
  description,
  externalUrl,
  title,
}: {
  description: string;
  externalUrl: string;
  title: string;
}) {
  return (
    <main className="legal-page">
      <article>
        <p className="eyebrow">Contractors Intelligence School</p>
        <h1>{title}</h1>
        <p>{description}</p>
        <p>The official policy is maintained on the CIS website so students always receive the current version.</p>
        <a className="primary-button" href={externalUrl} target="_blank" rel="noopener noreferrer">Read the official {title.toLowerCase()}</a>
        <Link href="/login">Return to sign in</Link>
      </article>
    </main>
  );
}
