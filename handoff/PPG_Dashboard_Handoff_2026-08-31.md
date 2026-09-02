# PPG Sales Dashboard - Mac Handoff

**Handoff date:** 31 August 2026  
**Purpose:** Continue the approved dashboard UX/UI redesign on macOS without changing verified data, backend behavior, or deployment state.

## 1. Current status

- The current product is an omnichannel PPG sales dashboard spanning Shopee, TikTok Shop, products, ads, creators, actions, and competitor benchmarks.
- The existing UI is a standalone `dashboard.html` with the working navigation `Today`, `Analyze`, `Action`, and `Data`.
- A new UX/UI direction has been approved: **Category Command Wall**.
- This is design planning and mockup work only. **No redesign code has been implemented yet.**
- The screenshot board in `assets/ppg-dashboard-ui-mockup-board-2026-08-31.png` is a visual reference. Its figures and dates are layout samples, not business facts.

## 2. Open this project on Mac

1. Copy this entire folder to the Mac. Keep the `backend/`, `.impeccable/`, `.superpowers/`, and `handoff/` folders together.
2. Open the root folder in the preferred editor.
3. Start UI work from `dashboard.html`; it currently uses CDN versions of Tailwind CSS, Chart.js, Font Awesome, and Google Fonts, so an internet connection is required for a representative visual preview.
4. Run local backend verification before and after any backend-related change:

   ```bash
   node --test backend/tests/*.test.mjs
   ```

5. Do not bind Google Apps Script, import Sheets data, or deploy from the Mac without a separate approval.

## 3. Approved information architecture

```text
Overview
Performance
  - Sales
  - Products
  - Marketing
  - Creators
  - Competitors
Actions
Data Health
Data Explorer
```

The persistent context bar must retain the selected **period**, **comparison period**, **platform**, and **category** while users move between sections.

### User flow

```text
Executive Overview
  -> See data freshness and selected scope
  -> Read KPI strip and channel performance
  -> Identify a priority signal
  -> Drill into the relevant performance view
  -> Open evidence/context drawer
  -> Create and track an action
```

## 4. UX requirements

- The Overview should answer within 30 seconds: current performance, the changing channel, the likely cause, and the next action.
- Use the sequence `Status -> KPI -> Trend -> Cause -> Action`.
- KPI cards must expose both the value and a meaningful comparison. Color may reinforce a state but must not be the only signal.
- An **Attention Queue** should collect only decision-worthy anomalies: sales decline, low ROAS, at-risk products, creator underperformance, or data freshness issues.
- Clicking a KPI/chart/table signal opens a context drawer with evidence, period, platform, and an action entry point.
- Actions created from an insight must keep a link to their source metric/context. The backend already defines actions as append-history only; never add a delete workflow.
- Desktop is primary. Mobile should preserve Overview, core filters, action creation, and readable drill-downs; use stacked KPI panels and responsive priority columns.

## 5. Data integrity rules - do not change

- Never display monthly Product, Traffic, Ads, or Creator aggregates as day/week results.
- For unavailable day/week source granularity, show: `ไม่มีข้อมูลระดับวัน/สัปดาห์ - ดูข้อมูลต้นฉบับได้ที่ Data Explorer`.
- Keep competitor benchmark scope visibly separate from the selected sales period. Do not imply an older competitor extract matches the current sales filter.
- Do not infer missing values, replace unknowns with zero, or alter canonical/raw history.
- Preserve the backend RPC envelope: `{ok,data,meta,error}`.
- Sheets import, Drive file lifecycle, locks, authentication, and deployment are backend contracts; treat them as out of scope for the UI redesign.

## 6. Category Command Wall design system

The visual identity is an executive retail category-management board, not a dark glass SaaS dashboard.

| Role | Token / rule |
| --- | --- |
| Canvas | Warm ivory `#F4F1EA` |
| Primary ink | Deep navy `#10233C` |
| Primary action | Cobalt `#1D5FD1` |
| Shopee marker | `#EE4D2D` |
| TikTok marker | Black `#111318`, optional cyan only as a channel cue |
| Semantic states | Success `#177A5B`, warning `#A96300`, critical `#C43D52` |
| Typography | `Prompt` for Thai UI text; `Outfit` with tabular numbers for metrics |
| Layout | 12-column desktop grid; 4/8 px spacing scale; 10-14 px radius |
| Surfaces | Thin rules and flat panels; no glassmorphism, gradients, or excessive nested cards |

Required reusable components:

- Global Context Bar
- KPI Strip
- Channel Matrix
- Trend Panel
- Signal / Attention Row
- Context Drawer
- Action Composer
- Scope Badge
- Data Health Banner
- Responsive Data Table

## 7. Files to start from

- `dashboard.html` - current standalone UI and client-side data/view logic.
- `PRODUCT.md` - product users, capabilities, and constraints.
- `DESIGN.md` - incumbent visual system; replace only after the new UI is built and verified.
- `backend/README.md` - backend RPC and explicit live-operation gates.
- `handoff/assets/ppg-dashboard-ui-mockup-board-2026-08-31.png` - 8-screen visual direction board.

## 8. Implementation sequence

1. Preserve all data and functions, then reshape the UI shell and global context bar.
2. Rename/reorganize views into the approved IA while mapping existing views and subtabs to the new destinations.
3. Build Executive Overview first, including data freshness, KPI strip, channel matrix, trend, Attention Queue, and open actions.
4. Build the five Performance drill-down views, preserving existing charts/tables where applicable.
5. Add Context Drawer and Action Composer; action metadata should include source, period, metric, platform, owner, due date, and status.
6. Build Data Health and Data Explorer fallbacks for partial, stale, error, empty, and unavailable-granularity states.
7. Update `DESIGN.md` to document the final rendered system only after visual review passes.

## 9. Acceptance checklist

- [ ] Overview answers the four executive questions within 30 seconds.
- [ ] A signal drills down in two interactions or fewer.
- [ ] An action can be created from an insight in three interactions or fewer.
- [ ] Filters remain consistent across all views.
- [ ] Day/week granularity rules and competitor benchmark scope are explicit.
- [ ] Desktop and mobile have no clipping, horizontal overflow, or inaccessible controls.
- [ ] Keyboard focus, contrast, ARIA labels, and reduced-motion handling meet WCAG AA expectations.
- [ ] `node --test backend/tests/*.test.mjs` passes if backend files are touched.
- [ ] No Sheets import, deployment, credential, or production-data change was performed unintentionally.

## 10. Handoff boundaries

- No Git repository was detected in this workspace. Do not assume a remote, branch, or deployment destination.
- Do not copy credentials, session cookies, API keys, or account data to the handoff.
- The generated mockup asset is safe to transfer; it contains no real PPG sales data.
