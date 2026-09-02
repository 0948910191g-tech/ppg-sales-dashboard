# 05: Prove the read-only release gate

**What to build:** A release-ready verification package demonstrates the secured read-only behaviour end to end, including contract tests, browser QA, source reconciliation, deployment approval, and rollback gates, without deploying or mutating production data.

**Blocked by:** 01: Secure the dashboard entry point; 02: Serve the approved live read model; 03: Render secured periods and fallback in the dashboard; 04: Add review-only decision signals

**Status:** ready-for-human

- [ ] The test matrix covers identity, allowlist, read-only blocking, schema/date/platform validation, null preservation, periods, comparison coverage, fallback, and error states.
- [ ] Browser QA covers allowed and denied users, desktop/mobile layouts, keyboard access, focus, and fallback state.
- [ ] At least one month across two platforms is reconciled against the source Sheet for GMV and orders.
- [ ] Deployment approval and rollback gates are documented and require explicit human approval.
- [ ] No production Sheet mutation, `clasp push`, or deployment occurs as part of this ticket.

## Comments

- 2026-09-01: Added the release verification package at `docs/tickets/release/phase-1-secured-readonly-release-gate.md`, a fixture at `backend/tests/fixtures/phase1-read-model.json`, and public-seam release tests at `backend/tests/phase1-release-gate.test.mjs` plus documentation contract tests at `tests/phase1-release-gate-docs.test.mjs`.
- 2026-09-01: Browser QA, source reconciliation, deployment approval, and rollback rehearsal remain human release gates. No production Sheet, `clasp`, or deployment operation was performed.
- 2026-09-01: Local automated verification is green (`94/94` tests). Ticket is ready for the required human browser, source-reconciliation, deployment-approval, and rollback gates; no production approval is implied.
