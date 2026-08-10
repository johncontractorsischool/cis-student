"use client";

import { AlertCircle, Check, ChevronDown } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import { cslbApplicationProgress } from "@/lib/iapplication/presentation";
import {
  IAPPLICATION_CHECKLIST_KEYS,
  type IApplicationAction,
  type IApplicationApplication,
  type IApplicationChecklist,
  type IApplicationChecklistKey,
} from "@/lib/iapplication/types";

const CHECKLIST_GROUPS: Array<{
  label: string;
  items: Array<{ key: IApplicationChecklistKey; label: string }>;
}> = [
  {
    label: "Required signatures",
    items: [
      { key: "applicant_signature", label: "Applicant signature on all required pages" },
      { key: "qualifier_signature", label: "Qualifier signature and certification" },
      { key: "notary_acknowledgment", label: "Notary acknowledgment where required" },
      { key: "officer_partner_signatures", label: "Officer or partner signatures, if applicable" },
    ],
  },
  {
    label: "Mailing readiness",
    items: [
      { key: "records_copy", label: "Make a full copy for your records" },
      { key: "supporting_documents", label: "Include all required supporting documents" },
      { key: "application_fee_payment", label: "Attach the application fee payment" },
      { key: "certified_mail", label: "Send by certified mail to CSLB" },
    ],
  },
];

const OWNER_LABELS = {
  CIS: "CIS is working",
  CSLB: "Waiting on CSLB",
  NONE: "Complete",
  STUDENT: "Your action",
} as const;

export function CslbApplicationProgressPanel({
  action,
  application,
  checklist,
  checklistAvailable,
  checklistError,
  feedback,
  onChecklistChange,
  savingItems,
}: {
  action: IApplicationAction | null | undefined;
  application: IApplicationApplication;
  checklist: IApplicationChecklist;
  checklistAvailable: boolean;
  checklistError?: string;
  feedback?: ReactNode;
  onChecklistChange: (key: IApplicationChecklistKey, completed: boolean) => void;
  savingItems: Set<IApplicationChecklistKey>;
}) {
  const progress = useMemo(
    () => cslbApplicationProgress(application, action),
    [action, application],
  );
  const activeMilestoneId =
    progress.milestones.find((milestone) => milestone.status === "action-required")?.id ||
    progress.milestones.find((milestone) => milestone.status === "in-progress")?.id ||
    progress.milestones.find((milestone) => milestone.status === "not-started")?.id ||
    "posting";
  const [expanded, setExpanded] = useState(() => new Set([activeMilestoneId]));

  const readyCount = IAPPLICATION_CHECKLIST_KEYS.filter(
    (key) => checklist.items[key],
  ).length;

  return (
    <div className="cslb-progress-panel">
      <div className="cslb-progress-overview">
        <div>
          <strong>Application progress</strong>
          <span>{progress.completedCount} of {progress.totalCount} milestones complete</span>
        </div>
        <span className={`journey-status ${progress.status}`}>{progress.statusLabel}</span>
        <div
          className="cslb-progress-track"
          role="progressbar"
          aria-label="CSLB application milestones"
          aria-valuemin={0}
          aria-valuemax={progress.totalCount}
          aria-valuenow={progress.completedCount}
        >
          <span style={{ width: `${(progress.completedCount / progress.totalCount) * 100}%` }} />
        </div>
      </div>

      <div className="cslb-milestone-list">
        {progress.milestones.map((milestone, index) => {
          const isExpanded = expanded.has(milestone.id);
          const panelId = `cslb-${application.id}-${milestone.id}`;
          return (
            <section className={`cslb-milestone ${milestone.status}`} key={milestone.id}>
              <button
                type="button"
                aria-controls={panelId}
                aria-expanded={isExpanded}
                onClick={() => setExpanded((current) => {
                  const next = new Set(current);
                  if (next.has(milestone.id)) next.delete(milestone.id);
                  else next.add(milestone.id);
                  return next;
                })}
              >
                <span className="cslb-milestone-marker" aria-hidden="true">
                  {milestone.status === "complete" ? <Check /> : milestone.status === "action-required" ? <AlertCircle /> : index + 1}
                </span>
                <span className="cslb-milestone-title">
                  <strong>{milestone.title}</strong>
                  {milestone.action ? (
                    <small className={`owner-${milestone.action.owner.toLowerCase()}`}>
                      {OWNER_LABELS[milestone.action.owner]} · {milestone.action.title}
                    </small>
                  ) : null}
                </span>
                <span className={`journey-status ${milestone.status}`}>{milestone.statusLabel}</span>
                <ChevronDown className={isExpanded ? "expanded" : ""} aria-hidden="true" />
              </button>

              {isExpanded ? (
                <div className="cslb-milestone-detail" id={panelId}>
                  <ul>
                    {milestone.details.map((detail) => <li key={detail}>{detail}</li>)}
                  </ul>

                  {milestone.id === "review" ? feedback : null}

                  {milestone.id === "mailing" ? (
                    <div className="readiness-checklist">
                      <header>
                        <div>
                          <strong>Application readiness</strong>
                          <span>These checks help you prepare and do not change official progress.</span>
                        </div>
                        <span>{readyCount} of {IAPPLICATION_CHECKLIST_KEYS.length} ready</span>
                      </header>
                      {CHECKLIST_GROUPS.map((group) => (
                        <fieldset key={group.label} disabled={!checklistAvailable}>
                          <legend>{group.label}</legend>
                          {group.items.map((item) => (
                            <label key={item.key}>
                              <input
                                type="checkbox"
                                checked={checklist.items[item.key]}
                                disabled={!checklistAvailable || savingItems.has(item.key)}
                                onChange={(event) => onChecklistChange(item.key, event.target.checked)}
                              />
                              <span>{item.label}</span>
                              {savingItems.has(item.key) ? <small>Saving…</small> : null}
                            </label>
                          ))}
                        </fieldset>
                      ))}
                      {!checklistAvailable ? (
                        <p className="readiness-message">Readiness checklist is temporarily unavailable. Live application progress is still current.</p>
                      ) : null}
                      {checklistError ? <p className="readiness-message error" role="alert">{checklistError}</p> : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}
