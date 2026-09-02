# 03: Make fallback and source failures truthful

**What to build:** Authorized viewers receive an atomic Historical Snapshot only from an approved server-side provider when live reads fail. The UI receives safe source diagnostics, accurate snapshot metadata, and dataset-level Data Through.

**Blocked by:** 01: Secure the deployable Dashboard boundary

**Status:** ready-for-human

- [x] Live source failure uses a server-approved snapshot or a safe unavailable state, never an unrelated embedded fallback.
- [x] Snapshot source and capture date are presented consistently across bootstrap and scoped data.
- [x] Permission, timeout, missing-tab, and schema failures remain safe yet distinguishable.
- [x] Data Through remains the latest authorized dataset coverage date regardless of the selected query range.
- [x] Tests cover each fallback and source-failure path.
