"use client";

import { ArrowLeft, ExternalLink, Flag, Layers3, Lightbulb, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ResourceError, ResourceLoading } from "@/components/resources-home";
import type { ResourceCollection, ResourceLink } from "@/lib/resources/types";

export function ResourceList({ classId }: { classId: string }) {
  const router = useRouter();
  const [data, setData] = useState<ResourceCollection | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`/api/resources/${encodeURIComponent(classId)}`, { cache: "no-store", signal: controller.signal });
        const payload = (await response.json()) as { data?: ResourceCollection; error?: { message?: string } };
        if (response.status === 401) return router.replace("/login");
        if (!response.ok || !payload.data) throw new Error(payload.error?.message || "Unable to load this resource collection.");
        setData(payload.data);
      } catch (loadError) {
        if (!controller.signal.aborted) setError(loadError instanceof Error ? loadError.message : "Unable to load this resource collection.");
      }
    }
    void load();
    return () => controller.abort();
  }, [classId, router]);

  if (error) return <ResourceError message={error} />;
  if (!data) return <ResourceLoading label="Loading resources" />;

  return (
    <div className="study-page resources-page">
      <header className="study-topbar">
        <Link href="/resources" aria-label="Back to resource classifications"><ArrowLeft aria-hidden="true" /></Link>
        <div><span>Resources</span><strong>{data.title}</strong></div>
        <span className="reading-language-badge">{data.resources.length}</span>
      </header>
      <main className="resource-main">
        <section className="resource-collection-hero">
          <span><Layers3 aria-hidden="true" /></span>
          <div><p>Your resource collection</p><h1>{data.title}</h1><strong>Open helpful links or let CIS know when something needs attention.</strong></div>
          <Link href={`/resources/${encodeURIComponent(classId)}/recommend`}><Plus aria-hidden="true" />Recommend a resource</Link>
        </section>

        {data.resources.length ? (
          <section className="resource-list" aria-label={`${data.title} resources`}>
            {data.resources.map((resource, index) => <ResourceCard classId={classId} index={index} key={resource.id} resource={resource} />)}
          </section>
        ) : (
          <section className="resource-empty-card compact"><Lightbulb aria-hidden="true" /><h2>No resources available</h2><p>CIS has not added any links to this collection yet.</p></section>
        )}
      </main>
    </div>
  );
}

function ResourceCard({ classId, index, resource }: { classId: string; index: number; resource: ResourceLink }) {
  return (
    <article className="resource-card">
      <span className="resource-number">{index + 1}</span>
      <div>
        {resource.url
          ? <a href={resource.url} target="_blank" rel="noreferrer"><h2>{resource.title}</h2><ExternalLink aria-hidden="true" /></a>
          : <h2>{resource.title}</h2>}
        {resource.organization ? <p>{resource.organization}</p> : null}
        <strong>{resource.description || "No description is available for this resource."}</strong>
      </div>
      <Link className="resource-report-link" href={`/resources/${encodeURIComponent(classId)}/report/${encodeURIComponent(resource.id)}`} aria-label={`Report an issue with ${resource.title}`}>
        <Flag aria-hidden="true" /><span>Report</span>
      </Link>
    </article>
  );
}
