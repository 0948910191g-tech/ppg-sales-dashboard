---
name: PPG Category Command Wall Design System
description: Scope-first executive commerce workspace for PPG secured read-only sales, performance, review signals, and data health
colors:
  canvas: "#F4F1EA"
  ink: "#10233C"
  cobalt: "#1D5FD1"
  rule: "#D8D2C7"
  surface: "#FFFDF8"
  muted: "#5F6873"
  shopee: "#EE4D2D"
  tiktok: "#111318"
  success: "#177A5B"
  warning: "#A96300"
  critical: "#C43D52"
typography:
  fontFamily: "'Prompt', sans-serif"
  numFamily: "'Outfit', sans-serif"
  display:
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: "1.2"
  body:
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: "1.5"
  label:
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: "1.25"
rounded:
  control: "0.5rem"
  panel: "0.75rem"
  badge: "9999px"
spacing:
  unit: "0.25rem"
  control: "2.75rem"
  panel: "1rem"
---

# PPG Category Command Wall

## North star

An executive retail category-management board that answers, in order:
`Status -> KPI -> Trend -> Cause -> Action`.

The product is a scope-first, secured read-only sales workspace. It makes the selected period, comparison period, platform, category, coverage and live/fallback status visible before a user interprets any metric. It connects an Overview signal to Performance evidence and a Context Drawer; Phase 1 stops at an Action Walkthrough and does not persist a task.

## Visual language

- Warm ivory canvas `#F4F1EA`, deep navy ink `#10233C`, and cobalt action `#1D5FD1`.
- Flat warm-white panels `#FFFDF8` with thin rules `#D8D2C7`; no gradients, glassmorphism, or decorative nested-card depth.
- Shopee is marked with `#EE4D2D`; TikTok with `#111318`; semantic states use success `#177A5B`, warning `#A96300`, and critical `#C43D52`.
- Prompt is the UI font. Outfit with tabular numerals is used for GMV, orders, AOV, counts, and other metrics.
- Color reinforces a state but never carries the only meaning; labels, values, and status copy remain explicit.

## Information architecture

1. **Overview** — Data Through, source status, KPI strip, channel matrix, trend, Attention Queue, cause, and next review step.
2. **Performance** — Sales, Products, Marketing, Creators, and Competitors.
3. **Actions** — Phase 1 walkthrough with review context; persistent task list/status changes are Phase 2.
4. **Data Health** — secured source status, coverage, Data Through, unavailable/error state, and clearly labelled Historical Snapshot metadata.
5. **Data Explorer** — source-family availability, granularity, fallback, and benchmark-scope notes.

The Global Context Bar persists across destinations. Every review signal carries source, metric, period, comparison period, platform, and category context. Phase 1 has no create/update/delete task workflow; the same context becomes the input contract for persistent Actions in Phase 2.

## Reusable components

- **Global Context Bar**: four accessible scope controls plus an explicit live/fallback status.
- **Data Health Banner**: communicates secured live Read Model, allowlist/denied state, source error, or atomic Historical Snapshot fallback with Data Through and source/date labels.
- **KPI Strip**: compact, tabular values with explicit unavailable state `—` when the source does not support a metric.
- **Channel Matrix**: Shopee, TikTok, and total rows with selected-scope context.
- **Trend Panel**: daily sales visualization using only the selected daily source.
- **Attention Queue / Signal Row**: decision-worthy signals with evidence and Context Drawer entry points.
- **Context Drawer**: source metric, scope, evidence, and Phase 2 Action Walkthrough entry point.
- **Action Walkthrough**: review steps and captured source context; no persistent task mutation in Phase 1.
- **Scope Badge**: labels secured live read-only, Historical Snapshot, unavailable, denied, and Competitor Benchmark Snapshot states.
- **Responsive Data Table**: horizontally scrollable, keyboard-focusable shell with an accessible label.

## Data-safe display rules

- Product, Ads, Traffic, and Creator sources remain period/source scoped; never present aggregate rows as day/week results.
- For unsupported day/week granularity, show `ไม่มีข้อมูลระดับวัน/สัปดาห์ - ดูข้อมูลต้นฉบับได้ที่ Data Explorer`.
- Unknown or unavailable metrics render as `—`; never infer a zero, comparison, trend, or benchmark.
- Competitor data is visibly a separate benchmark snapshot and does not follow the selected sales period.
- Embedded sample counts and timestamps are labelled as Historical Snapshot/sample data, not as live or ETL audit facts.
- Google Sheets data is read only through the secured server seam. Browser code never reads a Sheet directly or receives the Spreadsheet identifier.
- Auth/allowlist errors remain denied and never fall back to Historical Snapshot. Non-auth live source failures may fall back atomically, with source and date labels.
- Import, canonical acceptance, Drive lifecycle, persistent Actions, role administration, and write RPCs are Phase 2 surfaces and remain hidden/disabled in Phase 1.

## Responsive and accessibility rules

- Desktop uses a primary 12-column-style workspace with a persistent navy navigation rail.
- Tablet collapses the rail into a horizontal navigation row; mobile stacks panels, wraps subtabs, and keeps the four global controls readable.
- Interactive controls use at least a 44px touch target. Table shells use `tabindex="0"`, `aria-label`, visible `:focus-visible` outlines, and horizontal scrolling where needed.
- Dialogs and signals expose labelled controls, roles, descriptions, and Escape/close behavior.
- `prefers-reduced-motion: reduce` minimizes animation and transition duration and disables smooth scrolling.
- Maintain WCAG AA contrast for body text, status copy, controls, and focus indicators.
