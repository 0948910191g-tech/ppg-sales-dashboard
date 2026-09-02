# Phase 1 secured read-only release gate

เอกสารนี้เป็น verification package สำหรับ Phase 1 ของ PPG Dashboard ตาม [spec](../phase-1-secured-readonly-dashboard/spec.md) และ [แผน](../phase-1-secured-readonly-dashboard/plan.md) ใช้เป็น checklist ก่อนขออนุมัติ deployment เท่านั้น ไม่ใช่หลักฐานว่า production ผ่านแล้ว

## Release status

| Gate | Owner | Status | Evidence / exit condition |
| --- | --- | --- | --- |
| Automated contract suite | Engineering | `PASS (local)` | `node --test backend/tests/*.test.mjs tests/*.test.mjs` ผ่าน โดยรวม Phase 1 release tests; ยังไม่ใช่ production approval |
| Browser QA | Product + Engineering | `PENDING` | Allowed/denied, desktop/mobile, keyboard/focus และ fallback checklist ผ่าน พร้อมบันทึก browser/version/date |
| Source reconciliation | Data owner | `PENDING` | ปิดงวดอย่างน้อย 1 เดือน ครอบคลุม Shopee และ TikTok และยอด GMV/Orders ตรงกับ source Sheet |
| Deployment approval | Product owner + Data owner | `PENDING_APPROVAL` | ผู้อนุมัติลงชื่อหลัง gates ก่อนหน้าเป็น `PASS` เท่านั้น |
| Rollback readiness | Engineering + Product owner | `PENDING` | เวอร์ชันก่อนหน้าและขั้นตอน revert ได้รับการทดลอง/ยืนยันก่อน release |

ห้ามเปลี่ยนสถานะเป็น `APPROVED` จากผล local test เพียงอย่างเดียว และห้าม deploy, `clasp push`, seed `Users` หรือแก้ production Sheet ใน ticket นี้

## Remediation rerun evidence — 2026-09-01

ผลนี้เป็น engineering evidence จาก local fixtures เท่านั้น ยังไม่ใช่ production approval และไม่แทนที่ human QA, reconciliation, approval หรือ rollback gates

| Remediation | Evidence | Result |
| --- | --- | --- |
| Ticket 01 — secured Web App boundary | `node --test backend/tests/phase1-remediation-boundary.test.mjs` | `PASS` — allowlisted workspace serves the app; wrong/missing workspace is denied before protected reads |
| Ticket 01 — local deployable package proof | `node --test backend/tests/phase1-deployment-package.test.mjs` | `PASS (local)` — temporary package root contains `appsscript.json`, `dashboard.html`, and only the six Phase 1 server files; VM resolution, dashboard file render seam, least-privilege manifest, and read-only repository surface pass |
| Ticket 02 — safe Sheet-backed rendering | `node --test tests/phase1-remediation-ui-release.test.mjs tests/dashboard-data-contract.test.mjs` | `PASS` — hostile labels are rendered as text; local preview is explicitly non-protected |
| Ticket 03 — truthful fallback/source failures | `node --test backend/tests/phase1-remediation-data.test.mjs` | `PASS` — server-provided atomic snapshot or explicit unavailable state |
| Ticket 04 — complete comparison coverage | `node --test backend/tests/phase1-remediation-data.test.mjs` | `PASS` — missing dates or unusable `confirmed_gmv` keep comparison unavailable |
| Ticket 05 — minimum deployment authority | `node --test backend/tests/phase1-remediation-boundary.test.mjs` | `PASS` — manifest has read-only Spreadsheet and identity scopes only; no Drive service |
| Ticket 06 — combined automated evidence | `node --test backend/tests/*.test.mjs tests/*.test.mjs` | `PASS` — 132/132 tests passed locally after the Sol review loop; still requires human gates below |

### Local deployable package proof — 2026-09-01

`node --test backend/tests/phase1-deployment-package.test.mjs` builds into an OS temporary directory only. The package root is verified to contain exactly:

```text
appsscript.json
dashboard.html
Config.gs
ApiCore.gs
Auth.gs
Phase1Repository.gs
Phase1ReadModel.gs
Rpc.gs
```

The local test loads those server files in a VM, proves `createHtmlOutputFromFile('dashboard')` has a matching `dashboard.html` in the same root, verifies the read-only Spreadsheet and identity scopes, and checks that Phase 2 service modules, Drive operations, write-capable repository APIs, secrets, and production identifier values are absent. This is local package evidence only; deployment, Web App smoke testing, production access, and human approval remain pending.

### Deployable Web App smoke test — approval-gated, not run locally

Run only after written Product owner and Data owner approval. This is a test procedure, not authorization to deploy:

1. Create or select a non-production Apps Script deployment using the manifest and source in this package; do not run `clasp push` or change production.
2. With an active `Users` account in the expected workspace, open the Web App URL and record that `doGet` serves the Dashboard and `getPhase1Bootstrap` reports `Secured Read Model`.
3. With an unknown, inactive, blank, or wrong-workspace account, record the denied page and verify no GMV, rows, Historical Snapshot, Spreadsheet ID, or protected source text is present.
4. Induce a non-auth source failure only in the approved test environment and record either the server-provided atomic `Historical Snapshot` with source/capture date or the safe unavailable state.
5. Record browser, account class, workspace class, viewport, timestamp, URL/version, and evidence hash in the Browser QA section; do not mark production approved from this smoke test alone.

## Automated test matrix

ให้ทดสอบผ่าน public seams (`doGet`, `getPhase1Bootstrap`, `getPhase1Data` และ mutation RPC facade) ด้วย fixture ที่กำหนดผลลัพธ์อิสระจาก implementation

| Area | Scenario | Expected result | Test evidence |
| --- | --- | --- | --- |
| Identity | Google identity เป็น allowlisted + active | ได้ envelope สำเร็จและข้อมูล scope ของ user โดยไม่เปิดข้อมูลเกิน workspace | Phase 1 RPC test |
| Identity | identity ว่าง, unknown หรือ inactive | `ok:false`, stable auth error, `data:null`; ไม่เผยข้อมูลและไม่ fallback | Phase 1 RPC test |
| Allowlist | `Users` row ผิด workspace/role หรือ inactive | ถูก deny ฝั่ง server ทุก request | Phase 1 RPC test |
| Read-only | `uploadFiles`, `createAction`, `updateAction`, `changeActionStatus`, `setUserRole` | `ok:false`, `error.code=READ_ONLY`; repository ไม่มี write | Phase 1 RPC test |
| Validation | วันที่ผิด, start หลัง end, platform นอก Shopee/TikTok | stable validation error; ไม่อ่าน source ต่อ | Phase 1 RPC test |
| Sources | bootstrap/data ใช้เพียง 5 approved View Tabs | source availability/coverage ระบุชื่อและสถานะอย่างชัดเจน | Phase 1 RPC test |
| Null safety | `confirmed_gmv` หรือ metric สำคัญว่าง | คงเป็น `null`/unavailable และ UI แสดง `—`; ห้ามกลายเป็น `0` | Phase 1 RPC + dashboard contract |
| Periods | มี coverage หลายเดือนต่อเนื่อง | period options มาจาก coverage จริง ไม่ยึด Q3 หรือ period คงที่ | Phase 1 RPC + dashboard contract |
| Comparison | Daily Sales ครอบคลุม current และ prior ไม่ครบ | `comparison.available=false` หรือ unavailable; ไม่สร้าง trend | Phase 1 RPC test |
| Period scope | Product/Ads/Traffic/Creator เป็น period-only | คืน rows พร้อม source period; ไม่สร้าง daily/weekly aggregate ปลอม | Phase 1 RPC test |
| Source failure | missing tab, header mismatch, timeout, permission error | error/warning ปลอดภัยและ observable; ห้ามส่ง partial mixed scope | Phase 1 RPC test |
| Fallback | live source ล้มเหลวแบบไม่ใช่ auth error | ใช้ Historical Snapshot ทั้งชุด พร้อม source/date label | Phase 1 RPC + browser QA |
| Auth boundary | auth/allowlist failure ขณะมี snapshot | deny ต่อไป; ห้าม fallback เพื่อหลบ access control | Phase 1 RPC test |
| Benchmark | competitor data ถูกอ่าน | แสดงเป็น Competitor Benchmark Snapshot แยกจาก Sales period | dashboard contract + browser QA |
| Review | เปิด Attention Queue/Context Drawer | มี source/metric/period ให้ Review และไม่เขียน state | dashboard contract + browser QA |

## Browser QA checklist

บันทึกผลจริงใน release record พร้อม browser/version, viewport, account class และ timestamp

### Allowed account

- [ ] เปิด Web App ด้วย Google Account ที่ active ใน `Users` ได้
- [ ] เห็นสถานะ secured read-only และ selected period/platform ก่อนอ่านตัวเลข
- [ ] period options สอดคล้องกับ coverage จริงและ Data Through ไม่ถูกเรียกว่า sync time
- [ ] Live error ที่ไม่ใช่ auth แสดง Historical Snapshot แบบ atomic พร้อม source/date
- [ ] Competitor แสดง benchmark scope แยกจาก Sales period

### Denied account

- [ ] unknown, inactive และ blank identity ได้ denied state เดียวกันในแง่การไม่เผยข้อมูล
- [ ] หน้า denied ไม่แสดง GMV, rows, snapshot data, Spreadsheet ID หรือ implementation details
- [ ] refresh/retry ไม่ข้าม allowlist และไม่เปิด snapshot ให้ผู้ไม่มีสิทธิ์

### Layout and accessibility

- [ ] Desktop: 1440px และ 1280px ไม่ตัด global context, status หรือ table
- [ ] Mobile: 390px และ 412px อ่าน scope/status ได้ ไม่ต้อง horizontal-scroll ทั้งหน้า
- [ ] ทุก control สำคัญ keyboard-focus ได้ มี visible focus และลำดับ tab สมเหตุผล
- [ ] Attention signal และ Context Drawer มี label/role/description และปิดด้วย Escape ได้
- [ ] สีไม่ใช่ความหมายเพียงอย่างเดียว และ contrast ผ่าน WCAG AA ตาม project design
- [ ] `prefers-reduced-motion` ไม่ทำให้ข้อมูลหรือ focus หาย

## Source reconciliation record

ทำแบบ read-only จากสำเนาหรือ source Sheet ที่ได้รับอนุญาต ห้ามแก้ cell เพื่อให้ตัวเลขตรง

| Field | Value to record |
| --- | --- |
| Closed period | `YYYY-MM-DD` ถึง `YYYY-MM-DD` |
| Platforms | `SHOPEE`, `TIKTOK` |
| Source spreadsheet / tab | ชื่อที่อนุมัติและลิงก์ภายในที่ไม่ใส่ใน frontend |
| Dashboard request | `start`, `end`, `platform` |
| Source confirmed GMV | ค่าที่อ่านได้แยก platform |
| Dashboard confirmed GMV | ค่าจาก `getPhase1Data` แยก platform |
| GMV variance | ต้องเป็น `0` หรืออยู่ใน tolerance ที่ Data owner อนุมัติและบันทึกเหตุผล |
| Source orders | ค่าที่อ่านได้แยก platform |
| Dashboard orders | ค่าจาก `getPhase1Data` แยก platform |
| Orders variance | ต้องเป็น `0` หรืออยู่ใน tolerance ที่ Data owner อนุมัติและบันทึกเหตุผล |
| Reviewer / date | ผู้ตรวจและวันที่ตรวจ |

หาก source มี missing value ให้บันทึกเป็น unavailable ตาม source และตรวจว่าผล Dashboard เป็น `null`/`—` ไม่ใช่ศูนย์

## Deployment approval gate

1. Engineering แนบผล automated suite และ browser QA ที่ `PASS`
2. Data owner แนบ reconciliation ของ closed period และยืนยัน source/coverage
3. Product owner ตรวจว่า Phase 1 ไม่มี import, canonical acceptance, persistent Actions หรือ role administration
4. Engineering ตรวจว่า Script Properties/identity/allowlist ถูกตั้งใน deployment environment ที่ถูกต้อง โดยไม่ใส่ ID หรือ secret ใน source control
5. Product owner และ Data owner อนุมัติ deployment เป็นลายลักษณ์อักษร
6. หลัง approval จึงค่อยสร้าง/ปรับ deployment ตาม runbook ที่แยกจากเอกสารนี้

ช่องอนุมัติ:

| Role | Name | Decision | Date | Notes |
| --- | --- | --- | --- | --- |
| Engineering |  |  |  |  |
| Data owner |  |  |  |  |
| Product owner |  |  |  |  |

## Rollback gate

- [ ] เก็บ deployment/version ก่อนหน้าและ URL ที่ตรวจสอบได้
- [ ] เก็บ hash/สำเนาของ `dashboard.html` และ Apps Script source ที่จะ release
- [ ] ยืนยันว่า rollback เปลี่ยนเฉพาะ code deployment ไม่เขียนหรือลบข้อมูลใน source Sheet
- [ ] ทดสอบขั้นตอน revert บน non-production หรือ dry-run และบันทึกผล
- [ ] กำหนดผู้ตัดสินใจ rollback และ trigger ที่ชัดเจน: auth leak, unauthorized data, incorrect GMV/Orders, mixed fallback หรือ write path เปิดโดยไม่ตั้งใจ
- [ ] หลัง rollback รัน denied/allowed smoke test และตรวจว่า source data ไม่ถูก mutate

การ rollback ต้องหยุดการ promote version ใหม่ก่อนเสมอ และต้องมี human approval สำหรับการคืน deployment; ห้ามใช้ rollback เป็นเหตุผลในการแก้ข้อมูล production อัตโนมัติ

## Phase 1 exit and Phase 2 handoff

Phase 1 จบเมื่อ release gates ทั้งหมดผ่านและมี approval แยกแล้วเท่านั้น จากนั้นจึงเปิดงาน Phase 2 ตาม [HANDOFF](../../backend/HANDOFF.md): canonical import, Drive lifecycle, reconciliation/rollback, persistent Actions และ role administration การเพิ่ม write scope ต้องมี ADR/approval และ test matrix ชุดใหม่
