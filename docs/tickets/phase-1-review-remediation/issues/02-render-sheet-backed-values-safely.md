# 02: Render Sheet-backed values safely

**What to build:** Dashboard values originating from Sheets render safely as text, and viewer-facing source labels clearly distinguish Secured Read Model, Historical Snapshot, and Data Through without implying sync freshness.

**Blocked by:** 01: Secure the deployable Dashboard boundary

**Status:** ready-for-human

- [x] Sheet-derived names and labels cannot create executable markup in the Dashboard.
- [x] The active source is named accurately in live and fallback states.
- [x] Data Through is described as coverage, not sync freshness.
- [x] Tests exercise hostile source text and the revised source labels.
