"use client";

import { ArrowLeft, CheckCircle2, ExternalLink, Flag, Lightbulb } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import type { ResourceCollection, ResourceLink } from "@/lib/resources/types";
import { RESOURCE_REPORT_ISSUES } from "@/lib/resources/types";

type FeedbackMode = "recommend" | "report";

export function ResourceFeedbackForm({ classId, linkId, mode }: { classId: string; linkId?: string; mode: FeedbackMode }) {
  const router = useRouter();
  const [link, setLink] = useState("");
  const [issue, setIssue] = useState("");
  const [comment, setComment] = useState("");
  const [resource, setResource] = useState<ResourceLink | null>(null);
  const [loadingResource, setLoadingResource] = useState(mode === "report");
  const [state, setState] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (mode !== "report" || !linkId) return;
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`/api/resources/${encodeURIComponent(classId)}`, { cache: "no-store", signal: controller.signal });
        const payload = (await response.json()) as { data?: ResourceCollection; error?: { message?: string } };
        if (response.status === 401) return router.replace("/login");
        if (!response.ok || !payload.data) throw new Error(payload.error?.message || "Unable to load this resource.");
        const selected = payload.data.resources.find(({ id }) => id === linkId);
        if (!selected) throw new Error("This resource is no longer available.");
        setResource(selected);
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setState("error");
          setMessage(loadError instanceof Error ? loadError.message : "Unable to load this resource.");
        }
      } finally {
        if (!controller.signal.aborted) setLoadingResource(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [classId, linkId, mode, router]);

  const canSubmit = mode === "recommend" ? Boolean(link.trim()) : Boolean(issue && resource);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || state === "saving") return;
    setState("saving");
    setMessage("");

    const endpoint = mode === "recommend"
      ? `/api/resources/${encodeURIComponent(classId)}/recommend`
      : `/api/resources/${encodeURIComponent(classId)}/report/${encodeURIComponent(String(linkId))}`;
    const body = mode === "recommend" ? { link, comment } : { issue, comment };
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as { error?: { message?: string }; message?: string };
      if (response.status === 401) return router.replace("/login");
      if (!response.ok) throw new Error(payload.error?.message || "Unable to submit this form.");
      setState("success");
      setMessage(payload.message || (mode === "recommend" ? "Resource recommendation submitted." : "Resource report submitted."));
    } catch (submitError) {
      setState("error");
      setMessage(submitError instanceof Error ? submitError.message : "Unable to submit this form.");
    }
  }

  const title = mode === "recommend" ? "Recommend a resource" : "Report a resource";
  const Icon = mode === "recommend" ? Lightbulb : Flag;
  return (
    <div className="study-page resources-page">
      <header className="study-topbar">
        <Link href={`/resources/${encodeURIComponent(classId)}`} aria-label="Back to resources"><ArrowLeft aria-hidden="true" /></Link>
        <div><span>Resources</span><strong>{title}</strong></div>
        <span className="reading-language-badge">CIS</span>
      </header>
      <main className="resource-form-main">
        <section className="resource-form-heading"><span><Icon aria-hidden="true" /></span><div><p>Help improve the library</p><h1>{title}</h1><strong>{mode === "recommend" ? "Share a useful link with CIS for review." : "Tell CIS what is wrong with this link."}</strong></div></section>

        {state === "success" ? (
          <section className="resource-form-success"><CheckCircle2 aria-hidden="true" /><h2>Thank you</h2><p>{message}</p><Link href={`/resources/${encodeURIComponent(classId)}`}>Back to resources</Link></section>
        ) : (
          <form className="resource-feedback-form" onSubmit={submit}>
            {mode === "report" ? (
              loadingResource ? <p className="resource-form-loading">Loading resource…</p> : resource ? (
                <article className="resource-report-preview">
                  <div><h2>{resource.title}</h2>{resource.organization ? <p>{resource.organization}</p> : null}</div>
                  {resource.url ? <a href={resource.url} target="_blank" rel="noreferrer">Open link <ExternalLink aria-hidden="true" /></a> : null}
                </article>
              ) : null
            ) : null}

            {mode === "recommend" ? (
              <label><span>Resource link</span><input type="url" required maxLength={2048} placeholder="https://example.com/resource" value={link} onChange={(event) => setLink(event.target.value)} /></label>
            ) : (
              <label><span>What is the issue?</span><select required value={issue} onChange={(event) => setIssue(event.target.value)}><option value="">Select an issue</option>{RESOURCE_REPORT_ISSUES.map((choice) => <option key={choice} value={choice}>{choice}</option>)}</select></label>
            )}
            <label><span>Comment <small>Optional</small></span><textarea maxLength={2000} rows={5} placeholder="Add any details that would help our team." value={comment} onChange={(event) => setComment(event.target.value)} /></label>
            <button type="submit" disabled={!canSubmit || state === "saving" || loadingResource}>{state === "saving" ? "Submitting…" : "Submit"}</button>
            {state === "error" && message ? <p className="resource-form-error" role="alert">{message}</p> : null}
          </form>
        )}
      </main>
    </div>
  );
}
