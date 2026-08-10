import type {
  IApplicationAction,
  IApplicationApplication,
  IApplicationDashboardData,
} from "@/lib/iapplication/types";

export type JourneyStatus = "action-required" | "complete" | "in-progress" | "not-started";

export type JourneyPhase = {
  details: string[];
  status: JourneyStatus;
  statusLabel: string;
  title: string;
};

export type CslbMilestoneId =
  | "application"
  | "review"
  | "mailing"
  | "submission"
  | "posting";

export type CslbMilestone = {
  action: IApplicationAction | null;
  details: string[];
  id: CslbMilestoneId;
  status: JourneyStatus;
  statusLabel: string;
  title: string;
};

export type CslbApplicationProgress = {
  completedCount: number;
  milestones: CslbMilestone[];
  status: JourneyStatus;
  statusLabel: string;
  totalCount: 5;
};

function state(value: string | null | undefined): string {
  return (value || "").trim().toUpperCase();
}

function readable(value: string | null | undefined, fallback = "Not started"): string {
  const normalized = (value || "").trim();
  if (!normalized) return fallback;
  return normalized
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function hasStarted(value: string | null | undefined): boolean {
  const normalized = state(value);
  return Boolean(normalized && !["NOT_STARTED", "PENDING", "NONE"].includes(normalized));
}

function status(
  complete: boolean,
  started: boolean,
  actionRequired = false,
): Pick<JourneyPhase, "status" | "statusLabel"> {
  if (actionRequired) return { status: "action-required", statusLabel: "Action needed" };
  if (complete) return { status: "complete", statusLabel: "Complete" };
  if (started) return { status: "in-progress", statusLabel: "In progress" };
  return { status: "not-started", statusLabel: "Not started" };
}

function boolLabel(label: string, value: boolean | undefined): string {
  return `${label}: ${value ? "Complete" : "Not complete"}`;
}

export function packetTitle(application: IApplicationApplication): string {
  const packet = readable(application.packet_type, "CSLB application");
  return packet.toLowerCase().includes("application") ? packet : `${packet} application`;
}

export function applicationsFrom(data: IApplicationDashboardData | null) {
  return data?.overview?.live_dashboard?.applications ?? [];
}

export function presentAction(action: IApplicationAction | null | undefined): {
  description: string;
  label: string;
  tone: "complete" | "owner-cis" | "owner-cslb" | "owner-student";
  title: string;
} | null {
  if (!action) return null;

  const owner = action.owner;
  const ownerPresentation = {
    CIS: { description: "Our application team is working on this step.", label: "CIS is working", tone: "owner-cis" },
    CSLB: { description: "This step is currently with CSLB.", label: "Waiting on CSLB", tone: "owner-cslb" },
    NONE: { description: "No further licensing action is required right now.", label: "Complete", tone: "complete" },
    STUDENT: {
      description: action.student_blocking
        ? "Your action is needed to keep your application moving."
        : "This step is ready for you.",
      label: "Action needed",
      tone: "owner-student",
    },
  } as const;

  return {
    ...ownerPresentation[owner],
    description: action.description?.trim() || ownerPresentation[owner].description,
    title: action.title,
  };
}

const ACTION_MILESTONE: Partial<Record<string, CslbMilestoneId>> = {
  COMPLETE_APPLICATION: "application",
  FIX_CORRECTIONS: "review",
  INTERNAL_REVIEW: "review",
  MAIL_APPLICATION: "mailing",
  SUBMIT_TO_CSLB: "submission",
  AWAIT_APP_FEE_NUMBER: "posting",
};

export function cslbApplicationProgress(
  application: IApplicationApplication,
  action?: IApplicationAction | null,
): CslbApplicationProgress {
  const progress = Math.max(
    0,
    Math.min(100, Number(application.form_progress?.percent_complete || 0)),
  );
  const reviewState = state(application.internal_review?.state);
  const mailingState = state(application.mailing_status?.state);
  const submissionState = state(application.cslb_submission?.state);
  const postingState = state(application.application_posting?.state);
  const correctionsRequired = application.corrections?.required === true;

  const postingComplete = postingState === "POSTED";
  const submissionComplete =
    postingComplete ||
    postingState === "APP_FEE_NUMBER_ASSIGNED" ||
    submissionState === "SUBMITTED";
  const mailingComplete =
    submissionComplete || ["MAILED", "RECEIVED"].includes(mailingState);
  const reviewComplete = mailingComplete || reviewState === "SUBMITTED";
  const formComplete =
    reviewComplete ||
    progress >= 100 ||
    ["READY_FOR_REVIEW", "REVIEW_IN_PROGRESS", "CORRECTIONS_REQUIRED", "FINAL_REVIEW"].includes(
      reviewState,
    );

  const milestones: CslbMilestone[] = [
    {
      id: "application",
      title: "Complete Application",
      details: [
        `Application form: ${progress}% complete`,
        application.form_progress?.total_fields
          ? `${Number(application.form_progress.completed_fields || 0)} of ${Number(application.form_progress.total_fields)} fields complete`
          : "Field progress is not available yet",
        application.form_progress?.total_sections
          ? `${Number(application.form_progress.completed_sections || 0)} of ${Number(application.form_progress.total_sections)} sections ready`
          : "Section progress is not available yet",
      ],
      ...status(formComplete, progress > 0),
      action: null,
    },
    {
      id: "review",
      title: "CIS Review & Corrections",
      details: [
        `Internal review: ${readable(reviewState)}`,
        correctionsRequired
          ? `${Number(application.corrections?.current_returned_section_count || 0)} section(s) need corrections`
          : "Corrections: None required",
      ],
      ...status(
        reviewComplete,
        formComplete || !["", "NOT_READY"].includes(reviewState),
        correctionsRequired,
      ),
      action: null,
    },
    {
      id: "mailing",
      title: "Prepare & Mail Application",
      details: [
        `Mailing: ${readable(mailingState)}`,
        application.mailing_status?.tracking_number
          ? `Tracking number: ${application.mailing_status.tracking_number}`
          : "Tracking number: Not available",
      ],
      ...status(
        mailingComplete,
        reviewComplete || ["MAILED", "RECEIVED"].includes(mailingState),
      ),
      action: null,
    },
    {
      id: "submission",
      title: "Submit to CSLB",
      details: [`CSLB submission: ${readable(submissionState)}`],
      ...status(
        submissionComplete,
        mailingComplete || submissionState === "SUBMITTED",
      ),
      action: null,
    },
    {
      id: "posting",
      title: "Application Posted",
      details: [
        `Application posting: ${readable(postingState)}`,
        application.application_posting?.app_fee_number
          ? `Application fee number: ${application.application_posting.app_fee_number}`
          : "Application fee number: Not assigned",
      ],
      ...status(
        postingComplete,
        submissionComplete || postingState === "APP_FEE_NUMBER_ASSIGNED",
      ),
      action: null,
    },
  ];

  const actionMilestoneId = action ? ACTION_MILESTONE[action.code] : undefined;
  if (actionMilestoneId) {
    const milestone = milestones.find((item) => item.id === actionMilestoneId);
    if (milestone) {
      milestone.action = action || null;
      if (action?.owner === "STUDENT" && action.student_blocking) {
        milestone.status = "action-required";
        milestone.statusLabel = "Action needed";
      }
    }
  }

  const completedCount = milestones.filter((milestone) => milestone.status === "complete").length;
  const hasAction = milestones.some((milestone) => milestone.status === "action-required");
  const hasStartedMilestone = milestones.some((milestone) => milestone.status !== "not-started");

  return {
    completedCount,
    milestones,
    status: hasAction
      ? "action-required"
      : completedCount === 5
        ? "complete"
        : hasStartedMilestone
          ? "in-progress"
          : "not-started",
    statusLabel: hasAction
      ? "Action needed"
      : completedCount === 5
        ? "Complete"
        : hasStartedMilestone
          ? "In progress"
          : "Not started",
    totalCount: 5,
  };
}

export function journeyPhases(
  application: IApplicationApplication,
  study: { completed: number; total: number },
): JourneyPhase[] {
  const cslbProgress = cslbApplicationProgress(application);
  const studyComplete = study.total > 0 && study.completed >= study.total;
  const licenseState = state(application.license_status?.state);
  const licenseIssued =
    application.license_status?.issued_confirmed === true || licenseState === "ISSUED";
  const lawExamScheduled = Boolean(application.exam_schedule?.law_exam_scheduled_at);
  const tradeExamScheduled = Boolean(application.exam_schedule?.trade_exam_scheduled_at);
  const bothExamsScheduled = lawExamScheduled && tradeExamScheduled;
  const examsStarted =
    lawExamScheduled ||
    tradeExamScheduled ||
    application.exam_schedule?.scheduled === true ||
    hasStarted(application.exam_schedule?.state);
  const activationStarted =
    application.live_scan?.completed === true ||
    application.bond_status?.purchased === true ||
    hasStarted(application.live_scan?.state) ||
    hasStarted(application.bond_status?.state) ||
    hasStarted(application.license_status?.state);

  return [
    {
      title: "CSLB Application",
      details: cslbProgress.milestones.flatMap((milestone) => milestone.details),
      status: cslbProgress.status,
      statusLabel: cslbProgress.statusLabel,
    },
    {
      title: "Prepare for Exams",
      details: [
        study.total > 0
          ? `${study.completed} of ${study.total} study items complete`
          : "ExamPrep study activity has not started",
      ],
      ...status(studyComplete, study.completed > 0),
    },
    {
      title: "Schedule & Pass Exams",
      details: [
        `Exam schedule: ${readable(application.exam_schedule?.state)}`,
        application.exam_schedule?.law_exam_scheduled_at
          ? "Law exam has been scheduled"
          : "Law exam is not yet scheduled",
        application.exam_schedule?.trade_exam_scheduled_at
          ? "Trade exam has been scheduled"
          : "Trade exam is not yet scheduled",
      ],
      ...(licenseIssued
        ? { status: "complete" as const, statusLabel: "Complete" }
        : bothExamsScheduled
          ? { status: "in-progress" as const, statusLabel: "Scheduled" }
          : status(false, examsStarted)),
    },
    {
      title: "Activate License",
      details: [
        boolLabel("Live Scan", application.live_scan?.completed),
        boolLabel("Bond", application.bond_status?.purchased),
        application.license_status?.license_number
          ? `License ${application.license_status.license_number}`
          : `License: ${readable(application.license_status?.state)}`,
      ],
      ...status(licenseIssued, activationStarted),
    },
    {
      title: "Contracting With Success",
      details: [
        licenseIssued
          ? "Your post-license business resources are available."
          : "Resources become available after your license is issued.",
      ],
      ...(licenseIssued
        ? { status: "complete" as const, statusLabel: "Available" }
        : { status: "not-started" as const, statusLabel: "Locked" }),
    },
  ];
}
