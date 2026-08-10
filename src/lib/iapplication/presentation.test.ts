import { describe, expect, it } from "vitest";

import {
  applicationsFrom,
  cslbApplicationProgress,
  journeyPhases,
  presentAction,
} from "./presentation";
import type {
  IApplicationApplication,
  IApplicationDashboardData,
} from "./types";

function application(
  id: number,
  overrides: Partial<IApplicationApplication> = {},
): IApplicationApplication {
  return {
    id,
    packet_type: "ORIGINAL_LICENSE",
    status: "IN_PROGRESS",
    stage: "FORM",
    ...overrides,
  };
}

describe("iApplication dashboard presentation", () => {
  it("keeps multiple live applications independent", () => {
    const data: IApplicationDashboardData = {
      availability: "available",
      actionCenter: null,
      overview: {
        customer: {},
        iapplication_link: {},
        live_dashboard: {
          applications: [application(11), application(22, { packet_type: "ADDITIONAL_CLASSIFICATION" })],
        },
        synced_applications: [{ application_id: 99 }],
      },
    };

    expect(applicationsFrom(data).map((item) => item.id)).toEqual([11, 22]);
  });

  it("uses corrections.required for the application action state", () => {
    const phases = journeyPhases(
      application(11, {
        corrections: { required: true, current_returned_section_count: 2 },
        form_progress: { percent_complete: 80 },
      }),
      { completed: 0, total: 10 },
    );

    expect(phases[0]).toMatchObject({ status: "action-required", statusLabel: "Action needed" });
    expect(phases[0].details).toContain("2 section(s) need corrections");
  });

  it("unlocks contracting resources only after the license is issued", () => {
    const beforeIssue = journeyPhases(application(11), { completed: 0, total: 0 });
    const issued = journeyPhases(
      application(11, { license_status: { state: "ISSUED", issued_confirmed: true } }),
      { completed: 0, total: 0 },
    );

    expect(beforeIssue[4]).toMatchObject({ status: "not-started", statusLabel: "Locked" });
    expect(issued[4]).toMatchObject({ status: "complete", statusLabel: "Available" });
  });

  it("shows scheduled dates without claiming the exams were passed", () => {
    const scheduled = journeyPhases(
      application(11, {
        exam_schedule: {
          law_exam_scheduled_at: "2026-09-10",
          trade_exam_scheduled_at: "2026-09-11",
          scheduled: true,
          state: "SCHEDULED",
        },
      }),
      { completed: 0, total: 0 },
    );

    expect(scheduled[2]).toMatchObject({ status: "in-progress", statusLabel: "Scheduled" });
  });

  it("presents action ownership without inventing a destination", () => {
    expect(
      presentAction({
        code: "INTERNAL_REVIEW",
        owner: "CIS",
        priority: 3,
        student_blocking: false,
        title: "CIS application review",
      }),
    ).toMatchObject({ label: "CIS is working", tone: "owner-cis" });
  });

  it("does not count negative normalized states as completed milestones", () => {
    const progress = cslbApplicationProgress(application(11, {
      form_progress: { percent_complete: 0 },
      internal_review: { state: "NOT_READY" },
      mailing_status: { state: "NOT_MAILED" },
      cslb_submission: { state: "NOT_SUBMITTED" },
      application_posting: { state: "AWAITING_APP_FEE_NUMBER" },
    }));

    expect(progress.completedCount).toBe(0);
    expect(progress.milestones.map((milestone) => milestone.status)).toEqual([
      "not-started",
      "not-started",
      "not-started",
      "not-started",
      "not-started",
    ]);
  });

  it("keeps completed form progress when corrections require student action", () => {
    const progress = cslbApplicationProgress(
      application(11, {
        form_progress: { percent_complete: 100 },
        internal_review: { state: "CORRECTIONS_REQUIRED" },
        corrections: { required: true, current_returned_section_count: 3 },
      }),
      {
        code: "FIX_CORRECTIONS",
        owner: "STUDENT",
        student_blocking: true,
        title: "Fix returned sections",
      },
    );

    expect(progress.completedCount).toBe(1);
    expect(progress.milestones[0].status).toBe("complete");
    expect(progress.milestones[1]).toMatchObject({
      status: "action-required",
      action: { owner: "STUDENT" },
    });
  });

  it.each([
    {
      label: "review submitted",
      application: { internal_review: { state: "SUBMITTED" } },
      completed: 2,
    },
    {
      label: "packet mailed",
      application: { mailing_status: { state: "MAILED" } },
      completed: 3,
    },
    {
      label: "submitted to CSLB",
      application: { cslb_submission: { state: "SUBMITTED" } },
      completed: 4,
    },
    {
      label: "posted by CSLB",
      application: { application_posting: { state: "POSTED", app_fee_number: "AF-2026-123" } },
      completed: 5,
    },
  ])("keeps earlier milestones complete when $label", ({ application: applicationState, completed }) => {
    const progress = cslbApplicationProgress(application(11, applicationState));

    expect(progress.completedCount).toBe(completed);
    expect(progress.milestones.slice(0, completed).every((milestone) => milestone.status === "complete")).toBe(true);
  });

  it("maps action-center ownership to the current authoritative milestone", () => {
    const progress = cslbApplicationProgress(
      application(11, { mailing_status: { state: "NOT_MAILED" } }),
      {
        code: "MAIL_APPLICATION",
        owner: "CIS",
        student_blocking: false,
        title: "Prepare application packet",
      },
    );

    expect(progress.milestones[2].action).toMatchObject({ owner: "CIS" });
    expect(progress.milestones.every((milestone, index) => index === 2 || milestone.action === null)).toBe(true);
  });
});
