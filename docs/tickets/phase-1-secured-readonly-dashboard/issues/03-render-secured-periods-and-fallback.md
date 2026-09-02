# 03: Render secured periods and fallback in the dashboard

**What to build:** The Dashboard consumes the secured read model rather than reading Sheets from the browser, lets viewers select periods and platforms supported by real coverage, shows Sales comparisons only where coverage is complete, and clearly labels an atomic Historical Snapshot fallback.

**Blocked by:** 02: Serve the approved live read model

**Status:** ready-for-human

- [ ] The browser has no direct Sheet read path or exposed Spreadsheet identifier.
- [ ] Period options are derived from live coverage and remain usable across continuous months.
- [ ] Sales comparison is shown only for periods with comparable `Daily_Sales` coverage.
- [ ] Product, Ads, Traffic, and Creator views remain period-scoped and do not create false daily/weekly aggregates.
- [ ] Missing data is shown as unavailable rather than zero.
- [ ] Historical Snapshot fallback is atomic and visibly includes its source and date.
