# CIS Student Dashboard — iApplication Data Handoff

Status: ready for implementation  
Prepared: August 5, 2026  
Consumer: `CIS-Student`  
Backend: `contractor-api`

## 1. Goal

Update `/dashboard` in this repository with current application and licensing status from iApplication's Supabase database.

`CIS-Student` must **not** connect to Supabase directly. The browser calls this app's existing `GET /api/dashboard` route handler. That server-side handler calls Contractor API, which owns the Supabase credentials, customer-to-student linking, data normalization, and field allowlist.

```text
Student's browser
  -> CIS-Student GET /api/dashboard
  -> Contractor API /api/v2/ai_forms/customers/{customerId}/...
  -> iApplication Supabase
```

This is additive. Keep all existing dashboard calls and legacy Contractor API routes working.

## 2. Current integration points in CIS-Student

The dashboard is already structured as a browser-to-server aggregator:

| File | Current responsibility | Required change |
| --- | --- | --- |
| `src/app/api/dashboard/route.ts` | Loads `/account/me` and the existing dashboard resources in parallel | Add the customer-based iApplication reads here |
| `src/lib/api/client.ts` | Server-only Contractor API client and response unwrapping | Reuse it; send the internal key in a request header |
| `src/lib/env.ts` | Validates server environment variables | Add `CIS_API_KEY` |
| `.env.example` | Documents deploy-time configuration | Add a placeholder for `CIS_API_KEY` |
| `src/lib/dashboard/types.ts` | Defines the `/api/dashboard` browser contract | Add typed iApplication fields |
| `src/components/dashboard.tsx` | Fetches `/api/dashboard` and renders `/dashboard` | Render the next action and application journey from the new fields |

The signed-in user returned by `/account/me` already includes `customerid`. Use that value in the new routes. Never accept a customer ID from a browser query parameter for this dashboard flow.

## 3. Environment configuration

Add this server-only value in local development, development hosting, and production hosting:

```dotenv
CIS_API_KEY=<same secret configured as CIS_API_KEY in contractor-api>
```

Keep the existing API base URL:

```dotenv
# Development
API_BASE_URL=https://dev-api.contractorsischool.com/api/v2

# Production
API_BASE_URL=https://api.contractorsischool.com/api/v2
```

Add `CIS_API_KEY: z.string().min(1)` to `src/lib/env.ts` and map it from `process.env.CIS_API_KEY`. Do not prefix it with `NEXT_PUBLIC_`, return it from a route handler, print it, or include it in client-side code.

Every route below requires:

```http
X-CIS-API-Key: <CIS_API_KEY>
Accept: application/json
```

These routes are limited to 30 requests per minute. One `/dashboard` refresh should therefore make only the reads needed for the visible UI.

## 4. Route catalog

All paths below are relative to `API_BASE_URL`.

### Student-facing reads

| Route | Plain-language use | Recommended dashboard use |
| --- | --- | --- |
| `GET /ai_forms/customers/{customerId}/overview` | The customer's identity, durable iApplication link, and all ten application status signals | Primary source for the application cards and licensing journey |
| `GET /ai_forms/customers/{customerId}/action-center` | The single most important next step, plus one next step per application | Primary source for “Your next licensing step” |
| `GET /ai_forms/customers/{customerId}/timeline` | Dated milestones in newest-first order | Activity/history section; load on demand if it is collapsed |
| `GET /ai_forms/customers/{customerId}/feedback` | Reviewer messages explicitly shared with the student | Corrections/messages badge and detail view; load on demand |

### Operations and support routes

Do not call these during a normal student dashboard load.

| Route | Use |
| --- | --- |
| `GET /ai_forms/customers/{customerId}/link-status` | Support/debug view of whether the CIS customer has a durable iApplication link |
| `GET /ai_forms/customers/{customerId}/reconciliation` | Reports identity, app-fee, and exam-date differences between systems without changing either system |
| `POST /ai_forms/customers/{customerId}/sync` | Dry-runs or applies the customer link and dashboard snapshot sync |
| `GET /ai_forms/sync/health` | Operations-only counts for links, conflicts, stale snapshots, and the last batch run |

The older email routes remain available and are unchanged, including `GET /ai_forms/students/dashboard-status?email=...` and the ten focused student routes. New `/dashboard` work should use the customer-ID routes after linking because email can change.

## 5. Recommended `/api/dashboard` behavior

### Initial load

After `/account/me` succeeds:

1. Read `user.customerid` on the server.
2. If it is missing, return the existing dashboard payload with `iApplication: null`.
3. If present, fetch `overview` and `action-center` in parallel with the existing dashboard requests.
4. Add the results under a new `iApplication` property; do not rename or remove existing response fields.
5. Treat an unlinked customer or an unavailable iApplication source as a partial dashboard state. Study tools and other existing dashboard content must still render.

Suggested browser contract:

```ts
type DashboardPayload = {
  // Existing fields remain unchanged.
  app: Record<string, unknown> | null;
  deviceId: string;
  deviceStatus: Record<string, unknown> | null;
  liveClassStatus: unknown;
  practice: Record<string, unknown> | null;
  renewal: Record<string, unknown> | null;
  studyProgress: StudyProgress | null;
  upgrades: Record<string, unknown> | null;
  user: User;

  iApplication: {
    overview: IApplicationOverview | null;
    actionCenter: IApplicationActionCenter | null;
    availability: "available" | "not_linked" | "not_found" | "unavailable";
  } | null;
};
```

`availability` should be calculated by the CIS-Student server route. It prevents the React component from guessing whether `null` means “not linked,” “not enrolled,” or “temporarily unavailable.”

### Timeline and feedback

If both sections will be visible immediately, they may be included in the same server aggregation. Otherwise, create CIS-Student route handlers such as:

```text
GET /api/dashboard/iapplication/timeline
GET /api/dashboard/iapplication/feedback
```

Those handlers must derive `customerid` from the signed-in session and add `X-CIS-API-Key` server-side. They must not proxy an arbitrary customer ID from the browser.

Do not call `POST .../sync` automatically from `/dashboard`. Linking is an operational write and must be previewed before it is applied.

## 6. Overview response and the ten status signals

Contractor API returns a normal `{ message, data }` envelope. `backendRequest<T>()` already unwraps `data`, so the TypeScript type represents the inner object:

```ts
type IApplicationOverview = {
  customer: {
    customer_id: number;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone_number: string | null;
    classification: string | null;
    account_type: string | number | null;
    account_status: string | null;
  };
  iapplication_link: {
    student_id: string;
    match_method: string;
    status: "AUTO_MATCHED" | "VERIFIED" | "CONFLICT";
    matched_email: string | null;
    conflict_reason: string | null;
    last_verified_at: string | null;
    last_synced_at: string | null;
  } | null;
  live_dashboard: {
    student: { id: string; email: string };
    applications: IApplicationDashboardApplication[];
  } | null;
  synced_applications: Array<{
    application_id: string;
    packet_type: string;
    status: string;
    stage: string | null;
    source_updated_at: string | null;
    synced_at: string | null;
    dashboard: IApplicationDashboardApplication;
  }>;
};
```

Each `live_dashboard.applications[]` entry contains:

| Object | What the UI learns | Normalized states |
| --- | --- | --- |
| `form_progress` | Field/section totals and completion percentage | Numeric progress plus section status counts |
| `internal_review` | Whether the application is being completed, reviewed, returned, or submitted | `NOT_READY`, `READY_FOR_REVIEW`, `REVIEW_IN_PROGRESS`, `CORRECTIONS_REQUIRED`, `FINAL_REVIEW`, `SUBMITTED` |
| `corrections` | Whether corrections are currently required and which sections were returned | Use `required`; do not use historical returns as current corrections |
| `mailing_status` | Whether CIS has mailed the packet and whether it was received | `NOT_MAILED`, `MAILED`, `RECEIVED` |
| `cslb_submission` | Whether the application was submitted to CSLB | `NOT_SUBMITTED`, `SUBMITTED` |
| `application_posting` | App-fee number and posting status | `AWAITING_APP_FEE_NUMBER`, `APP_FEE_NUMBER_ASSIGNED`, `POSTED` |
| `exam_schedule` | Law/trade exam dates and whether both are scheduled | `NOT_SCHEDULED`, `PARTIALLY_SCHEDULED`, `SCHEDULED` |
| `live_scan` | Fingerprinting completion | `INCOMPLETE`, `COMPLETE` |
| `bond_status` | Bond quote/purchase progress | `NOT_STARTED`, `QUOTE_REQUESTED`, `PURCHASED` |
| `license_status` | License number, issuance, and final requirements | `NOT_ISSUED`, `NUMBER_ASSIGNED`, `ISSUED` |

Applications are ordered by most recent update. Do not merge multiple applications: render each independently or provide an application selector. Use `live_dashboard` for current UI status. `synced_applications` is the persisted, allowlisted projection for sync visibility; do not combine it with the live array and accidentally show duplicate applications.

## 7. Action-center response

```ts
type IApplicationAction = {
  code:
    | "LINK_IAPPLICATION"
    | "SOURCE_STUDENT_MISSING"
    | "FIX_CORRECTIONS"
    | "COMPLETE_APPLICATION"
    | "INTERNAL_REVIEW"
    | "MAIL_APPLICATION"
    | "SUBMIT_TO_CSLB"
    | "AWAIT_APP_FEE_NUMBER"
    | "SCHEDULE_EXAMS"
    | "COMPLETE_LIVE_SCAN"
    | "COMPLETE_BOND"
    | "COMPLETE_LICENSE_FINAL_STEPS"
    | "LICENSE_COMPLETE";
  owner: "STUDENT" | "CIS" | "CSLB" | "NONE";
  priority: number;
  title: string;
  student_blocking: boolean;
};

type IApplicationActionCenter = {
  customer_id: number;
  linked: boolean;
  source_student_found: boolean;
  primary_action: IApplicationAction | null;
  applications: Array<{
    application_id: string;
    packet_type: string;
    status: string;
    stage: string | null;
    action: IApplicationAction | null;
  }>;
};
```

`owner` is as important as the title:

| Owner | Dashboard treatment |
| --- | --- |
| `STUDENT` | Show a clear action button when a valid destination exists |
| `CIS` | Show “Our application team is working on this”; do not tell the student to fix it |
| `CSLB` | Show “Waiting on CSLB”; no false call to action |
| `NONE` | Show completion state |

`student_blocking: true` means the student's action is the next expected step. It does not mean the application is technically locked.

Suggested destinations using routes already named by this project:

| Action code | Destination |
| --- | --- |
| `FIX_CORRECTIONS` | `/iapplication/corrections` |
| `COMPLETE_APPLICATION` | `/iapplication` |
| `SCHEDULE_EXAMS`, `COMPLETE_LIVE_SCAN`, `COMPLETE_BOND`, `COMPLETE_LICENSE_FINAL_STEPS` | `/licensing-steps` or the relevant future detail page |
| CIS/CSLB wait states | No action button; show status text |

At the time of this handoff, this repository's dashboard already links to `/iapplication` and `/licensing-steps`, but those app page files are not present. Do not add new action buttons that lead to a missing route; either implement the destination in the same release or render a non-clickable status.

## 8. Mapping to the current `/dashboard`

### “Your next licensing step” card

- For a linked iApplication customer, use `actionCenter.primary_action.title` instead of the current generic “Complete your CSLB application.”
- Use `owner` to decide whether this is an action or a waiting status.
- Use `student_blocking` to emphasize student-owned work.
- Preserve the current study-focused fallback for users without iApplication access or data.

### “Your licensing journey”

Replace the single coarse `user.licensing_steps_progress` interpretation with statuses derived from each application:

| Existing journey phase | iApplication source |
| --- | --- |
| CSLB Application | `form_progress`, `internal_review`, `corrections`, `mailing_status`, `cslb_submission`, `application_posting` |
| Prepare for Exams | Keep existing `/study_progress`; iApplication does not replace course progress |
| Schedule & Pass Exams | `exam_schedule` for scheduled dates; keep ExamPrep data for study/test performance |
| Activate License | `live_scan`, `bond_status`, `license_status` |
| Contracting With Success | Mark available after `license_status.state === "ISSUED"`; this is a CIS product phase, not an iApplication field |

Show detail rows rather than forcing all of these states into one numeric step. For example, “Application received,” “Waiting for app-fee number,” and “Law exam scheduled Sep 15” are more accurate and useful than a single percentage.

### Corrections and feedback

- If `corrections.required` is true, show the returned-section count and a correction alert.
- Fetch `/feedback` when the student opens the alert or corrections detail.
- Show only the returned `SHARED` feedback. The API already excludes reviewer-only comments.
- Never display or attempt to infer attachment filenames, storage keys, signed URLs, or raw application form fields; they are intentionally absent.

### Timeline

Use `/timeline` for a newest-first activity list. Events can include application activity, ready for review, mailed/received, CSLB submitted, app-fee assigned, posted, law/trade exams scheduled, bond requests, and final steps completed.

Each event includes `application_id`, `packet_type`, `type`, `label`, `occurred_at`, and a small allowlisted `details` object. Format dates in the user's locale, but retain the server timestamp as the source value.

## 9. Linking prerequisite

The customer-ID routes rely on a durable link between the CIS `customerid` and the iApplication student ID. A customer can exist but not be linked yet.

Expected unlinked behavior:

- `overview`: HTTP 200 with `iapplication_link: null` and `live_dashboard: null`;
- `action-center`: HTTP 200 with `primary_action.code: "LINK_IAPPLICATION"` owned by `CIS`;
- `timeline`: HTTP 200 with `linked: false` and no events;
- `feedback`: HTTP 200 with `linked: false` and no feedback.

Support/operations establishes a link by previewing first:

```http
POST /api/v2/ai_forms/customers/123/sync
X-CIS-API-Key: <secret>
Content-Type: application/json

{"apply": false}
```

After confirming the expected match, repeat with `{"apply": true}`. Never expose this write operation as an automatic student-page side effect. The current CIS email is authoritative; `previous_email` is used only when the current email has no iApplication match. Other ambiguous matches remain conflicts and require manual resolution.

## 10. Error and fallback behavior

| Contractor API result | CIS-Student behavior |
| --- | --- |
| `200`, linked, applications present | Render live application status |
| `200`, linked, empty applications | Show “No application is currently available” without hiding study content |
| `200`, not linked | Keep existing dashboard and show no student-facing error; make the link issue observable server-side |
| `403` | Server configuration error: missing/wrong `CIS_API_KEY`; never expose the key or raw response |
| `404` | CIS customer was not found; keep existing dashboard and report `not_found` |
| `429` | Leave current dashboard usable; retry later with backoff, not a tight loop |
| `503` | Leave current dashboard usable and report `unavailable`; the rest of `/api/dashboard` must still work |

The existing dashboard refreshes after a 60-second stale interval on window focus. Keep that behavior. Do not add polling for every focused route; the 30-per-minute limit is shared by these internal endpoints.

## 11. Security and data ownership

- `CIS_API_KEY` exists only on the Next.js server.
- The authenticated session determines the customer ID.
- Do not let the browser request a different `{customerId}`.
- Do not log the key, bearer token, full student response, feedback bodies, or sensitive customer values.
- CIS remains the source of truth for customer email and phone.
- iApplication is the source of truth for application status, app-fee number, exam dates, Live Scan, bonds, and licensing milestones.
- `/reconciliation` reports differences only; it does not overwrite either database.

## 12. Implementation order

1. Add and validate `CIS_API_KEY` in all environments.
2. Have operations dry-run and apply links for a few known test customers.
3. Add iApplication TypeScript contracts and extend `DashboardPayload` without changing existing fields.
4. Extend `src/app/api/dashboard/route.ts` with `overview` and `action-center` server-side calls.
5. Update the next-step card and journey UI with graceful fallbacks.
6. Add timeline and feedback as lazy server-proxied reads.
7. Test multiple applications, no applications, no link, missing source student, corrections, waiting-on-CIS, waiting-on-CSLB, issued license, 403, 404, 429, and 503.
8. Verify existing study progress, live class, practice, renewal, device, and authentication behavior is unchanged.

## 13. Acceptance checklist

- [ ] `/dashboard` never exposes `CIS_API_KEY` in HTML, JavaScript, browser requests, logs, or error messages.
- [ ] The server uses the authenticated user's `customerid`.
- [ ] Existing dashboard payload fields and cards continue to work.
- [ ] Overview and action center load independently of optional timeline/feedback UI.
- [ ] Multiple applications are not merged.
- [ ] Current corrections use `corrections.required`, not return history.
- [ ] CIS- and CSLB-owned steps are shown as waiting states, not student tasks.
- [ ] Study progress still comes from `/study_progress`.
- [ ] A missing link or Supabase outage does not take down the entire dashboard.
- [ ] No automatic sync/write occurs during page load.
- [ ] Development is tested against `https://dev-api.contractorsischool.com/api/v2` before production rollout.

## 14. Backend reference

The authoritative backend documentation is in the Contractor API repository:

- `Docs/IapplicationCustomerSync.md`
- `Docs/MyAccountDashboardStatusHandoff.md`

The new routes are additive under `/api/v2/ai_forms`; older routes were not replaced or modified for consumers that still use them.
