# Dashboard UI Completion — Read-only Executive Workspace

**Status:** ready-for-agent

## Problem Statement

ผู้ใช้ต้องการให้ PPG Omnichannel Commerce Executive Dashboard มีหน้า UI ครบตาม visual reference ที่ให้ไว้ เพื่อให้ผู้บริหารและทีม E-commerce เปิดดู Sales, Product, Marketing & Ads, Creator, Competitor Benchmark, Attention Queue, Review Walkthrough, Data Health และ Data Explorer ได้ในประสบการณ์เดียวกัน

ปัจจุบัน prototype มี Overview และ Sales Performance เป็นจุดเริ่มต้น แต่ยังไม่มีเส้นทาง UI ที่ครบ, interaction flow ระหว่าง Review Signal กับ Context/Evidence, และเกณฑ์รับงานร่วมกันสำหรับหน้าที่เหลือ หากสร้างแต่ละหน้าแยกกัน จะเสี่ยงให้ scope filter, status, data-through, coverage, unavailable state, responsive behavior และ read-only boundary ไม่สอดคล้องกัน

## Solution

สร้าง read-only interactive UI prototype ที่ใช้ shared dashboard shell, shared selected scope state และ local sample fixtures สำหรับทุกหน้าตาม visual reference ให้ผู้ใช้เปลี่ยน route, filter, tab, selected signal, drawer และ walkthrough ได้จริงใน browser โดยสื่อสาร Source, Coverage, Data Through, Historical Snapshot, Competitor Benchmark Snapshot และ unavailable state อย่างตรงไปตรงมา

ทุกเส้นทางใช้ shell และ interaction contract เดียวกัน แต่ละหน้าแสดงข้อมูลตัวอย่างแบบมีป้ายกำกับ ไม่อ่าน Google Sheets จาก browser และไม่สร้าง/แก้ไข Action ถาวร เมื่อ scope ไม่มี sample coverage จะคงค่าเป็น unavailable (`—`) แทนการสร้างตัวเลขหรือ comparison ขึ้นใหม่

## User Stories

1. As a business owner, I want to open the Dashboard and recognize the active page, selected period, Data Through, and read-only status immediately, so that I can interpret all metrics within the right scope.
2. As a dashboard user, I want to move between Overview, Sales Performance, Products, Marketing & Ads, Creators, Competitors, Review, Data Health, and Data Explorer, so that I can investigate performance without losing the dashboard context.
3. As a mobile user, I want each page to remain readable and operable on a small screen, so that I can review critical signals away from a desktop.
4. As a keyboard user, I want clear focus, semantic controls, and predictable escape/return-focus behavior, so that I can complete the same review path without a pointer.
5. As a sales manager, I want to view Confirmed GMV, Orders, AOV, Buyers, Conversion, trend, daily breakdown, and contributing channels, so that I can understand sales performance before acting.
6. As a sales manager, I want to open a Review Signal from Sales Performance and see its scoped Context Drawer, so that I can check source, metric, period, platform, coverage, and related metrics before forming a conclusion.
7. As a product manager, I want to review Product GMV, units, active SKUs, out-of-stock SKUs, category performance, stock health, top products, funnel, and movers, so that I can prioritize product investigation.
8. As a product manager, I want low-stock and product-review items to be clearly labelled and reviewable as walkthroughs, so that I do not mistake a prototype control for an operational action.
9. As a marketing manager, I want to compare Ad Spend, Sales from Ads, ROAS, CTR, CPC, conversion, campaign performance, audiences, and placements, so that I can identify where a campaign deserves review.
10. As a marketing manager, I want channel and campaign-type controls to update the local prototype state, so that I can understand how the real interaction will work before a data contract exists.
11. As a creator manager, I want to review creator GMV, orders, active creators, conversion, AOV, tiers, campaigns, and health, so that I can see where creator performance may need attention.
12. As a strategy user, I want a Competitor Benchmark Snapshot with a visibly separate benchmark period, so that I do not confuse benchmark evidence with the selected Sales scope.
13. As a strategy user, I want market share, price index, assortment, promotion, Share of Voice, and opportunity views, so that I can compare PPG with benchmark competitors without assuming those figures are live sales.
14. As an e-commerce operator, I want the Attention Queue to prioritize High, Medium, and Low Review Signals with source and metric details, so that I can choose what to inspect first.
15. As an e-commerce operator, I want sorting, filtering, columns, pagination, row selection, and a selected-signal summary to work locally, so that the queue behaves like a real review workspace.
16. As a reviewer, I want to enter a five-step Review Walkthrough from a selected signal, so that I can move from signal to context, evidence, insight, and next checks without the system taking an action for me.
17. As a data steward, I want to see source status, coverage, freshness, availability, errors, historical snapshots, and partial coverage separately, so that I can judge data trustworthiness before interpreting a metric.
18. As an analyst, I want to explore a scoped table, chart, and metadata view with field definitions and source availability, so that I can understand what a metric represents and whether it is usable.
19. As an authorized viewer, I want missing or unsupported data to be shown as unavailable rather than zero or a synthetic trend, so that the dashboard does not mislead me.
20. As a reviewer of the prototype, I want every export, apply, view, review, and action-like control to give intentional local feedback, so that there are no dead controls or implied writes.
21. As a visual reviewer, I want the hierarchy and major regions of each supplied screen to be represented consistently, so that the prototype can be used to approve a full UI direction before backend work.
22. As a delivery lead, I want route-level regression and browser evidence for every completed page, so that integration issues are found before the UI completion is declared done.

## Implementation Decisions

- Deliver this effort as a UI-only prototype under the existing Phase 1 read-only boundary. A secured server Read Model may be connected only under separately authorized work; browser-to-Sheet reads are forbidden.
- Use a single shared dashboard shell: sidebar, top bar, page title, security/status chips, selected scope controls, notification treatment, panel primitives, local feedback treatment, and responsive behavior.
- Register every page as a deep-linkable route with exactly one active navigation item and one page-level heading. Inactive route content must not remain keyboard-focusable.
- Centralize selected scope and prototype fixture lookup. The minimum shared scope is selected period, Comparison Period, platform, and category; pages may add brand, channel, campaign type, creator status, severity, source family, metric, granularity, or benchmark period.
- Preserve the existing Overview and Sales Performance interactions. Extend Sales with the Context Drawer rather than replacing the working route.
- Represent local fixture availability explicitly. A selection without fixture coverage uses `—` and a concise explanation; it must not create zeroes, inferred comparisons, or fake time-series data.
- Keep the Competitor Benchmark Snapshot visually and semantically separate from the selected Sales period. Its period, source type, and sample/snapshot status remain visible in the page context.
- Model a selected Review Signal as shared in-memory UI state so Sales, Attention Queue, Context Drawer, and Review Walkthrough can refer to the same scoped signal. The state is non-persistent and cannot create an Action.
- Make context drawers, popovers, modals, tables, and tabsets accessible: semantic labels, visible focus, escape behavior, focus restoration, controlled scroll containment, and reduced-motion fallback are required interaction contracts.
- Use local visual/chart assets and static fixtures only. Do not add a remote tracking/data dependency simply to populate a panel.
- Use local walkthrough feedback for export, review, apply, open-context, view-source, and download-like controls until a later approved workflow exists.

## Testing Decisions

- Test external behavior and stable UI contracts, not internal markup trivia. A good test proves a route, control, selected state, unavailable state, or safety boundary that a user can observe.
- Extend the existing static prototype test seam. Prefer route-level DOM/contract tests, safety scanning for browser data access, local asset resolution, and focused interaction tests over one test per decorative label.
- Each route needs evidence that it is deep-linkable, activates the intended navigation item, exposes its primary regions, and retains a clear static-sample/unavailable state.
- Test the selected Review Signal handoff through Context Drawer and Review Walkthrough, including close/escape/focus-return behavior.
- Test scope controls, tabs, row selection, sort/pagination/column feedback, and unavailable fixture behavior at the highest user-observable seam available.
- Run the full relevant Node suite after each integration batch. Supplement automated tests with browser checks at desktop and mobile widths, keyboard navigation, and a reduced-motion setting.
- Treat visual comparison to the supplied references as a manual acceptance check. Record the route, viewport, and any intentional divergence caused by truthful data/status labels.

## Out of Scope

- Live Google Sheets access, protected Read Model integration, direct browser data access, credentials, or secrets.
- Data schema changes, metric definitions, benchmark collection, source reconciliation, or the invention of business thresholds.
- Exports, imports, persistent Actions, approval workflows, role administration, notifications, or any state-changing operation.
- Commit, push, deployment, production mutation, or visual assets generated from product/customer data without explicit approval.
- Replacing the existing prototype technology or rebuilding already working Overview/Sales behavior without a demonstrated maintenance need.

## Further Notes

- The supplied ten screenshots are visual references. Their values and labels should be used only as clearly marked prototype fixtures until an approved source contract supplies them.
- Use the project glossary precisely: Confirmed GMV, Coverage, Data Through, Comparison Period, Read Model, Historical Snapshot, Competitor Benchmark Snapshot, Attention Queue, Review Signal, Read-only Phase, and Action Walkthrough.
- The UI completion work should proceed as tracer-bullet routes: establish shared routing/scope first, then build independent page routes, then integrate Review flows and cross-route QA.
- A detailed route map, reference manifest, ticket-ready execution order, and new-chat prompt are in the UI completion handoff document produced with this spec.
