# 01: Secure the deployable Dashboard boundary

**What to build:** An allowlisted user can open the deployed Dashboard through the Web App, while users outside the configured workspace or allowlist receive no protected content. A local preview is either denied or explicitly uses non-protected demo data.

**Blocked by:** None (can start immediately)

**Status:** ready-for-human

- [x] The Web App package can serve the Dashboard in its deployment layout.
- [x] Access validation includes the expected workspace as well as the active `Users` allowlist entry.
- [x] Opening the static/local surface cannot disclose protected Historical Snapshot data.
- [x] Tests cover deployable rendering, wrong-workspace denial, and local-preview behaviour.

## Local package evidence — 2026-09-01

- [x] `node --test backend/tests/phase1-deployment-package.test.mjs` builds a temporary, single-root Phase 1 Apps Script package and verifies `dashboard.html` beside `Rpc.gs`.
- [x] The package VM resolves the required read-only server functions, uses the least-privilege manifest, and exposes only `readTable`/`read` from the production Spreadsheet repository.
- [ ] Actual deployment, Web App smoke testing, production access, and human release approval remain pending; this local proof does not mark the ticket or production release approved.
