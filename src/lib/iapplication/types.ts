export type IApplicationAvailability =
  | "available"
  | "not_linked"
  | "not_found"
  | "unavailable";

export type IApplicationOwner = "STUDENT" | "CIS" | "CSLB" | "NONE";

export const IAPPLICATION_CHECKLIST_KEYS = [
  "applicant_signature",
  "qualifier_signature",
  "notary_acknowledgment",
  "officer_partner_signatures",
  "records_copy",
  "supporting_documents",
  "application_fee_payment",
  "certified_mail",
] as const;

export type IApplicationChecklistKey = (typeof IAPPLICATION_CHECKLIST_KEYS)[number];
export type IApplicationChecklistItems = Record<IApplicationChecklistKey, boolean>;

export type IApplicationChecklist = {
  application_id: string;
  items: IApplicationChecklistItems;
  updated_at: string | null;
};

export type IApplicationChecklistCollection = {
  checklists: IApplicationChecklist[];
};

export type IApplicationAction = {
  code: string;
  description?: string | null;
  owner: IApplicationOwner;
  priority?: number | null;
  student_blocking?: boolean;
  title: string;
};

export type IApplicationActionApplication = {
  action: IApplicationAction | null;
  application_id: number | string;
  packet_type?: string | null;
  stage?: string | null;
  status?: string | null;
};

export type IApplicationActionCenter = {
  applications: IApplicationActionApplication[];
  customer_id: number | string;
  linked: boolean;
  primary_action: IApplicationAction | null;
  source_student_found: boolean;
};

export type IApplicationSectionProgress = {
  completed_fields: number;
  last_touched_at?: string | null;
  section_slug: string;
  status: string;
  total_fields: number;
};

export type IApplicationExamSchedule = {
  law_exam_scheduled_at?: string | null;
  scheduled?: boolean;
  state?: string | null;
  trade_exam_scheduled_at?: string | null;
};

export type IApplicationApplication = {
  application_posting?: {
    app_fee_number?: string | null;
    app_fee_number_assigned_at?: string | null;
    fee_number_confirmed?: boolean;
    posted_at?: string | null;
    posted_confirmed?: boolean;
    state?: string | null;
  } | null;
  bond_status?: {
    bond_quote_requested_at?: string | null;
    bqi_bond_purchased?: boolean;
    bqi_bond_quote_requested_at?: string | null;
    contractor_bond_purchased?: boolean;
    llc_bond_quote_requested_at?: string | null;
    purchased?: boolean;
    state?: string | null;
  } | null;
  corrections?: {
    current_returned_section_count?: number;
    has_return_history?: boolean;
    required?: boolean;
    sections?: IApplicationSectionProgress[];
  } | null;
  cslb_submission?: { state?: string | null; submitted_at?: string | null } | null;
  exam_schedule?: IApplicationExamSchedule | null;
  form_progress?: {
    completed_fields?: number;
    completed_sections?: number;
    last_activity_at?: string | null;
    percent_complete?: number;
    status_counts?: Record<string, number>;
    total_fields?: number;
    total_sections?: number;
  } | null;
  id: number | string;
  internal_review?: {
    application_stage?: string | null;
    application_status?: string | null;
    assignment_status?: string | null;
    ready_for_review?: boolean;
    ready_for_review_at?: string | null;
    ready_for_review_updated_at?: string | null;
    state?: string | null;
  } | null;
  license_status?: {
    activation_fee_paid?: boolean;
    asbestos_exam_completed?: boolean;
    final_steps_completed_at?: string | null;
    issued_confirmed?: boolean;
    license_number?: string | null;
    state?: string | null;
    workers_comp_completed?: boolean;
  } | null;
  live_scan?: { completed?: boolean; state?: string | null } | null;
  mailing_status?: {
    mailed_at?: string | null;
    mailed_confirmed_at?: string | null;
    received_at?: string | null;
    state?: string | null;
    tracking_number?: string | null;
  } | null;
  packet_type?: string | null;
  stage?: string | null;
  status?: string | null;
  updated_at?: string | null;
};

export type IApplicationOverview = {
  customer: Record<string, unknown> | null;
  iapplication_link: Record<string, unknown> | null;
  live_dashboard: {
    applications?: IApplicationApplication[];
    [key: string]: unknown;
  } | null;
  synced_applications: unknown[];
};

export type IApplicationDashboardData = {
  actionCenter: IApplicationActionCenter | null;
  availability: IApplicationAvailability;
  overview: IApplicationOverview | null;
};

export type IApplicationTimelineEvent = {
  application_id: number | string;
  details?: {
    app_fee_number?: string | null;
    license_number?: string | null;
    tracking_number?: string | null;
  } | null;
  label: string;
  occurred_at: string;
  packet_type?: string | null;
  type: string;
};

export type IApplicationTimeline = {
  customer_id: number | string;
  events: IApplicationTimelineEvent[];
  linked: boolean;
  source_student_found: boolean;
};

export type IApplicationFeedbackItem = {
  application_id: number | string;
  author_name?: string | null;
  author_role?: string | null;
  body: string;
  context_key: string;
  context_type: "SECTION" | "ATTACHMENT_REQUIREMENT";
  created_at: string;
  id: number | string;
  updated_at?: string | null;
};

export type IApplicationFeedback = {
  customer_id: number | string;
  feedback: IApplicationFeedbackItem[];
  linked: boolean;
};
