"use client";

import { BookOpen, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { learningAreaForPathname, type LearningArea } from "@/lib/learning-navigation";

const AREA_LABELS: Record<LearningArea, string> = {
  audio: "Audio Course",
  practice: "Practice Tests",
  reading: "Reading Course",
  video: "Video Course",
};

export function LearningNavigation() {
  const pathname = usePathname();
  const area = learningAreaForPathname(pathname);
  if (!area) return null;

  return (
    <header className="learning-nav">
      <div className="learning-nav-inner">
        <Link className="learning-nav-brand" href="/dashboard" aria-label="ExamPrep dashboard">
          <span><BookOpen aria-hidden="true" /></span>
          <strong>ExamPrep</strong>
        </Link>
        <p>{AREA_LABELS[area]}</p>
        <Link className="learning-nav-dashboard" href="/dashboard">
          <LayoutDashboard aria-hidden="true" />
          <span>Dashboard</span>
        </Link>
      </div>
    </header>
  );
}
