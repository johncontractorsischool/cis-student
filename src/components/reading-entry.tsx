"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { ReadingAccess, ReadingLanguage } from "@/lib/reading/types";

export function ReadingEntry({ language }: { language: ReadingLanguage }) {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function resolveCourse() {
      try {
        const response = await fetch(`/api/reading/entry?l=${language}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = (await response.json()) as {
          data?: ReadingAccess;
          error?: { message?: string };
        };
        if (response.status === 401) {
          router.replace("/login");
          return;
        }
        if (!response.ok || !payload.data) {
          throw new Error(payload.error?.message || "No reading course is available.");
        }
        const languageQuery = payload.data.language === "es" ? "?l=es" : "";
        router.replace(`/reading/${payload.data.classificationId}${languageQuery}`);
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(loadError instanceof Error ? loadError.message : "Unable to open your reading course.");
        }
      }
    }
    void resolveCourse();
    return () => controller.abort();
  }, [language, router]);

  if (error) {
    return (
      <main className="centered-state">
        <h1>Reading course unavailable</h1>
        <p>{error}</p>
        <button className="primary-button compact" onClick={() => router.push("/dashboard")}>Back to dashboard</button>
      </main>
    );
  }

  return (
    <main className="reading-entry-state" aria-busy="true">
      <span className="reading-loader" />
      <h1>Opening your reading course</h1>
      <p>Finding your active classification and progress…</p>
    </main>
  );
}
