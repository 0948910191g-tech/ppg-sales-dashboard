# Phase 1: Secured Read-only PPG Dashboard

This effort turns the existing PPG Sales Dashboard into a secured, read-only Apps Script Web App. Google Account identity and the `Users` allowlist gate access. The server reads only the five approved view tabs, derives periods and Sales comparisons from real coverage, preserves missing values as unavailable, and can fall back atomically to a clearly labelled Historical Snapshot. Competitor data remains a separate Benchmark Snapshot scope. Attention Queue is review-only, and Actions remain a walkthrough until Phase 2.

Phase 2 is reserved for canonical import, persistent Actions, and role administration after Phase 1 sign-off.

Source plan: `docs/tickets/phase-1-secured-readonly-dashboard/plan.md`.
