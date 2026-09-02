# 01: Secure the dashboard entry point

**What to build:** An allowlisted Google user can open the Dashboard through the secured Web App, while unknown, inactive, or unidentified users receive a safe denied state. Every mutation path is rejected by the server while Phase 1 is `READ_ONLY`.

**Blocked by:** None (can start immediately)

**Status:** ready-for-human

- [ ] Google Account identity is checked before protected Dashboard data or UI is served.
- [ ] The `Users` allowlist distinguishes active, inactive, unknown, and blank-identity cases.
- [ ] All existing write/import/action/administration RPCs are server-blocked in Phase 1.
- [ ] Denied responses do not reveal protected data or internal implementation details.
- [ ] Tests cover allowed access, denied access, blank identity, and mutation blocking.
