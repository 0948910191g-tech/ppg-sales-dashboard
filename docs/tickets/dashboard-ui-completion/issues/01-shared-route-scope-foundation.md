# 01: Shared Dashboard Route and Scope Foundation

**What to build:** Make the dashboard a consistent multi-route read-only workspace. Existing Overview and Sales Performance remain usable while new routes can register into the same shell, sidebar, selected scope, prototype disclosure, and local fixture boundary.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Overview and Sales Performance deep links still render the correct page and active navigation item.
- [ ] A route registry can activate one page heading and keep inactive route content out of keyboard navigation.
- [ ] Selected Period, Comparison Period, Platform, and Category state is shared across routes and gives visible local feedback.
- [ ] Static sample and unavailable states are represented centrally; no unsupported selection is converted to zero or an inferred comparison.
- [ ] Existing Node tests pass and a route-level regression contract is added for the shared behavior.
- [ ] No browser-to-Sheet access, write/import action, secret, or remote data dependency is introduced.
