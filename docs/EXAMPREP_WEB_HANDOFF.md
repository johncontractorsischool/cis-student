# ExamPrep Web Rebuild — Next.js Handoff

Status: implementation handoff

Source application: React Native `exam-prep-app`

Backend to retain: `https://api.contractorsischool.com/api/v2`

Prepared: August 5, 2026

## 1. Objective

Build a fresh, responsive Next.js application that reproduces the current ExamPrep product experience and uses the existing Contractors Intelligence School API and web checkout ecosystem.

“Parity” in this document means:

- the same account, entitlement, demo, course, practice-test, application, licensing, resource, and renewal rules;
- the same task flow and visible outcomes;
- the same English/Spanish content-selection behavior;
- the same orange-led visual identity and recognizable source assets;
- browser-appropriate equivalents for native-only behavior such as device identity, offline media, orientation, phone links, and in-app purchases.

It does **not** mean copying React Native implementation details or carrying known mobile defects into the web app. Any intentional behavior change must be recorded in the decision log in section 18.

## 2. Source-of-truth order

When source files disagree, use this order:

1. The existing API response and entitlement fields.
2. The behavior visible in the current production mobile app.
3. This handoff document.
4. The React Native source code.

The mobile source contains legacy/dead routes and a few inconsistent rules. Those are called out explicitly below rather than silently presented as requirements.

## 3. Recommended web architecture

Use a current stable Next.js release with the App Router and TypeScript.

Suggested layers:

```text
Browser
  -> Next.js pages and client components
  -> Next.js route handlers / server-side API client (BFF)
  -> Existing /api/v2 backend
  -> Existing media, CSLB, iApplication, Shopify, and checkout URLs
```

Recommended implementation choices:

- Next.js App Router, TypeScript, and React Server Components by default.
- Client components only for exams, media players, accordions, modals, upload controls, and other interactive state.
- TanStack Query for remote state, caching, request deduplication, and invalidation.
- React Hook Form plus Zod for form state and validation.
- `next-intl` or an equivalent message catalog for English/Spanish UI strings.
- A small client store (Zustand or reducer/context) only for the active exam attempt, media state, and transient modal state.
- Native `<video>` and `<audio>` with Media Session support where available.
- A PDF viewer such as PDF.js for protected documents; do not expose bearer tokens in viewer URLs.
- Playwright for end-to-end parity tests, Testing Library for components, and unit tests for URL/content selectors.

Do not port the Redux action/reducer structure literally. It represents mobile implementation history, not a web-domain boundary.

## 4. Authentication and session model

### Required API behavior

- Login: `POST /auth/login` with `{ email, password }`.
- Successful login data is under `response.data.data` and includes `user`, `token`, and `expires_in`.
- Authorized requests use `Authorization: Bearer <token>`.
- Current user: `GET /account/me`.
- Refresh: `GET /auth/refresh?token=<token>`.
- Logout is local; the mobile app clears its token and expiry without calling a logout endpoint.
- A backend error usually has `{ error: { code, message, details } }`.

### Required web implementation

Keep the API token in a secure, HTTP-only, `Secure`, `SameSite=Lax` cookie controlled by Next.js. Do not store it in `localStorage`, expose it to client JavaScript, or put it in a browser URL. The refresh endpoint accepts a token in the query string, so call it only from the server-side BFF.

The BFF should:

1. proxy login to the existing backend;
2. set the token and calculated expiry cookie;
3. attach the bearer token to protected backend calls;
4. refresh once when the token is expired or an eligible request returns unauthorized;
5. clear the session and redirect to `/login` when refresh fails or `/account/me` returns the disabled-user `403` state;
6. normalize backend errors without logging passwords, tokens, cookies, protected document URLs, or sensitive response bodies.

The mobile login retries one transient failure after 600 ms. The web BFF should retain one bounded retry for login, registration, and forgot-password on network errors or `408`, `429`, `500`, `502`, `503`, or `504`; never retry validation/authentication failures.

## 5. Environment contract

Use server-only environment variables unless the browser truly needs a public value.

```dotenv
API_BASE_URL=https://api.contractorsischool.com/api/v2
WEB_BASE_URL=https://www.contractorsischool.com
IAPPLICATION_DEMO_SIGNUP_URL=https://apps.demo.contractorsischool.com/signup
IAPPLICATION_LAUNCH_URL=https://www.contractorsischool.com/iapplication/launch
SHOPIFY_DOMAIN=https://www.lexanasignature.com
```

Derived public destinations include:

- course ordering: `${WEB_BASE_URL}/contractors-license-exam`;
- terms: `https://contractorsischool.com/terms-of-service/mobile`;
- privacy: `https://contractorsischool.com/privacy-policy/mobile`.

Before implementation, verify:

- the API accepts requests from the deployed Next.js server;
- protected media and document hosts support range requests and server-side fetches;
- any browser-direct media supports the correct CORS headers;
- the backend accepts a web device type and a browser-generated stable device ID;
- checkout and iApplication domains allow the intended return/navigation behavior.

## 6. Proposed route map

Routes may be renamed, but the information architecture and back behavior should remain equivalent.

| Next.js route | Current screen/flow | Access |
|---|---|---|
| `/login` | Login | Public |
| `/forgot-password` | Forget | Public |
| `/register` | Register | Public |
| `/register/profile` | FillProfile | Newly registered session |
| `/legal/terms`, `/legal/privacy` | Terms | Public |
| `/dashboard` | Dashboard | Authenticated |
| `/account` | Account | Authenticated |
| `/account/profile` | UpdateAccount | Authenticated |
| `/account/password` | UpdatePassword | Authenticated |
| `/courses/[type]` | CourseMaterial | Authenticated |
| `/reading/[classId]` | ReadingCourse | Authenticated/entitled |
| `/reading/[classId]/[contentId]` | Reading | Authenticated/entitled |
| `/videos/[classId]` | VideoCourse | Authenticated/entitled |
| `/videos/watch/[videoId]` | ViewVideos | Authenticated/entitled |
| `/audio/[classId]` | AudioCourse | Authenticated/entitled |
| `/audio/[classId]/[audioId]` | ViewAudio/Player | Authenticated/entitled |
| `/practice` | PracticeCategoryList | Authenticated |
| `/practice/[classId]/[categoryId]` | PracticeTestList | Authenticated/entitled |
| `/practice/test/[testId]` | Start | Authenticated/entitled |
| `/practice/test/[testId]/attempt` | Exam | Authenticated/entitled |
| `/practice/test/[testId]/result` | Result/ReviewResult | Authenticated |
| `/live` | ViewClass | Authenticated |
| `/live/[videoId]` | ViewLiveClassVideos/external redirect | Authenticated/entitled |
| `/licensing-steps` | LicensingSteps | `account_type === 1` |
| `/licensing-steps/video/[step]` | ViewStepVideo | `account_type === 1` |
| `/resources` | ResourceCategoryList | Authenticated |
| `/resources/[classId]` | Resource | Authenticated/entitled |
| `/resources/[classId]/recommend` | Recommend | Authenticated |
| `/resources/[classId]/report/[linkId]` | Report | Authenticated |
| `/iapplication` | Application Videos | Entitlement-dependent |
| `/iapplication/corrections` | Corrections | Entitlement-dependent |
| `/iapplication/corrections/[licenseId]/[documentId]` | CorrectionDetails | Entitlement-dependent |
| `/iapplication/uploads` | UploadApplication | Entitlement-dependent |
| `/iapplication/forms` | DownloadForm | Entitlement-dependent |
| `/iapplication/demo` | DemoSignup | Demo/ineligible account |
| `/study-options` | StudyOptions | Demo/upgrade state |
| `/contract-forms` | ContractorForms | Demo or `account_type === 1` |
| `/about` | About | Authenticated |

The `/iapplication` area should have visible, accessible navigation for Videos, Corrections, Uploads, and Forms. The current navigator defines these four destinations but hides the mobile tab bar, leaving an ambiguous path to three of them.

## 7. Global shell and visual language

### Brand and layout

- Primary orange: `#fc9012`.
- Dashboard blue accent: `#296398`.
- App background: `#eeeeee`; cards are white.
- Success: `#49982b`/`#5cb85c`; warning/progress middle: `#df984d`; error: `#b85551`/`#d9534f`; live: `#dc3545`.
- Headers are solid orange, shadowless, with white centered titles.
- Detail pages use a back chevron on the left and optional action content on the right.
- The dashboard uses a menu button, compact EN/ES toggle, background art, two progress gauges, and icon tiles.
- Cards and lists are simple and compact: subtle borders, small radii, restrained shadows, underlined links, and orange primary actions.

### Responsive behavior

- Mobile should feel nearly identical to the existing app.
- On desktop, keep the dashboard content centered with a comfortable max width while allowing course lists, result tables, resources, and forms to expand.
- Convert the mobile drawer to a persistent sidebar at desktop widths if desired, but retain the same menu destinations and contact block.
- Preserve visible focus states, keyboard navigation, semantic headings, form labels, captions, and reduced-motion behavior.

### Assets to migrate

Copy approved assets from `src/images/`, especially:

- `logo-small.png`, `logo-big.png`, `dashboard-background.png`;
- dashboard feature icons (`application-color-icon.png`, `practice-color-icon.png`, `video-color-icon.png`, `reading-color-icon.png`, `audio-color-icon.png`, `resources-color-icon.png`, `live-class.png`, `contractor-forms-color-icon.png`, `studyoptions.png`);
- study-option cards (`full_online_course.png`, `live_streaming_course.png`, `in_class_course.png`, `home_study.png`);
- all `src/images/lic-steps/` assets;
- placeholders used for uploaded images/PDFs.

Optimize copies for the web, but retain original aspect ratios and recognizable presentation. Confirm usage rights before moving remotely hosted product images into the new repository.

## 8. Entry, registration, and first-login experience

### Login

- Email and password fields with inline validation.
- Password reveal control.
- Disable Sign In until email is valid and password is at least six characters.
- Links/actions for Forgot Password and Create Account.
- Show a blocking loader while authenticating.

### Forgot password

`POST /auth/forgot-password` with `{ email }`. On success, show the backend message and return to login. The existing copy says the password will be emailed; confirm whether the backend actually sends a password or a reset link before carrying that sentence forward.

### Registration

`POST /customer` with:

```ts
{
  email: string;
  password: string;       // min 6, at least one letter and one number
  name: string;
  lname: string;
  Classification: string; // existing numeric classification value
  language: 'en' | 'es';
  mobilenum?: string;      // when supplied, exactly 10 digits in current UI
  ios: 0;                 // compatibility field; confirm backend accepts web/0
}
```

Registration includes links to privacy policy and terms of service. After success, offer the optional profile completion fields: address, city, state (default CA), and ZIP. The current app logs the user out after complete/skip and sends them back to login; retain this unless product explicitly approves automatic sign-in.

### Enrollment agreement and iApplication prescreen

When `user.firsttime` is neither `0` nor `6` and `user.enrollment_agreements.id` exists:

1. show the enrollment agreement HTML;
2. require “I Accept Terms and Conditions” before Accept;
3. accept through `GET /account/accept-terms/{deviceId}` with `device_name` and `platform` query parameters (or the `accept-terms-iap` variant only if that legacy flow remains relevant);
4. call `GET /account/first-login-prescreen`;
5. when `show_modal === true`, ask “First-time CA contractor license?”;
6. submit `POST /account/first-login-prescreen` with `{ has_license: 'yes' | 'no' }`;
7. refresh `/account/me` and show the iApplication-created success message.

The mobile login source tries to navigate to profile for first-time users and immediately resets to App afterward. Treat the agreement/prescreen behavior above as authoritative and confirm whether profile completion is required for existing first-time users.

## 9. Dashboard parity

On load and on explicit refresh, request in parallel:

- `/account/me` when appropriate;
- `/app`;
- `/upgrade-demo-text`;
- `/device/status/{fingerprint}`;
- `/live_class_status`;
- `/study_progress`;
- `/practice_test_classes/opt`;
- `/renewal-checkout-ctas`.

Show a skeleton for at least two seconds on the initial load to avoid flashing between layouts. On the web, replace pull-to-refresh with a refresh action and revalidate on window focus after a reasonable stale interval; the mobile app uses roughly 60 seconds.

### Progress gauges

Render Law & Business and Trade percentages from `/study_progress`:

- when both exam and video totals are positive: exams contribute 70%, videos 30%;
- when only one total is positive: that source contributes 100%;
- invalid/out-of-range results become 0;
- `>= 80` green, `>= 50` amber, otherwise red.

### Dynamic status

- `/app` supplies maintenance/banner text and device-registration messages.
- Show the red “Live Class in Progress” banner and LIVE badge when `live_class_status === 1`.
- `/upgrade-demo-text` supplies badges for test, other-course, and live-class tiles.
- `/renewal-checkout-ctas` supplies a dashboard Extend Access or Renew Access card and relevant expiration date.

### Tile visibility

| Tile | Rule |
|---|---|
| Licensing Steps | `account_type === 1` |
| iApplication | demo account, or `iapp_access` is 1 or 2 |
| Practice Test | Always for an authenticated user |
| Video/Reading/Audio | Always for an authenticated user |
| Resources | Always for an authenticated user |
| Contract Forms | demo account or `account_type === 1` |
| Study Options | demo account or any upgrade text is non-empty; hidden in Spanish demo mode |
| Live Class | Always for an authenticated user |

For a demo account, selecting Video, Reading, Audio, or Resources first loads `/courses/{type}` and opens the first usable classification directly. A non-demo account first sees its active/expired course list.

### Device enforcement

Demo users bypass device checks. Other users may proceed only when device status type is `verified-fingerprint`. For `register-new-device`, show the backend `register_device_message` and allow registration. For `3-device-registered`, show `no_more_device_message` with no registration action.

For web parity, create a random, stable browser-device UUID stored in both a secure first-party cookie and local storage fallback; send a hash or opaque UUID, never invasive browser fingerprinting. The backend must approve the exact `device_type`, `platform`, and identifier semantics before this is implemented.

## 10. Course and media behavior

### Course chooser

`GET /courses/{type}` where type is `video`, `reading`, `audio`, or `resource`.

Expected data fields include:

```ts
{
  active_courses: Course[];
  expired_courses: Course[];
  online_course_message: string;       // HTML
  previous_discount_message: string;   // HTML
  es_access: unknown;
}
```

Course records use fields such as `id`, `reading_classification`, `completed_count`, `total_count`, `end_enroll`, `spanish_enabled`, `reading_es`, `videos_es`, `audio_es`, and `Class_description_es`.

- Active courses are clickable and show progress except Resources.
- Expired courses show the expiration date and renewal action.
- Empty lists show an ordering message and link to the existing website.
- Spanish choices require both account-level `es_access` and the per-course/per-medium Spanish flag.

### Reading

- Load hierarchy from `GET /reading_courses_with_detail/{classId}`.
- Response contains `reading_courses` and a flattened `reading_courses_contents` list.
- Render course/chapter/subchapter/content hierarchy as accordions/lists.
- Use `title_es` and content-specific Spanish fields only when non-empty; otherwise fall back to English using the logic in `src/screens/ReadingCourse/helpers.js`.
- Show read checkmarks from backend `read` plus optimistic client state.
- Opening content marks it read with `GET /save_read_reading_course/{contentId}`.
- Reader supports previous/next, Done, adjustable font size, HTML, embedded links, PDFs, and enlarged images.

### Video

- List: `GET /video_courses/{classId}` -> `{ videos, redirect_url }`.
- Detail: `GET /video_courses_detail/{videoId}`.
- Display nested chapters/subchapters and watched checkmarks.
- Select English `mp4_video` or Spanish `mp4_video_es` and corresponding names.
- A media object can supply a direct `video_url`/thumbnail or `redirect === true` plus `redirect_url`.
- On completion call `GET /save_watch_video/{code}`, refresh the class list, and advance to the next video when present.
- Provide previous/next controls and the backend “having trouble” redirect URL.

The mobile app supports Wi-Fi-only offline video download, progress, cancel, retry, remove, and local playback. Browser parity requires Cache Storage/IndexedDB or a service worker and depends on media CORS, quota, and range support. Treat it as a first-class acceptance item if “same functionality” includes offline web use; otherwise record it as an approved exception.

### Audio

- Batch: `GET /audio_courses_batch/{classId}` -> `{ audios, redirect_url }`.
- The batch is the source for list and detail navigation, including `previousAudioId`, `nextAudioId`, and category metadata.
- Render nested chapters plus flat intro audio items and watched checkmarks.
- Use Spanish title/file fields only when available.
- Player requirements: play/pause, seek bar, elapsed/duration, ±15 seconds, previous/next, Done, automatic next, background Media Session controls, and backend fallback URL.
- On completion call `GET /save_watch_audio/{audioId}`.

The mobile app offers to preload every missing audio file and can use the cached batch offline. Match this with a user-initiated “Make available offline” action rather than an automatic large download. Show storage/quota errors clearly.

### Live classes

- Status: `GET /live_class_status`.
- List: `GET /live_classes_test` -> `{ videos, redirect_url }`.
- Detail: `GET /live_class_video_detail/{id}`.
- Show Live, Archive, and Pre Recorded badges based on `status`.
- For demo accounts, filter to the correctly localized demo class/video name.
- A live item may open an external URL rather than the internal player.

## 11. Practice test and exam parity

### Discovery and list

- Categories: `GET /practice_test_classes/opt` -> `{ classes, type }`.
- If `type === 'demo_test'`, a category opens its test directly; otherwise it opens the tests list.
- Tests: `GET /get_practice_tests/{classId}/{categoryId}` -> `{ tests, safetyTests }`.
- Show category progress, expired date + renewal, inactive state, completion check, last-attempt score, and Not Attempted.
- Spanish demo mode filters categories to supported Spanish classifications. Preserve `src/utility/demoLanguage.js` classification normalization and its English fallback behavior.

### Test details and start

- English: `GET /practice_test_details/{testId}`.
- Spanish: `GET /practice_test_details/{testId}?l=es`.
- Expected data: `{ questions, test }` where `test` includes category, `number_of_question`, `number_of_marks`, `passing`, and `timing`.
- Also load `GET /exam_attempt/history/{testId}` -> `{ attempt_history }`.
- The guidelines view shows question count, full score, passing rate/score, time limit, and previous attempts.

### Active exam

- Present one question at a time with A–D choices.
- Require an answer before Submit.
- After Submit, lock the choice, show correct/wrong styling, explanation content, optional explanation video, and feedback action.
- Next advances; the final item uses Finish Test.
- End Test and browser navigation must show a confirmation.
- Time expiry shows a modal and submits the result.
- Support HTML/table content, linked images, external links, and PDFs in question/explanation content.
- Keep correct, wrong, and missed question arrays locally for review.
- Save with `GET /exam_attempt/save/{testId}/{score}` where score is a two-decimal percentage.
- Results show category, name, totals, attempted/correct/incorrect counts, percentage, pass/fail, review, and Back to Dashboard.
- Review has Correct, Wrong, and Missed sections with previous/next navigation, chosen/correct highlighting, explanations, and explanation videos.

### Rules that must be resolved before coding

The current screen displays backend `test.timing` but the active exam timer is hardcoded to 12,600 seconds (3.5 hours). It displays backend `test.passing`, but result pass/fail and score coloring use a hardcoded 80%. The web implementation should use backend `timing` and `passing` unless product explicitly requires the hardcoded legacy behavior. Add fixtures and tests for the approved rule.

Exam attempt state should survive a refresh in `sessionStorage`, keyed by user and test ID, with an explicit resume/discard prompt. Never send correct-answer data to logs or analytics.

### Question feedback

`POST /practice_test_question_feedback` with:

```ts
{
  feedback_type: 'spelling' | 'answer' | 'other';
  feedback_comment: string;
  question_id: number | string;
  test_id: number | string;
}
```

Hide feedback when `user.question_feedback_disabled === 1`.

## 12. iApplication and document workflow

### Access routing

- Demo or account types 0/3/4 without `app.app_review === 1` go to the demo signup page.
- Otherwise open the iApplication area.
- Demo signup links to `IAPPLICATION_DEMO_SIGNUP_URL`.

### Videos and tool launch

- `GET /application_videos` -> `{ videos }`.
- The current UI selects the first English “Start Here”/“Business Setup” video and first Spanish “Empieza Aqui” equivalent by normalized name.
- If a record lacks MP4 detail, call `GET /vimeo_video_detail/{code}`.
- If `user.apps_account_created` is 1, launch `${IAPPLICATION_LAUNCH_URL}?email=<encoded email>`.
- Otherwise show the first-time-license prescreen, submit it, refresh the user, then enable tool launch.

### Corrections

- List: `GET /view_corrections` -> `{ corrections }`.
- Detail: `GET /view_document/{licenseId}/{documentId}`.
- Render protected PDFs/images, final-review text, and document metadata.
- The mobile app fetches protected PDFs with a bearer token before displaying them. The web app must proxy this through an authenticated Next route and stream with a safe content type/disposition; never put the API token in a PDF URL.

### Uploads

- List: `GET /uploaded_documents` -> `{ documents }`.
- One file: `POST /upload_document` multipart field `file`.
- Multiple files: `POST /upload_document_multiple` multipart field `files[]`.
- Accept camera/image input and PDFs, show selected thumbnails/count, upload progress, success/waiting status, and refresh the document list after completion.
- Enforce file type/size limits both client-side and server-side. Confirm actual backend limits before writing UI copy.

### Forms

Provide the same CSLB PDF links grouped under Most Common Forms and Other Forms. Keep the links in configuration/data rather than JSX so the list can be audited and updated.

## 13. Resources, study options, contract forms, and external commerce

### Resources

- Categories: `GET /resource_classes` -> `{ classes, type }`.
- Items: `GET /resources/{classId}` -> `{ resources }`.
- Resource fields used by the UI include `id`, `Title`, `Organization`, `Description`, and `Link`.
- Users can open the resource, report it, or recommend a resource.
- Recommend: `POST /recommend-resources/{classId}` with `{ link, comment }`; link is required.
- Report: `POST /report-resources/{linkId}` with `{ issue, comment }`; issue is required. Preserve the four current issue choices: irrelevant to studies, broken link, incorrect display, and other.
- Preserve expired/inactive category behavior and renewal CTA behavior.

### Study options

Render a two-column mobile card grid for Full Online, Live Streaming, In Class, and Home Study. Existing URLs are in `src/screens/StudyOptions/StudyOptions.js`. Add these tracking parameters without destroying existing query/hash values:

```text
utm_source=mobile_app_demo
utm_medium=app_button
utm_campaign=mobile_app_demo
utm_campaign_id=mobile_app_demo
utm_adgroup=app_demo
utm_adgroup_id=app_demo
utm_ad_id=mobile_demo_button
utm_term=mobile_app_demo
```

For the web rebuild, rename the source/medium only if Marketing approves; otherwise identical values are required for attribution parity.

### Contract Forms

The current feature is a hardcoded product catalog with image previews, quick add, quantities, total, and a Shopify cart-permalink checkout on `www.lexanasignature.com`.

Do not duplicate the catalog in components. Move the existing IDs, Shopify variant IDs, prices, types, image URLs, descriptions, notices, and picker labels into a typed data file or CMS-backed endpoint. The cart URL format is:

```text
https://www.lexanasignature.com/cart/{variantId}:{quantity},{variantId}:{quantity}
```

Because prices and variants can change, verify all catalog data against Shopify immediately before launch.

### Native store

The mobile `Shopping` feature sells two 30-day subscriptions through Apple/Google IAP and validates them with `POST /validate_iap`. A browser cannot reproduce native IAP. Use existing web checkout/renewal CTAs instead, or obtain a dedicated web-commerce requirement. Do not invoke Apple/Google IAP from Next.js.

## 14. Licensing steps

Available only to `account_type === 1`.

- Eight sequential steps in English and Spanish.
- Completed steps show a checkmark; only completed steps and the next step can be opened.
- Completion: `POST /licensing_steps/update` with `{ step }`, then refresh `/account/me`.
- Reset uses the same endpoint with `{ step: 0 }`.
- Video: `GET /licensing_steps/video/{step}`. Step 1 maps long version to step 100 and short version to 101.
- Ending a video marks the corresponding step complete and advances when possible.
- Language update: `POST /account/update-lang` with `{ lang: 'en' | 'es' }`.
- Test dates: `GET /licensing_steps/test_date`; update with `POST /licensing_steps/update_test_date` and `{ law_date: 'YYYY-MM-DD' | null, trade_date: 'YYYY-MM-DD' | null }`.
- Application fee/license number: `POST /licensing_steps/update_fee_license` with `{ fee_license }`.
- Preserve the completion modal, back-to-playlist, next-step action, contact links, application-module link, CSLB status link, PSI scheduling links, bond quote, workers-comp links, exemption form, and asbestos exam link.

Move the eight step definitions, translations, and external links into typed configuration. Do not leave phone numbers and regulatory links scattered through components.

## 15. Account, localization, renewal, and error behavior

### Account

- Profile: `POST /account/update-profile` with `name`, `lname`, `mobilenum`, `address`, `city`, `state`, and `zip`. Email is visible but read-only.
- Password: `POST /account/change-password` with `old_password`, `password`, and `confirm_password`.
- Reset exams: confirm, then `GET /exam_attempt/reset`.
- Delete account: confirm, then `POST /account/delete`; current UI shows this only for account type 3 created on platform 1 or account type 4 created on platform 2. Confirm the equivalent web eligibility with the backend.
- About shows app version/build and device ID. On web, replace with deployed web version/commit and the approved browser-device ID.

### Language

The dashboard toggle stores `en`/`es`. Demo language is a persisted local preference and can override `user.lang`. Spanish values are selected only when present; English is the fallback.

Important demo rules:

- Spanish practice categories are limited to the supported classification set in `spanishEnrollClassifications.js`, plus Law.
- Spanish demo enroll uses only the curated Spanish classifications.
- Spanish C61 Law opens Spanish law-only checkout immediately.
- Other Spanish classifications ask new vs existing license, then open the matching Spanish checkout.
- English enroll normally asks classification -> license type -> course type.
- C61/Law skips license type; HAZ/ASB resolve immediately in resolver logic, although the current English picker hides HAZ/ASB options returned from the API. Preserve the tested resolver and confirm desired picker visibility.

Move all strings from `src/utility/demoLanguage.js` and `src/lang/{en,es}/lic-steps.js` into proper message catalogs. Preserve backend-supplied HTML/content separately from UI translations.

### Enrollment checkout

The URL resolver in `src/enroll/resolveEnrollUrl.js` and route map in `src/enroll/enrollUrlConfig.js` are business-critical. Port them unchanged into a pure, fully tested module. Add the existing demo UTM tracking parameters to the final URL.

### Renewal

`GET /renewal-checkout-ctas` may be wrapped or unwrapped. Normalize aliases exactly as `resolveRenewalUrl.js` does:

```ts
{
  type: string | null;
  source_sku: string | null;
  source_order_id: string | null;
  extension_date: string | null;
  re_enrollment_date: string | null;
  expires_at: string | null;
  buttons: Array<{ type?: string; sku?: string; label: string; url: string }>;
}
```

- Cache per authenticated email and deduplicate in-flight requests.
- One button: confirmation modal with Cancel and the backend label.
- Multiple buttons: selection modal using backend labels.
- No buttons/error: show the existing fallback message and phone number.
- The backend-supplied CTA URL is authoritative; do not rebuild renewal URLs in the browser.

### Errors and loading

- `422` with `error.details`: list field messages.
- Backend `403`: show backend message when present; disabled current user forces logout.
- Transient network error: “Temporary network issue. Please try again.”
- `5xx`: “Server is temporarily unavailable. Please try again.”
- Unknown: “Something went wrong. Please try again.”
- Use blocking loaders only for page-critical transitions; use localized inline loading for independent widgets.
- Do not hide errors only in the console. Provide retry for read failures and retain user input for write failures.

## 16. API inventory

All paths are relative to `/api/v2`. “Auth” means bearer token required by the current app.

| Method | Path | Auth | Purpose / request |
|---|---|---:|---|
| GET | `/app` | No | App/maintenance/device copy and legacy realtime config |
| POST | `/auth/login` | No | `{ email, password }` |
| GET | `/auth/refresh?token=…` | No/server only | Refresh bearer token |
| POST | `/auth/forgot-password` | No | `{ email }` |
| POST | `/customer` | No | Register user |
| GET | `/account/me` | Yes | Current user and entitlements |
| POST | `/account/update-profile` | Yes | Profile fields |
| POST | `/account/change-password` | Yes | Password fields |
| POST | `/account/delete` | Yes | Delete eligible account |
| GET | `/account/accept-terms/{deviceId}` | Yes | Query: `device_name`, `platform` |
| GET | `/account/accept-terms-iap/{deviceId}` | Yes | Legacy IAP agreement variant |
| GET/POST | `/account/first-login-prescreen` | Yes | Read/submit `{ has_license }` |
| POST | `/account/update-lang` | Yes | `{ lang }` |
| GET | `/upgrade-demo-text` | Yes | Upgrade badge copy |
| POST | `/device/register` | Yes | `{ fingerprint, user_agent, device_type }` |
| GET | `/device/status/{fingerprint}` | Yes | Device entitlement state |
| GET | `/study_progress` | Yes | Law/trade exam/video totals |
| GET | `/customer/welcome_video_detail` | Yes | Legacy welcome video |
| GET | `/courses/{type}` | Yes | Active/expired courses |
| GET | `/reading_courses_with_detail/{classId}` | Yes | Reading hierarchy + contents |
| GET | `/reading_courses_detail/{contentId}` | Yes | Legacy/detail fallback |
| GET | `/save_read_reading_course/{contentId}` | Yes | Mark reading complete |
| GET | `/video_courses/{classId}` | Yes | Video hierarchy |
| GET | `/video_courses_detail/{videoId}` | Yes | Video detail/media |
| GET | `/save_watch_video/{code}` | Yes | Mark video watched |
| GET | `/audio_courses_batch/{classId}` | Yes | Audio hierarchy/detail batch |
| GET | `/audio_courses_detail/{audioId}` | Yes | Legacy unused detail endpoint |
| GET | `/save_watch_audio/{audioId}` | Yes | Mark audio watched |
| GET | `/practice_test_classes/opt` | Yes | Practice categories/type |
| GET | `/get_demo_tests` | Yes | Legacy demo test categories |
| GET | `/get_practice_tests/{classId}/{categoryId}` | Yes | Tests and safety tests |
| GET | `/practice_test_details/{testId}` | Yes | Questions/test; `?l=es` for Spanish |
| GET | `/exam_attempt/history/{testId}` | Yes | Attempt history |
| GET | `/exam_attempt/save/{testId}/{score}` | Yes | Save score |
| GET | `/exam_attempt/reset` | Yes | Reset attempts |
| GET | `/practice_test_video_explanations/{id}` | Yes | Explanation video |
| POST | `/practice_test_question_feedback` | Yes | Feedback payload |
| GET | `/live_class_status` | Yes | Current live status |
| GET | `/live_classes_test` | Yes | Live/archive list |
| GET | `/live_class_video_detail/{id}` | Yes | Live video detail |
| GET | `/application_videos` | Yes | iApplication videos |
| GET | `/vimeo_video_detail/{code}` | Yes | Resolve Vimeo media |
| GET | `/view_corrections` | Yes | Correction list |
| GET | `/uploaded_documents` | Yes | Uploaded documents |
| POST | `/upload_document` | Yes | One multipart `file` |
| POST | `/upload_document_multiple` | Yes | Multipart `files[]` |
| GET | `/view_document/{licenseId}/{documentId}` | Yes | Protected document detail |
| GET | `/resource_classes` | Yes | Resource categories |
| GET | `/resources/{classId}` | Yes | Resource links |
| POST | `/recommend-resources/{classId}` | Yes | Recommend resource |
| POST | `/report-resources/{linkId}` | Yes | Report resource |
| GET | `/licensing_steps/video/{step}` | Yes | Licensing video |
| POST | `/licensing_steps/update` | Yes | `{ step }` |
| GET | `/licensing_steps/test_date` | Yes | Saved law/trade dates |
| POST | `/licensing_steps/update_test_date` | Yes | `{ law_date, trade_date }` |
| POST | `/licensing_steps/update_fee_license` | Yes | `{ fee_license }` |
| GET | `/renewal-checkout-ctas` | Yes | Backend-authored renewal options |
| GET | `/classifications` | Yes | Enrollment/store classifications |
| GET | `/enrollment_agreements_iap` | Yes | Legacy IAP agreement HTML |
| POST | `/validate_iap` | Yes | Native-only purchase validation |

Most endpoints return `{ data: ... }`; login and many actions therefore read `response.data.data`. Renewal CTA response shape is less consistent and must use the normalizer described above.

## 17. Delivery phases and acceptance gates

### Phase 0 — backend/browser proof

- Prove server-side login, refresh, `/account/me`, and logout.
- Prove web device registration semantics.
- Prove direct or proxied video/audio range playback.
- Prove protected PDF streaming and multipart upload.
- Confirm exam `timing` and `passing` rules.
- Confirm iApplication navigation and web commerce replacements.

Do not build the full UI until these risks are closed.

### Phase 1 — account shell and dashboard

- Auth, registration, optional profile, legal pages.
- Agreement/prescreen.
- Responsive shell/drawer/header.
- Dashboard, progress, statuses, language, device gate, renewal CTA.

### Phase 2 — learning and exams

- Course chooser and entitlements.
- Reading, video, audio, live classes.
- Practice discovery, attempt, save, results, review, feedback.
- Approved offline-media scope.

### Phase 3 — workflows and commerce

- iApplication videos, corrections, protected documents, uploads, forms.
- Resources and reports/recommendations.
- Licensing steps.
- Study options, contract forms, enroll and renewal checkout.

### Parity acceptance

For each role/fixture (demo EN, demo ES, active student, expired student, device-unregistered student, licensing account, iApplication-enabled account):

- visibility of every dashboard tile matches the entitlement rules;
- active, inactive, and expired states match API fixtures;
- English/Spanish labels and content fallback match;
- progress and exam scoring match approved formulas;
- all completion calls refresh visible progress;
- every external URL contains the correct classification/tracking parameters;
- browser back/refresh cannot silently discard an exam or active upload;
- media works with keyboard, captions when available, range seeking, and error recovery;
- protected content is not leaked through public URLs, logs, or client storage;
- layouts pass mobile, tablet, and desktop visual checks;
- core flows pass automated Playwright tests and axe accessibility checks.

## 18. Open decisions and known source ambiguities

Resolve these in writing before feature implementation:

1. **Exam duration:** backend `timing` or legacy hardcoded 3.5 hours?
2. **Passing score:** backend `passing` or legacy hardcoded 80%?
3. **Browser devices:** what identifier and `device_type` will the API accept, and do browser sessions count toward the three-device limit?
4. **Offline media:** required for web parity or approved exception?
5. **Application navigation:** visible four-tab hub as intended, despite hidden tabs in current source?
6. **Registration:** logout after optional profile or automatic sign-in?
7. **Native IAP:** remove from web in favor of web checkout, and which destination?
8. **Account deletion:** which `account_type`/`created_platform` combinations apply to web-created accounts?
9. **HAZ/ASB enroll:** resolver supports immediate checkout, but the current picker hides these options.
10. **Welcome video:** API and route exist, but dashboard entry is commented out.
11. **Realtime updates:** Pusher setup is commented out; should web poll/revalidate or restore realtime channels?
12. **Resource form schemas and upload limits:** confirm exact backend validation and maximum sizes.
13. **Phone numbers:** the UI uses `1-888-267-3926`, `1-213-510-2270`, and `1-800-425-7570` in different account/fallback contexts; verify ownership and desired routing.
14. **Catalog ownership:** static Contractor Forms catalog versus Shopify/CMS as authoritative source.

## 19. Source map for the new team

Start with these files when validating a parity question:

- navigation and screen inventory: `App.tsx`;
- API base URLs: `src/config.js`, `src/axios.js`;
- API calls and payloads: `src/store/actions/`;
- entitlement/dashboard behavior: `src/screens/Dashboard/Dashboard.js`;
- English/Spanish/demo logic: `src/utility/demoLanguage.js`;
- enroll URL rules: `src/enroll/resolveEnrollUrl.js`, `src/enroll/enrollUrlConfig.js`;
- renewal normalization: `src/enroll/resolveRenewalUrl.js`;
- reading fallback rules: `src/screens/ReadingCourse/helpers.js`;
- practice/exam behavior: `src/screens/PracticeTest/`, `src/screens/Exam/`;
- media behavior: `src/screens/VideoCourse/`, `src/screens/AudioCourse/`, `src/screens/LiveClass/`;
- iApplication/documents: `src/screens/Application/`;
- licensing steps: `src/screens/Licensing/`, `src/lang/`;
- brand/theme values: `src/components/ui/GlobalStyles.js`, `native-base-theme/variables/platform.js`;
- source assets: `src/images/`.

The new Next.js repository should copy this document first and maintain it as the parity contract until launch.
