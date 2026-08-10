"use client";

import {
  BarChart3,
  BookOpen,
  CalendarCheck2,
  ChevronDown,
  Clock3,
  FileText,
  MessageSquareText,
  Trophy,
} from "lucide-react";
import { useCallback, useEffect, useState, type SyntheticEvent } from "react";

import { CslbApplicationProgressPanel } from "@/components/cslb-application-progress";
import { ExamDateEditor } from "@/components/exam-date-editor";
import type { DashboardPayload } from "@/lib/dashboard/types";
import { checklistMap, emptyChecklist } from "@/lib/iapplication/checklist";
import {
  effectiveExamSchedule,
  type LegacyExamDates,
} from "@/lib/iapplication/exam-schedule";
import {
  applicationsFrom,
  journeyPhases,
  packetTitle,
} from "@/lib/iapplication/presentation";
import type {
  IApplicationDashboardData,
  IApplicationChecklist,
  IApplicationChecklistCollection,
  IApplicationChecklistKey,
  IApplicationFeedback,
  IApplicationExamSchedule,
  IApplicationTimeline,
} from "@/lib/iapplication/types";

const phaseIcons = [FileText, BookOpen, CalendarCheck2, BarChart3, Trophy];
const phaseColors = ["orange", "purple", "green", "blue", "purple"];

function combinedStudy(data: DashboardPayload["studyProgress"]) {
  const groups = [data?.law?.exams, data?.trade?.exams, data?.law?.videos, data?.trade?.videos];
  return groups.reduce<{ completed: number; total: number }>(
    (total, group) => ({
      completed: total.completed + Number(group?.completed || 0),
      total: total.total + Number(group?.total || 0),
    }),
    { completed: 0, total: 0 },
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

async function getResource<T>(path: string): Promise<T> {
  const response = await fetch(path, { cache: "no-store" });
  const payload = (await response.json()) as { data?: T; error?: { message?: string } };
  if (!response.ok || !payload.data) {
    throw new Error(payload.error?.message || "Unable to load this information.");
  }
  return payload.data;
}

export function IApplicationJourney({
  checklists,
  data,
  legacyExamDates,
  studyProgress,
}: {
  checklists: IApplicationChecklistCollection | null;
  data: IApplicationDashboardData;
  legacyExamDates?: LegacyExamDates;
  studyProgress: DashboardPayload["studyProgress"];
}) {
  const applications = applicationsFrom(data);
  const applicationIds = applications.map((application) => String(application.id)).join("|");
  const study = combinedStudy(studyProgress);
  const [timeline, setTimeline] = useState<IApplicationTimeline | null>(null);
  const [feedback, setFeedback] = useState<IApplicationFeedback | null>(null);
  const [timelineState, setTimelineState] = useState<"idle" | "loading" | "error">("idle");
  const [feedbackState, setFeedbackState] = useState<"idle" | "loading" | "error">("idle");
  const [applicationChecklists, setApplicationChecklists] = useState(() => checklistMap(checklists));
  const [savingChecklistItems, setSavingChecklistItems] = useState<Record<string, IApplicationChecklistKey[]>>({});
  const [checklistErrors, setChecklistErrors] = useState<Record<string, string>>({});
  const [examSchedules, setExamSchedules] = useState<Record<string, IApplicationExamSchedule>>(
    () => Object.fromEntries(applications.flatMap((application) => (
      application.exam_schedule
        ? [[String(application.id), application.exam_schedule]]
        : []
    ))),
  );
  const [expandedJourneyRows, setExpandedJourneyRows] = useState<Set<string>>(
    () => {
      const rows = applications.map((application) => `${application.id}:CSLB Application`);
      data.actionCenter?.applications.forEach((entry) => {
        if (entry.action?.code === "SCHEDULE_EXAMS") {
          rows.push(`${entry.application_id}:Schedule & Pass Exams`);
        }
      });
      return new Set(rows);
    },
  );

  useEffect(() => {
    setApplicationChecklists(checklistMap(checklists));
  }, [checklists]);

  useEffect(() => {
    const currentApplicationIds = applicationIds ? applicationIds.split("|") : [];
    setExpandedJourneyRows((current) => {
      const next = new Set(current);
      currentApplicationIds.forEach((applicationId) => next.add(`${applicationId}:CSLB Application`));
      return next.size === current.size ? current : next;
    });
  }, [applicationIds]);

  const loadTimeline = useCallback(async () => {
    if (timeline || timelineState === "loading") return;
    setTimelineState("loading");
    try {
      setTimeline(await getResource<IApplicationTimeline>("/api/dashboard/iapplication/timeline"));
      setTimelineState("idle");
    } catch {
      setTimelineState("error");
    }
  }, [timeline, timelineState]);

  const loadFeedback = useCallback(async () => {
    if (feedback || feedbackState === "loading") return;
    setFeedbackState("loading");
    try {
      setFeedback(await getResource<IApplicationFeedback>("/api/dashboard/iapplication/feedback"));
      setFeedbackState("idle");
    } catch {
      setFeedbackState("error");
    }
  }, [feedback, feedbackState]);

  function onTimelineToggle(event: SyntheticEvent<HTMLDetailsElement>) {
    if (event.currentTarget.open) void loadTimeline();
  }

  const updateChecklist = useCallback(async (
    applicationId: number | string,
    item: IApplicationChecklistKey,
    completed: boolean,
  ) => {
    const id = String(applicationId);
    const previousValue = applicationChecklists[id]?.items[item] ?? false;
    const currentChecklist = applicationChecklists[id] ?? emptyChecklist(id);

    setApplicationChecklists((current) => ({
      ...current,
      [id]: {
        ...(current[id] ?? currentChecklist),
        items: { ...(current[id] ?? currentChecklist).items, [item]: completed },
      },
    }));
    setSavingChecklistItems((current) => ({
      ...current,
      [id]: [...new Set([...(current[id] ?? []), item])],
    }));
    setChecklistErrors((current) => ({ ...current, [id]: "" }));

    try {
      const response = await fetch(
        `/api/dashboard/iapplication/checklist/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ item, completed }),
        },
      );
      const payload = (await response.json()) as {
        data?: IApplicationChecklist;
        error?: { message?: string };
      };
      if (!response.ok || !payload.data) {
        throw new Error(payload.error?.message || "Unable to save this checklist item.");
      }

      setApplicationChecklists((current) => {
        const latest = current[id] ?? emptyChecklist(id);
        return {
          ...current,
          [id]: {
            ...latest,
            updated_at: payload.data?.updated_at ?? latest.updated_at,
            items: {
              ...latest.items,
              [item]: payload.data?.items[item] ?? completed,
            },
          },
        };
      });
    } catch (error) {
      setApplicationChecklists((current) => {
        const latest = current[id] ?? emptyChecklist(id);
        return {
          ...current,
          [id]: {
            ...latest,
            items: { ...latest.items, [item]: previousValue },
          },
        };
      });
      setChecklistErrors((current) => ({
        ...current,
        [id]: error instanceof Error ? error.message : "Unable to save this checklist item.",
      }));
    } finally {
      setSavingChecklistItems((current) => ({
        ...current,
        [id]: (current[id] ?? []).filter((key) => key !== item),
      }));
    }
  }, [applicationChecklists]);

  if (!applications.length) return null;

  return (
    <section className="journey-section iapplication-journey" aria-labelledby="journey-title">
      <h2 id="journey-title">Your licensing journey</h2>
      <div className="iapplication-list">
        {applications.map((application, applicationIndex) => {
          const sourceExamSchedule = examSchedules[String(application.id)] ?? application.exam_schedule;
          const currentExamSchedule = effectiveExamSchedule(
            sourceExamSchedule,
            legacyExamDates,
            applications.length,
          );
          const presentedApplication = currentExamSchedule
            ? { ...application, exam_schedule: currentExamSchedule }
            : application;
          const phases = journeyPhases(presentedApplication, study);
          const applicationFeedback = feedback?.feedback.filter(
            (item) => String(item.application_id) === String(application.id),
          );
          const applicationEvents = timeline?.events.filter(
            (event) => String(event.application_id) === String(application.id),
          );
          const applicationAction = data.actionCenter?.applications.find(
            (entry) => String(entry.application_id) === String(application.id),
          )?.action;
          const feedbackContent = application.corrections?.required ? (
            <div className="feedback-panel">
              <button type="button" onClick={() => void loadFeedback()} disabled={feedbackState === "loading"}>
                <MessageSquareText aria-hidden="true" />
                {feedbackState === "loading" ? "Loading feedback…" : "View shared feedback"}
              </button>
              {feedbackState === "error" ? <p>Shared feedback is temporarily unavailable.</p> : null}
              {applicationFeedback ? (
                applicationFeedback.length ? (
                  <ul className="feedback-list">
                    {applicationFeedback.map((item) => (
                      <li key={String(item.id)}>
                        <strong>{item.author_name || item.author_role || "CIS team"}</strong>
                        <span>{item.body}</span>
                      </li>
                    ))}
                  </ul>
                ) : <p>No shared feedback is available.</p>
              ) : null}
            </div>
          ) : null;

          return (
            <article className="iapplication-card dashboard-surface" key={String(application.id)}>
              <header className="iapplication-card-header">
                <div>
                  <p>Application {applicationIndex + 1}</p>
                  <h3>{packetTitle(application)}</h3>
                  <span>Updated {application.updated_at ? formatDate(application.updated_at) : "recently"}</span>
                </div>
                <div className="iapplication-card-summary">
                  <strong>{Math.max(0, Math.min(100, Number(application.form_progress?.percent_complete || 0)))}%</strong>
                  <span>form complete</span>
                </div>
              </header>

              {applicationAction ? (
                <p className={`application-owner owner-${applicationAction.owner.toLowerCase()}`}>
                  {applicationAction.owner === "STUDENT" ? "Your action" : `${applicationAction.owner} step`}: {applicationAction.title}
                </p>
              ) : null}

              <div className="journey-list">
                {phases.map((phase, index) => {
                  const Icon = phaseIcons[index];
                  const rowKey = `${application.id}:${phase.title}`;
                  return (
                    <details
                      className={`journey-row ${index === 0 ? "cslb-journey-row" : ""}`}
                      key={phase.title}
                      open={expandedJourneyRows.has(rowKey)}
                      onToggle={(event) => {
                        const isOpen = event.currentTarget.open;
                        setExpandedJourneyRows((current) => {
                          if (current.has(rowKey) === isOpen) return current;
                          const next = new Set(current);
                          if (isOpen) next.add(rowKey);
                          else next.delete(rowKey);
                          return next;
                        });
                      }}
                    >
                      <summary>
                        <span className={`journey-row-icon ${phaseColors[index]}`}><Icon aria-hidden="true" /></span>
                        <strong>{phase.title}</strong>
                        <span className={`journey-status ${phase.status}`}>{phase.statusLabel}</span>
                        <ChevronDown className="journey-chevron" aria-hidden="true" />
                      </summary>
                      <div className="journey-row-detail">
                        {index === 0 ? (
                          <CslbApplicationProgressPanel
                            action={applicationAction}
                            application={application}
                            checklist={applicationChecklists[String(application.id)] ?? emptyChecklist(application.id)}
                            checklistAvailable={checklists !== null}
                            checklistError={checklistErrors[String(application.id)]}
                            feedback={feedbackContent}
                            onChecklistChange={(item, completed) => void updateChecklist(application.id, item, completed)}
                            savingItems={new Set(savingChecklistItems[String(application.id)] ?? [])}
                          />
                        ) : index === 2 ? (
                          <ExamDateEditor
                            applicationId={application.id}
                            schedule={currentExamSchedule}
                            onSaved={(schedule) => setExamSchedules((current) => ({
                              ...current,
                              [String(application.id)]: schedule,
                            }))}
                          />
                        ) : <ul>{phase.details.map((detail) => <li key={detail}>{detail}</li>)}</ul>}
                      </div>
                    </details>
                  );
                })}
              </div>

              <details className="application-activity" onToggle={onTimelineToggle}>
                <summary><Clock3 aria-hidden="true" />Recent application activity<ChevronDown aria-hidden="true" /></summary>
                <div>
                  {timelineState === "loading" ? <p>Loading activity…</p> : null}
                  {timelineState === "error" ? <p>Activity is temporarily unavailable.</p> : null}
                  {applicationEvents ? (
                    applicationEvents.length ? (
                      <ol>{applicationEvents.map((event, index) => (
                        <li key={`${event.type}-${event.occurred_at}-${index}`}>
                          <span>{formatDate(event.occurred_at)}</span>
                          <strong>{event.label}</strong>
                        </li>
                      ))}</ol>
                    ) : <p>No application activity is available yet.</p>
                  ) : null}
                </div>
              </details>
            </article>
          );
        })}
      </div>
    </section>
  );
}
