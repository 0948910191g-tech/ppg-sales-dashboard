# 02: Serve the approved live read model

**What to build:** An authorized viewer receives a stable read-model response containing data from the five approved view tabs, coverage-derived periods, source availability, and Data Through metadata, with validation failures and unavailable values represented explicitly.

**Blocked by:** 01: Secure the dashboard entry point

**Status:** ready-for-human

- [ ] Bootstrap returns the authorized user, source availability, coverage, periods, and Data Through metadata.
- [ ] Scoped data requests accept validated date bounds and platform filters.
- [ ] Only `Daily_Sales`, `Product_Period`, `Ads_Period`, `Traffic_Period`, and `Creator_Period` are read.
- [ ] `confirmed_gmv` is the Sales GMV source; missing values remain `null`/unavailable.
- [ ] Header mismatch, missing tab, timeout, and permission errors are observable and safe.
- [ ] Auth errors remain denied and never fall back to snapshot data.
