# Handoff — PPG Dashboard UI Completion

> **Purpose:** a new chat can use this file to complete the remaining dashboard UI screens from the supplied visual references without reopening the product-discovery work.
>
> **Delivery boundary:** build a local, interactive **UI prototype** only. The current project remains Phase 1 secured read-only. Do not connect protected sources, read Google Sheets in the browser, introduce writes/imports/persistent actions, publish, or deploy unless the user explicitly authorizes that operation in the new chat.

## Start here in the new chat

Read these files before editing UI behavior:

1. `AGENTS.md`
2. `CONTEXT.md`
3. `PRODUCT.md`
4. `docs/adr/0001-secured-read-model-before-operations.md`
5. this handoff

The visual references are design references, not data authority or implementation instructions. Values, dates, “Live Read Model”, benchmark figures, and operational-looking actions in the images must be treated as sample content in the prototype. Show a visible prototype/static-sample disclosure and use `—` for unsupported scopes rather than inventing a result.

## Current starting point

- Workspace: `dashboard-reference-prototype.html` is a standalone interactive HTML prototype.
- Implemented routes: `#overview` and `#sales-performance`.
- Existing behavior to preserve: shared date/platform/category/compare filters, accessible date popover, local-only filter feedback, reduced-motion handling, responsive shell, Sales deep-link, and static-data disclosures.
- Existing test command: `node --test tests/dashboard-reference-prototype.test.mjs`.
- The workspace is not a Git repository. Do not imply a commit, push, or deployment happened unless it was actually authorized and verified.

## Reference manifest

All ten files exist at the following paths. Keep the screenshot number in review notes and tickets so the target is unambiguous.

| Ref | File | Target page or flow |
| --- | --- | --- |
| R01 | `/Users/kran/Downloads/ChatGPT Image 1 ก.ย. 2569 22_09_29 (1).png` | Sales Performance baseline |
| R02 | `/Users/kran/Downloads/ChatGPT Image 1 ก.ย. 2569 22_09_29 (2).png` | Products |
| R03 | `/Users/kran/Downloads/ChatGPT Image 1 ก.ย. 2569 22_09_29 (3).png` | Marketing & Ads |
| R04 | `/Users/kran/Downloads/ChatGPT Image 1 ก.ย. 2569 22_09_29 (4).png` | Creators |
| R05 | `/Users/kran/Downloads/ChatGPT Image 1 ก.ย. 2569 22_09_29 (5).png` | Competitors / Benchmark |
| R06 | `/Users/kran/Downloads/ChatGPT Image 1 ก.ย. 2569 22_09_30 (6).png` | Review / Attention Queue |
| R07 | `/Users/kran/Downloads/ChatGPT Image 1 ก.ย. 2569 22_09_30 (7).png` | Sales context drawer |
| R08 | `/Users/kran/Downloads/ChatGPT Image 1 ก.ย. 2569 22_09_30 (8).png` | Review Walkthrough |
| R09 | `/Users/kran/Downloads/ChatGPT Image 1 ก.ย. 2569 22_09_30 (9).png` | Data Health |
| R10 | `/Users/kran/Downloads/ChatGPT Image 1 ก.ย. 2569 22_09_31 (10).png` | Data Explorer |

## Shared UI contract

Use R01 as the shared shell baseline rather than independently rebuilding every page.

- **Desktop shell:** deep-blue left navigation, sticky white top bar, bilingual page title, security/data-through/status chips, notification badge, user avatar, content workspace.
- **Global scope controls:** selected period, compare period, platform, category, and page-specific filters. Controls must be keyboard-operable, show the current selection, and produce local visible feedback. Do not leave decorative controls that cannot be operated.
- **State truth:** static samples must not appear to be live production data. “Export”, “Apply”, “Review”, “Open Context”, and “View Source” can be local walkthrough actions only and must say so when clicked.
- **Visual language:** Prompt/Outfit typography, cobalt actions, deep navy text, white cards, fine blue-grey borders, 8–10px card radius, semantic red/amber/green/blue states. Color must not be the only signal.
- **Responsive behavior:** preserve the existing small-screen shell. KPI cards stack; dense tables live in labelled horizontally scrollable regions; drawers become a full-height mobile sheet; controls and buttons keep usable tap targets.
- **Accessibility:** one `h1` per route; semantic buttons/links/tables; visible focus; `Escape` closes popovers/drawers and returns focus to the trigger; respect `prefers-reduced-motion`; no focusable controls inside an inactive route.

## Route inventory and UI acceptance

### Existing routes

| Route | Status | Keep / extend |
| --- | --- | --- |
| `#overview` | Present | Keep as the landing overview. Update only when shared shell/state extraction needs it. |
| `#sales-performance` | Present | Preserve the existing Sales page. Add the R07 context-drawer trigger and flows; do not replace its working filters or static/unavailable rules. |

### New routes

| Route | Reference | Required surface | Completion criteria |
| --- | --- | --- | --- |
| `#products` | R02 | Product GMV/Units/Active SKU/Out-of-stock/Conversion KPIs; Top Products; Category Performance; Stock Health donut; Low Stock Alerts; Product Funnel; Top Movers; Product Review Actions | Brand filter works locally; table cards remain readable on mobile; stock badges have text labels; “Review” opens the prototype review flow. |
| `#marketing-ads` | R03 | Ad Spend/Sales from Ads/ROAS/CTR/CPC/Conversion KPIs; spend vs attributed sales; ROAS trend; traffic-source split; campaign tables; audience/placement; opportunity queue | Channel and campaign-type filters work locally; chart view tabs are operable; ROAS and lift labels do not imply a live optimization action. |
| `#creators` | R04 | Creator GMV/orders/active creators/conversion/AOV KPIs; Top Creators; GMV Trend; Insight cards; source donut; tier table; campaign status; health snapshot | Creator-status filter works locally; profile/detail buttons are prototype walkthroughs; creator identity uses sample-safe fixtures only. |
| `#competitors` | R05 | Benchmark banner and independently scoped benchmark period; market/share KPIs; channel-share bars; price/assortment tables; promo intensity; benchmark trend; SOV/price index; opportunity cards | Sales period and benchmark period remain visibly separate; every benchmark label says Snapshot/sample in the prototype; never combine benchmark and live Sales coverage. |
| `#review` | R06 | Severity/source filters; high/medium/low summaries; signals table; sort/column/pagination controls; selected-signal detail pane; quick actions | Selecting a row updates the detail pane; severity is communicated by label/icon/text as well as color; pagination/sort/columns have intentional local prototype behavior. |
| `#review-walkthrough` | R08 | Read-only five-step progress path; signal summary; key-metric comparison; evidence list; insight summary; business-impact cards; suggested next checks | The selected signal is carried from `#review` or Sales; step navigation is keyboard-operable; actions remain non-persistent and explicitly read-only. |
| `#data-health` | R09 | Source health overview; coverage heatmap; data-quality issues; partial coverage; historical snapshot details; status legend | Status/freshness/availability/coverage remain distinct concepts; a source row can reveal local details; no fake refresh or source mutation. |
| `#data-explorer` | R10 | Source/metric/platform/granularity/date controls; Table/Chart/Metadata tabs; paginated data grid; field descriptions; availability/fallback explanation | Tabs, sorting/pagination and column options are interactive locally; CSV is a disabled/prototype notice unless a later approved data source exists; field definitions are truthful. |

### Cross-route flows

1. **Sales signal → Context Drawer (R07):** selecting a Sales review signal opens a right drawer with source, metric, period, platform, coverage, related metrics, and local-only actions. Close with close button, overlay, and `Escape`; restore focus to the signal trigger.
2. **Review signal → Review Walkthrough (R06 → R08):** selected signal travels through route state or a small in-memory store. The walkthrough highlights evidence, not a business verdict, and does not write an action.
3. **All “View …” links:** route to the appropriate implemented page where that page exists; otherwise show a concise prototype notice. Never leave a dead `href="#"` without feedback.

## Ticket-ready execution order

These are implementation slices, not evidence that the features are already approved or built. Keep each slice in its named files/modules and do not give multiple workers overlapping ownership.

| ID | Slice | Depends on | Main acceptance evidence |
| --- | --- | --- | --- |
| UI-00 | Extract shared app shell, route registry, shared scope state, static-fixture boundary, and route test helpers | Current prototype | Existing Overview/Sales regression passes; every inactive page is hidden/inert; no external fetch/source access. |
| UI-01 | Products route | UI-00 | R02 layout and local Brand/filter behavior; mobile table/card QA. |
| UI-02 | Marketing & Ads route | UI-00 | R03 chart/tables, channel/campaign filters and non-operational opportunities. |
| UI-03 | Creators route | UI-00 | R04 route, status filter, responsive creator tables/cards. |
| UI-04 | Competitors route | UI-00 | R05 independent benchmark scope and explicit snapshot/sample labelling. |
| UI-05 | Review queue and selected-signal pane | UI-00 | R06 selection, filters, sort/pagination/columns feedback, keyboard row selection. |
| UI-06 | Context drawer and Review Walkthrough flow | UI-05; Sales route | R07/R08 focus management, selected-signal handoff, read-only disclosures. |
| UI-07 | Data Health route | UI-00 | R09 source/coverage semantics and visible unavailable/historical states. |
| UI-08 | Data Explorer route | UI-00 | R10 tabs, data-grid controls, metadata and availability explanation. |
| UI-09 | Whole-dashboard integration and visual QA | UI-01 through UI-08 | All routes/deep links, sidebar activation, mobile keyboard checks, reduced-motion check, test suite, and visual comparison against R01–R10. |

Recommended Luna split after UI-00 is complete: one worker each for UI-01/UI-02/UI-03, then UI-04/UI-05/UI-07, with the Main Agent retaining UI-00, UI-06, UI-08, UI-09, integration, and all external actions. Adjust this only when files can be made non-overlapping.

## Implementation guidance

- Prefer a route registry plus per-route render functions and fixture objects over copying an entire page ten times. Keep shared header, sidebar, scope controls, status chips, panel primitives, chart primitives, table shell, toast, and drawer in one shared layer.
- Keep visual fixture data separate from UI behavior. Existing screenshots include operational-looking values but they are not source data. If the selected scope does not map to a fixture, render `—` and explain that the static prototype has no sample for that scope.
- Reuse local SVG/CSS chart rendering or current approved visual assets. Do not add remote assets, credentials, trackers, browser fetch calls, or direct Sheet reads merely to make a panel look populated.
- Preserve and extend `tests/dashboard-reference-prototype.test.mjs`; add route contracts, selector/ARIA checks, static-safety checks, and local asset checks as pages are added. Avoid tests that only match decorative wording.
- Verify each new route by direct deep link, sidebar click, filter change, keyboard navigation, and a mobile-width view before marking its ticket complete.

## Definition of done for the UI completion epic

- All routes listed above exist, use the shared shell, are deep-linkable, and mark their active navigation item.
- R01–R10’s information hierarchy and major regions are faithfully represented without copying unverifiable data claims into a “live” UI.
- Global/page filters, tabs, selected rows, drawer, walkthrough, modal/toast feedback, sort/pagination controls, and route links have real local interaction behavior.
- Desktop, tablet, and mobile layouts have been visually checked; tables/drawers remain usable by keyboard and touch.
- The relevant Node test suite and any added focused tests pass. Browser/visual checks state their viewport and result.
- No browser-to-Sheet access, writes, imports, persistent actions, secrets, commit, push, or deployment were introduced without a separate explicit instruction.

## Paste this into the new chat

```text
Use $loop-engineer and $low-model-subagents to complete the PPG dashboard UI prototype.

Read AGENTS.md, CONTEXT.md, PRODUCT.md, docs/adr/0001-secured-read-model-before-operations.md, and docs/plans/ui-completion-handoff.md before editing. The target is the standalone dashboard-reference-prototype.html and its tests.

Work only on the UI prototype: no protected-data connection, direct Google Sheet access, writes/imports/persistent actions, secrets, commit, push, or deploy. Treat all supplied screenshots as visual references and their figures as static sample fixtures; make unavailable scope explicit.

Main Agent: define acceptance criteria, retain shared shell/route state/integration/QA ownership, inspect all worker diffs, and do not call work complete without test plus browser evidence.

Use Luna only for non-overlapping UI tickets after inspecting the current file structure. Begin with UI-00, then implement UI-01 through UI-09 in the handoff dependency order. Preserve existing Overview and Sales Performance behavior, then add the Sales context drawer and Review Walkthrough flow.
```

## Known open decisions for the new chat

- This handoff does **not** authorize a production data model, real exports, or persistent operational actions. Ask before crossing that boundary.
- The screenshots establish page content and interaction intent, but not a canonical schema, KPI definition, or business threshold. Keep fixtures clearly static until a source contract is supplied.
- If the static prototype becomes difficult to maintain in one HTML file, propose a small component/module migration before rewriting it. Do not silently change technology or replace working routes.
