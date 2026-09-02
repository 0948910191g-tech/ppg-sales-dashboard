# 04: Require complete Sales comparison coverage

**What to build:** Sales comparison becomes available only when both the selected and previous Daily Sales periods have complete coverage and usable `confirmed_gmv` for every required day; otherwise it remains explicitly unavailable.

**Blocked by:** 03: Make fallback and source failures truthful

**Status:** ready-for-human

- [x] A day with missing `confirmed_gmv` prevents a comparison from appearing as available.
- [x] Partial totals are not presented as a valid comparison.
- [x] Current and previous coverage reasons are visible to the read model and Dashboard.
- [x] Tests cover missing dates, missing GMV, and complete comparable periods.
