# 05: Minimize Phase 1 deployment authority

**What to build:** The Phase 1 deployment requests only the read-only authority needed for the secured Dashboard, with Drive operations unavailable until Phase 2 approval.

**Blocked by:** 01: Secure the deployable Dashboard boundary

**Status:** ready-for-human

- [x] The deployment manifest contains only Phase 1 read-only services and scopes.
- [x] Drive import and file-lifecycle capability cannot be used by the Phase 1 deployment.
- [x] Tests verify the minimum-authority manifest.
