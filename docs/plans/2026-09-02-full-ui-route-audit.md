# PPG Full UI Route Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ตรวจครบทุกหน้าของ `dashboard-reference-prototype.html`, แก้ navigation/interaction bug และเพิ่ม browser-level regression coverage ก่อน merge.

**Architecture:** คง UI และ product scope เดิมไว้ แต่ทำให้ hash routing มี owner เดียวและไม่ให้ legacy Overview/Sales router แย่ง route ของหน้าอื่น เพิ่ม Chromium smoke test เพื่อกดเมนูจริงและตรวจ visible route/console errors โดยยังคง static contract tests เดิม.

**Tech Stack:** Static HTML/CSS/JavaScript, Node.js `node:test`, Playwright Chromium ใน GitHub Actions.

**Spec:** `PRODUCT.md`, `DESIGN.md`, `dashboard-reference-prototype.html`

## Global Constraints
- Frontend production source คือ `dashboard-reference-prototype.html`.
- ไม่เปลี่ยน Product Direction หรือ Visual CI.
- Phase 1 ยังเป็น secured read-only.
- Unsupported data ต้องแสดง unavailable / `—` ไม่เดาเป็นศูนย์.
- ไม่แตะ Google production credential, Sheet หรือ Apps Script production deployment.

---

### Task 1: Browser regression gate

**Files:**
- Create: `tests/dashboard-browser-smoke.mjs`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: static dashboard HTML.
- Produces: browser smoke command that fails on route hangs, wrong hash, multiple visible views, or page errors.

- [ ] เพิ่ม smoke test ที่เปิด dashboard ผ่าน local HTTP server และกด route จริงทุกหน้า.
- [ ] รัน CI เพื่อยืนยัน RED กับ implementation ปัจจุบัน.
- [ ] เก็บ browser output เป็น artifact เมื่อ fail.

### Task 2: Single-owner route behavior

**Files:**
- Modify: `dashboard-reference-prototype.html`
- Test: `tests/dashboard-browser-smoke.mjs`, existing `tests/*.test.mjs`

**Interfaces:**
- Consumes: hashes `#overview`, `#sales-performance`, `#products`, `#marketing-ads`, `#creators`, `#competitors`, `#review`, `#review-walkthrough`, `#data-health`, `#data-explorer`.
- Produces: exactly one visible route surface and one active nav item per supported route.

- [ ] จำกัด legacy Overview/Sales controller ให้ดูแลเฉพาะสอง route ของตัวเอง.
- [ ] ให้ completion router เป็น owner ของ completion routes โดยไม่ถูก legacy fallback กลับ Overview.
- [ ] ลด event/listener conflict ที่ไม่จำเป็นโดยไม่รื้อ UI.
- [ ] รัน browser smoke + Node suite จนผ่าน.

### Task 3: Page completeness and interaction audit

**Files:**
- Modify only if defects are found: `dashboard-reference-prototype.html`
- Test: `tests/dashboard-browser-smoke.mjs`, existing route contract tests.

**Interfaces:**
- Consumes: page filters, chart tabs, review drawer, walkthrough, explorer tabs.
- Produces: operable local prototype interactions with no uncaught errors.

- [ ] ตรวจทุก primary page ว่ามี heading, KPI/primary evidence region และไม่มี blank surface.
- [ ] กด Ads filters/chart tabs, Review drawer/walkthrough, Data Explorer tabs และย้อนกลับ route.
- [ ] แก้เฉพาะ defect ที่ reproduce ได้และเพิ่ม regression assertion.

### Task 4: Final verification and handoff

**Files:**
- Modify: `backend/HANDOFF.md` only if status/known issue text must change.

**Interfaces:**
- Produces: verified branch ready for PR/merge.

- [ ] รัน full Node suite.
- [ ] รัน Chromium smoke suite.
- [ ] ตรวจ deployment package/frontend lock tests ยังผ่าน.
- [ ] เปิด PR, ตรวจ diff, รอ PR CI, merge และยืนยัน main CI สดอีกครั้ง.
