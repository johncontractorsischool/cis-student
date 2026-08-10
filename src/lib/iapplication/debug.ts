import "server-only";

import type {
  IApplicationDashboardData,
  IApplicationFeedback,
  IApplicationTimeline,
} from "@/lib/iapplication/types";

function developmentLog(label: string, value: unknown) {
  if (process.env.NODE_ENV !== "development") return;
  console.info(`[iApplication] ${label}`, JSON.stringify(value, null, 2));
}

export function logIApplicationDashboard(data: IApplicationDashboardData) {
  const applications = data.overview?.live_dashboard?.applications ?? [];
  developmentLog("dashboard", {
    availability: data.availability,
    overviewLoaded: data.overview !== null,
    actionCenterLoaded: data.actionCenter !== null,
    linked: data.actionCenter?.linked ?? Boolean(data.overview?.iapplication_link),
    sourceStudentFound: data.actionCenter?.source_student_found ?? null,
    primaryAction: data.actionCenter?.primary_action
      ? {
          code: data.actionCenter.primary_action.code,
          owner: data.actionCenter.primary_action.owner,
          priority: data.actionCenter.primary_action.priority,
          studentBlocking: data.actionCenter.primary_action.student_blocking,
          title: data.actionCenter.primary_action.title,
        }
      : null,
    applicationCount: applications.length,
    applications: applications.map((application) => ({
      applicationId: application.id,
      packetType: application.packet_type,
      status: application.status,
      stage: application.stage,
      formPercent: application.form_progress?.percent_complete ?? 0,
      correctionsRequired: application.corrections?.required ?? false,
      correctionSectionCount: application.corrections?.current_returned_section_count ?? 0,
      internalReview: application.internal_review?.state ?? null,
      mailing: application.mailing_status?.state ?? null,
      cslbSubmission: application.cslb_submission?.state ?? null,
      applicationPosting: application.application_posting?.state ?? null,
      appFeeNumberAssigned: Boolean(application.application_posting?.app_fee_number),
      examSchedule: application.exam_schedule?.state ?? null,
      liveScan: application.live_scan?.state ?? null,
      bond: application.bond_status?.state ?? null,
      license: application.license_status?.state ?? null,
      licenseIssued: application.license_status?.issued_confirmed ?? false,
    })),
  });
}

export function logIApplicationTimeline(data: IApplicationTimeline) {
  developmentLog("timeline", {
    linked: data.linked,
    sourceStudentFound: data.source_student_found,
    eventCount: data.events.length,
    eventsByType: data.events.reduce<Record<string, number>>((counts, event) => {
      counts[event.type] = (counts[event.type] || 0) + 1;
      return counts;
    }, {}),
  });
}

export function logIApplicationFeedback(data: IApplicationFeedback) {
  developmentLog("feedback", {
    linked: data.linked,
    feedbackCount: data.feedback.length,
    feedbackByContext: data.feedback.reduce<Record<string, number>>((counts, item) => {
      counts[item.context_type] = (counts[item.context_type] || 0) + 1;
      return counts;
    }, {}),
  });
}
