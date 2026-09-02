# Phase 1 remediation review-loop plan

## Outcome

Close the current Standards and Spec review findings without deployment, production mutation, or Phase 2 scope. The working tree is non-Git, so verification uses direct file inspection, focused regression probes, and the full local test suite.

## Work slices

1. **Sales truthfulness**
   - Reject partial Sales GMV summaries when required `confirmed_gmv` coverage is incomplete.
   - For the `all` platform scope, require complete `date × platform` coverage for comparison periods.
   - Preserve explicit coverage reasons in the read model.

2. **Frontend boundary and truthful states**
   - Remove the embedded commercial snapshot from the local/static surface and replace it only with clearly marked synthetic fixture data.
   - Classify workspace authorization failures as denied.
   - Show current/previous comparison coverage reasons in the Dashboard.
   - Exercise hostile Sheet-backed values at runtime, not only through source-text assertions.

3. **Deployable package evidence**
   - Produce a deterministic Phase 1 Apps Script package containing the manifest, required read-only server files, and `dashboard.html` in the same deployment root.
   - Verify package contents without deploying or using production identifiers.
   - Keep the live Web App smoke test and human release gates pending.

## Acceptance gates

- No protected or provenance-unknown commercial payload remains in the local/static Dashboard source.
- Missing day, missing platform, or missing `confirmed_gmv` cannot appear as a complete comparison or available Sales GMV total.
- Workspace failures render the denied client state.
- A temporary package build proves `dashboard.html` and required Apps Script files share one deployable root.
- Focused remediation tests pass, then `node --test backend/tests/*.test.mjs tests/*.test.mjs` passes as one suite.
- Main-agent review finds no unresolved P1/P2 item in the implemented scope.

## Explicit non-goals

- No `clasp push`, Web App deployment, production Sheet access, reconciliation, rollback, commit, or push.
- The approval-gated browser smoke test remains a human gate.
