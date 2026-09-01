"use client";

import { ArrowLeft, ChevronRight, FolderOpen, Layers3, LockKeyhole, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import type { ResourceCatalogue, ResourceCategory } from "@/lib/resources/types";

const COURSE_OPTIONS_URL = "https://www.contractorsischool.com/contractors-license-exam";

function displayDate(value: string | null): string {
  if (!value) return "";
  const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const date = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

export function ResourcesHome() {
  const router = useRouter();
  const [data, setData] = useState<ResourceCatalogue | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/resources", { cache: "no-store", signal: controller.signal });
        const payload = (await response.json()) as { data?: ResourceCatalogue; error?: { message?: string } };
        if (response.status === 401) return router.replace("/login");
        if (!response.ok || !payload.data) throw new Error(payload.error?.message || "Unable to load resources.");
        const demoCourse = payload.data.type === "demo_resource" ? payload.data.categories[0] : null;
        if (demoCourse) return router.replace(`/resources/${encodeURIComponent(demoCourse.courseId)}`);
        setData(payload.data);
      } catch (loadError) {
        if (!controller.signal.aborted) setError(loadError instanceof Error ? loadError.message : "Unable to load resources.");
      }
    }
    void load();
    return () => controller.abort();
  }, [router]);

  const groups = useMemo(() => ({
    active: data?.categories.filter(({ status }) => status === "active") ?? [],
    unavailable: data?.categories.filter(({ status }) => status !== "active") ?? [],
  }), [data]);

  if (error) return <ResourceError message={error} />;
  if (!data) return <ResourceLoading label="Loading resource classifications" />;

  return (
    <div className="study-page resources-page">
      <header className="study-topbar">
        <Link href="/dashboard" aria-label="Back to dashboard"><ArrowLeft aria-hidden="true" /></Link>
        <div><span>Resource library</span><strong>Contractor resources</strong></div>
        <span className="reading-language-badge">CIS</span>
      </header>
      <main className="resource-main">
        <section className="resource-hero">
          <span><Layers3 aria-hidden="true" /></span>
          <div><p>Resource library</p><h1>Resources</h1><strong>Helpful links organized by your active contractor classifications.</strong></div>
          <small>{groups.active.length} available</small>
        </section>

        {groups.active.length ? (
          <section className="resource-category-section" aria-labelledby="resource-category-title">
            <header><div><p>Your classifications</p><h2 id="resource-category-title">Choose a resource collection</h2></div><span>{groups.active.length}</span></header>
            <div className="resource-category-grid">
              {groups.active.map((category) => <ActiveCategory category={category} key={category.id} />)}
            </div>
          </section>
        ) : (
          <section className="resource-empty-card">
            <Layers3 aria-hidden="true" />
            <h2>No resource collections available</h2>
            <p>Resources are included with online practice exams. To order, view the available course options or call CIS at <a href="tel:+18004257570">1-800-425-7570</a>.</p>
            <a href={COURSE_OPTIONS_URL} target="_blank" rel="noreferrer">View course options</a>
          </section>
        )}

        {groups.unavailable.length ? (
          <section className="resource-unavailable-section" aria-labelledby="unavailable-resource-title">
            <h2 id="unavailable-resource-title">Unavailable classifications</h2>
            <div>{groups.unavailable.map((category) => <UnavailableCategory category={category} key={category.id} renewal={data.renewal} />)}</div>
          </section>
        ) : null}
      </main>
    </div>
  );
}

function ActiveCategory({ category }: { category: ResourceCategory }) {
  return (
    <Link className="resource-category-card" href={`/resources/${encodeURIComponent(category.courseId)}`}>
      <span><FolderOpen aria-hidden="true" /></span>
      <div><h3>{category.title}</h3><p>Open resource collection</p></div>
      <ChevronRight aria-hidden="true" />
    </Link>
  );
}

function UnavailableCategory({ category, renewal }: { category: ResourceCategory; renewal: ResourceCatalogue["renewal"] }) {
  const expired = category.status === "expired";
  const content = (
    <>
      <span><LockKeyhole aria-hidden="true" /></span>
      <div>
        <h3>{category.title}</h3>
        <p>{expired ? `Expired${category.expirationDate ? ` ${displayDate(category.expirationDate)}` : ""}` : "Inactive"}</p>
      </div>
      {expired ? <strong>{renewal.buttons.length ? "Renew" : "View options"}</strong> : <small>Unavailable</small>}
    </>
  );
  const renewalUrl = renewal.buttons[0]?.url || COURSE_OPTIONS_URL;
  return expired
    ? <a className="resource-unavailable-card" href={renewalUrl} target="_blank" rel="noopener noreferrer">{content}</a>
    : <div className="resource-unavailable-card" aria-disabled="true">{content}</div>;
}

export function ResourceLoading({ label }: { label: string }) {
  return <main className="reading-entry-state" aria-busy="true"><span className="reading-loader" /><h1>{label}</h1><p>Checking your CIS resource access…</p></main>;
}

export function ResourceError({ message }: { message: string }) {
  return <main className="centered-state"><RefreshCw aria-hidden="true" /><h1>Resources unavailable</h1><p>{message}</p><Link className="primary-button reading-link-button" href="/dashboard">Back to dashboard</Link></main>;
}
