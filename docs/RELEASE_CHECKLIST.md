# Production MVP release checklist

This checklist is the deployment gate for the existing-student ExamPrep MVP. Never place student credentials, bearer tokens, `CIS_API_KEY`, protected media URLs, or full backend response bodies in tickets, CI output, or Vercel logs.

## Vercel environments

Create separate Preview, Staging, and Production projects or environment scopes. Set these as encrypted server-side variables in each environment:

| Variable | Preview/Staging | Production |
| --- | --- | --- |
| `API_BASE_URL` | Approved development API `/api/v2` base URL | `https://api.contractorsischool.com/api/v2` |
| `CIS_API_KEY` | Development Contractor API key | Production Contractor API key |
| `WEB_BASE_URL` | Approved CIS web base URL | `https://www.contractorsischool.com` |
| `IAPPLICATION_DEMO_SIGNUP_URL` | Approved demo signup URL | Approved production demo signup URL |
| `IAPPLICATION_LAUNCH_URL` | Approved staging launch URL | Approved production launch URL |
| `SHOPIFY_DOMAIN` | Approved test storefront | Approved production storefront |

None of these values should use the `NEXT_PUBLIC_` prefix. Protect the Production environment and require a successful Preview/Staging deployment before promotion.

## Automated gates

- `npm ci`
- `npm audit --omit=dev --audit-level=high`
- `npm test`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test:e2e`
- Run `Deployed environment verification` with `target: staging`; all required accounts and integrations must pass.

## Role matrix

Record pass/fail and the test account identifier in the private release record. Do not store passwords there.

| Account | Required checks |
| --- | --- |
| Demo English | Demo content selection, device bypass, English labels |
| Demo Spanish | Spanish content/fallback, hidden unsupported commerce |
| Active student | Dashboard plus practice, reading, video, audio, live, and Resources |
| Expired student | Inactive content, expiration dates, backend-authored renewal checkout |
| Unregistered browser | Register prompt, server-derived fingerprint, verified state after registration |
| Three-device account | Blocking limit message and CIS phone link, no registration action |
| Contract Forms accounts | One eligible and one ineligible account prove the access boundary, configured storefront, variant existence, and current prices |
| iApplication account | Overview and action center both load |
| Partial iApplication outage | Exactly one dashboard feed fails while the surviving feed remains usable |

## Backend and browser proofs

- Login, pre-expiry refresh, eligible `401` refresh, disabled-user `403`, logout, and forgot-password all return safe browser errors.
- Enrollment agreement acceptance uses the server-held token and cookie-derived opaque device ID. Prescreen sends only `yes` or `no` to Contractor API.
- Video and audio hosts return byte ranges and allow seeking in desktop and mobile Chromium. Completion calls refresh visible progress.
- Practice tests use backend `timing` and `passing`; refresh/resume preserves the current attempt and submission produces the same score as the backend fixture.
- Resources list, recommendation, and report requests match the mobile contract. Verify the current backend maximum lengths before changing the conservative 2,048-character URL and 2,000-character comment caps.
- Renewal buttons and URLs come only from `/renewal-checkout-ctas`; test every returned option.
- The public `/app` response was reachable during implementation and exposes web maintenance plus device messaging. Recheck it immediately before promotion.
- Confirm Vercel server egress reaches Contractor API and browser-direct media has correct CORS and `Accept-Ranges` behavior.

## Promotion and rollback

1. Complete the role matrix on the Staging deployment.
2. Confirm Vercel logs contain no secrets or protected response bodies.
3. Promote the exact tested deployment to Production; do not rebuild a different commit.
4. Run the active-student and expired-student smoke paths against Production.
5. Run `Deployed environment verification` with `target: production`; it must remain read-only.
6. Retain the previous Vercel deployment. Roll back immediately for login/session failures, incorrect entitlement access, scoring mismatches, broken media seeking, or checkout misrouting.

See [Deployed environment verification](./DEPLOYED_VERIFICATION.md) for required GitHub Environment secrets, fixture preconditions, and safe execution details.
