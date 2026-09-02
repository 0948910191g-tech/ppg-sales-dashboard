# 04: Add review-only decision signals

**What to build:** The authorized Dashboard presents a live Attention Queue ranked for human review, keeps Competitor data in a separate Benchmark Snapshot scope, and guides Actions as a Phase 2 walkthrough without creating or changing persistent tasks.

**Blocked by:** 03: Render secured periods and fallback in the dashboard

**Status:** ready-for-human

- [ ] Attention Queue ranks available live signals such as low ROAS and high refunds without inventing business thresholds.
- [ ] Each signal shows its source period and supports a Review handoff.
- [ ] Competitor Benchmark Snapshot is visibly separate from Sales-period metrics.
- [ ] Action controls explain the Phase 2 boundary and do not mutate task state.
- [ ] Tests verify that review interactions do not call write RPCs or persist local tasks.
