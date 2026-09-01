# ExamPrep Web

Responsive Next.js rebuild of the Contractors Intelligence School ExamPrep app.

## Local setup

1. Copy `.env.example` to `.env.local` and adjust values if needed.
2. Run `npm install`.
3. Run `npm run dev` and open `http://localhost:3000`.

The implementation contract lives in `docs/EXAMPREP_WEB_HANDOFF.md`. Open product and backend decisions are tracked in `docs/DECISIONS.md`.

## Release checks

- `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build` cover the local quality gate.
- `npm run test:e2e` runs deterministic desktop/mobile Chromium MVP flows against a local fixture backend.
- `npm run test:e2e:staging` requires `E2E_BASE_URL`, `E2E_STAGING_EMAIL`, and `E2E_STAGING_PASSWORD`.
- Vercel environment setup, role fixtures, staging proofs, promotion, and rollback are documented in `docs/RELEASE_CHECKLIST.md`.
# cis-student
