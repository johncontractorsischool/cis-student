# Deployed environment verification

The `Deployed environment verification` GitHub Actions workflow is the release evidence for the staging account matrix and deployed integrations. It is manual, uses protected GitHub Environments, and never runs with credentials on pull requests.

## GitHub Environment configuration

Create `staging` and `production` GitHub Environments. Protect Production with required reviewers. Configure these values in each environment:

| Type | Name | Value |
| --- | --- | --- |
| Secret | `E2E_BASE_URL` | Exact deployed portal origin, without a path |
| Secret | `E2E_ACCOUNTS_JSON` | Role-to-credential JSON described below |
| Variable | `E2E_EXPECTED_RENEWAL_HOSTS` | Comma-separated approved renewal checkout hostnames |
| Variable | `E2E_EXPECTED_SHOPIFY_HOST` | Approved Shopify hostname |

Use hostnames only in the two allowlists, for example `checkout.example.com` and `www.lexanasignature.com`. Do not include protocols or paths.

`E2E_ACCOUNTS_JSON` has this shape. Store the completed object only as an encrypted environment secret; never commit it or paste it into an issue or test output.

```json
{
  "active": { "email": "...", "password": "..." },
  "expired": { "email": "...", "password": "..." },
  "inactive": { "email": "...", "password": "..." },
  "demoEnglish": { "email": "...", "password": "..." },
  "demoSpanish": { "email": "...", "password": "..." },
  "deviceUnregistered": { "email": "...", "password": "..." },
  "deviceLimit": { "email": "...", "password": "..." },
  "iApplication": { "email": "...", "password": "..." },
  "iApplicationPartialOutage": { "email": "...", "password": "..." },
  "contractFormsEligible": { "email": "...", "password": "..." },
  "contractFormsIneligible": { "email": "...", "password": "..." }
}
```

Accounts must have completed the first-login agreement and prescreen. All accounts except the two explicit device-state fixtures should use a verified browser/device setup. The active account needs direct video and audio assets plus an active Resource classification. The expired account needs backend renewal CTAs. The unregistered account is inspected but not registered, so the test does not consume a device slot. The partial-outage account must be arranged so exactly one of the iApplication overview and action-center feeds succeeds.

## What staging changes

The staging suite submits one Resource recommendation and one Resource report with a `CIS Student staging integration verification` marker. Point the Staging deployment to a non-production Contractor API or arrange for the backend team to filter these marked records. The Production suite excludes these writes.

## Running and recording a release

1. Deploy the candidate commit to the configured Staging URL.
2. In GitHub Actions, run `Deployed environment verification` with `target: staging`.
3. Record the workflow URL and commit SHA in the private release record. Do not copy credentials, tokens, protected media URLs, or response bodies.
4. Promote the exact verified deployment.
5. Run the same workflow with `target: production`. Production performs login, read-only API, media, renewal, Resources validation, and Contract Forms verification only.

Failures name the role, route, or integration but intentionally avoid printing credentials, API response bodies, and media query strings.
