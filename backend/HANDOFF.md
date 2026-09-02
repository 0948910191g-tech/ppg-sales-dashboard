# PPG Sales Dashboard Backend v1 — Handoff

อัปเดต: 2026-08-31  (Asia/Bangkok)

## สถานะ

Backend v1 ถูกสร้างใน `backend/` โดยยังไม่แตะ Google Sheets/Drive จริง, ไม่ได้ import ข้อมูล production, ไม่ได้ `clasp push`, deploy หรือ commit

ผลทดสอบล่าสุด:

```text
node --test backend/tests/*.test.mjs
35 passed, 0 failed
```

Task 1 และ Task 2 ผ่านการตรวจทานโมเดลสูงแล้ว

Task 3 และ Task 4 มี implementation และ local tests แล้ว แต่ควรให้ reviewer ตรวจซ้ำบน Mac ก่อนเชื่อมระบบจริง โดยเฉพาะ import/reference retention, canonical acceptance, live adapters และ health freshness

## โครงสร้างไฟล์

- `appsscript.json` — Apps Script V8, timezone `Asia/Bangkok`, scopes ขั้นต่ำ
- `src/Config.gs` — ค่าคอนฟิกที่ไม่ฝัง Spreadsheet/Folder ID
- `src/Schema.gs` — manifest และ schema planner
- `src/ApiCore.gs` — response envelope `{ok,data,meta,error}`
- `src/Auth.gs` — domain identity, roles และ permission checks
- `src/Parsers.gs` — route/header/numeric parser สำหรับ Shopee/TikTok
- `src/Canonical.gs` — accepted-batch selection และ deterministic restatement
- `src/QueryService.gs` — dashboard aggregation, comparison, period availability
- `src/Repository.gs` — bounded Spreadsheet repository และ in-memory repository
- `src/SetupService.gs` — dry-run/setup, backup-before-write, folders/settings/admin
- `src/ImportService.gs` — upload queue, hash/idempotency, file lifecycle, status
- `src/ActionService.gs` — Action Tasks และ append-only history
- `src/Rpc.gs` — public Apps Script RPC facade
- `src/HealthService.gs` — system health checks
- `README.md` — contract และ local verification notes

## ไฟล์เก่า/ไฟล์ประกอบที่ต้องย้ายไปพร้อมโปรเจ็กต์

ให้ย้ายทั้งโฟลเดอร์โปรเจ็กต์ ไม่ใช่เฉพาะ `backend/` เพื่อคงบริบทเดิม:

- `dashboard.html` — static frontend เดิม ยังไม่ได้แก้
- `PRODUCT.md` — product requirements เดิม
- `DESIGN.md` — design notes เดิม
- `handoff/PPG_Dashboard_Handoff_2026-08-31.md` — handoff เดิม
- `handoff/assets/ppg-dashboard-ui-mockup-board-2026-08-31.png` — mockup asset
- `.superpowers/sdd/backend-v1/` — implementation briefs, reports และ progress ledger

โฟลเดอร์ `.codex/` และ `.impeccable/` เป็น metadata/tooling ของเครื่องเดิม ไม่จำเป็นต่อการรัน Backend บน Mac; เก็บไว้ได้ถ้าต้องการประวัติ แต่ไม่ควรนำไป deploy

## ทดสอบบน Mac

จากโฟลเดอร์โปรเจ็กต์:

```bash
node --test backend/tests/*.test.mjs
```

ถ้ามี Node รุ่นใหม่กว่า ให้ใช้ Node ที่รองรับ ES modules และ `node:test`

ยังไม่ต้องใช้ `clasp push` หรือ deploy จนกว่าจะตรวจ safety gates ครบ

## ก่อนเชื่อม Google Sheets จริง

1. สำรองไฟล์ `PPG_Sales_DB` และบันทึก Spreadsheet ID ไว้นอก source control
2. ตรวจ tabs/headers เดิมแบบ read-only
3. รัน schema dry-run และหยุดทันทีหากมีชื่อ tab เดิมแต่ header ไม่ตรง
4. ตรวจ adapter ของ Spreadsheet/Drive/Lock ใน `ImportService.gs`
5. ยืนยันว่า setup มี confirmation token และ first Admin
6. ทดสอบด้วยสำเนา template ใหม่ก่อนข้อมูลจริง
7. ทำ closed-period reconciliation และ rollback test
8. ขออนุมัติแยกก่อน import production และ deploy Web App

## Contract สำคัญ

- Canonical GMV/Orders มาจาก `DB_Canonical_Daily` เท่านั้น
- Product/Ads/Traffic/Creator/Competitor เป็น period-only ห้ามบวก GMV ซ้ำ
- แถวที่ batch ยังไม่ `ACCEPTED` ห้ามแสดงบน Dashboard
- Restatement เก็บทุก batch แต่เลือก accepted ล่าสุดแบบ deterministic
- Day/Week ที่ไม่มี granularity ต้องตอบ `available:false` ไม่ใช่ศูนย์
- ทุก public RPC ใช้ envelope เดียวกันและตรวจ permission ฝั่ง server
- Roles: `EXECUTIVE`, `ANALYST`, `OPERATOR`, `ADMIN`
- Source period ต้องแยกจาก imported timestamp

## Public RPC

`getBootstrap`, `getDashboard`, `getProducts`, `getMarketing`, `getCreators`, `getCompetitors`, `uploadFiles`, `getImportStatus`, `listImportBatches`, `listActions`, `createAction`, `updateAction`, `changeActionStatus`, `listUsers`, `setUserRole`, `getSystemHealth`

## ไฟล์ประกอบการพัฒนา

- `.superpowers/sdd/backend-v1/progress.md` — ledger สถานะงาน
- `.superpowers/sdd/backend-v1/task-1-report.md`
- `.superpowers/sdd/backend-v1/task-2-report.md`
- `.superpowers/sdd/backend-v1/task-3-report.md`
- `.superpowers/sdd/backend-v1/task-4-report.md`

## สิ่งที่ยังไม่ทำ

- ยังไม่แก้ `dashboard.html`
- ยังไม่ตั้งค่า `.clasp.json` ที่มี Spreadsheet ID จริง
- ยังไม่สร้าง deployment configuration production
- ยังไม่เชื่อม Google identity/Drive จริง
- ยังไม่ import XLSX จริงจาก Inbox
