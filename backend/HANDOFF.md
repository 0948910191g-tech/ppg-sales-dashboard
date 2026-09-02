# PPG Sales Dashboard — Phase 1 Handoff

อัปเดต: 2026-09-02 (Asia/Bangkok)

## สถานะปัจจุบัน

Phase 1 อยู่ในสถานะ **repository beta-ready / secured read-only** สำหรับขั้นทดสอบกับ Google Apps Script และสำเนา Google Sheet ที่ได้รับอนุมัติ ยังไม่ถือว่า production deployment เสร็จ

Frontend ที่ยึดเป็นตัวล่าสุดคือ `dashboard-reference-prototype.html` และ build script จะนำไฟล์นี้ออกเป็น `dashboard.html` ภายใน Apps Script deployment package โดยตรง เพื่อไม่ให้เผลอ deploy `dashboard.html` รุ่นเก่า

GitHub Actions ถูกเพิ่มแล้วที่ `.github/workflows/ci.yml` และรันทั้ง backend + dashboard test suite ทุก push/PR

ผลยืนยันล่าสุดจาก GitHub Actions:

```text
178 tests
178 passed
0 failed
```

Verified workflow run: `33585533686`

## Phase 1 Deployment Package

คำสั่ง build:

```bash
node backend/scripts/build-phase1-appsscript.mjs <empty-output-directory>
```

Package มีเฉพาะ:

- `appsscript.json`
- `dashboard.html` — สร้างจาก `dashboard-reference-prototype.html`
- `Config.gs`
- `ApiCore.gs`
- `Auth.gs`
- `Phase1Repository.gs`
- `Phase1ReadModel.gs`
- `Rpc.gs`

โมดูล write-capable เช่น `ImportService.gs`, `ActionService.gs`, `SetupService.gs` และ repository แบบ write ไม่ถูกนำเข้า Phase 1 deployment package

## Security / Access Boundary

- `phaseMode` = `READ_ONLY`
- ผู้ใช้ต้องผ่าน Google identity + `Users` allowlist
- ต้องตรงกับ configured workspace
- Spreadsheet ID อ่านจาก Apps Script Script Property `PPG_SPREADSHEET_ID`
- Browser ไม่ได้รับ Spreadsheet ID
- Auth / allowlist failure ต้อง fail closed และไม่ fallback ไป Historical Snapshot
- Write/admin RPC เดิมถูกคงชื่อไว้เพื่อ compatibility แต่ตอบ `READ_ONLY`
- OAuth scope ของ package ใช้ `spreadsheets.readonly` + `userinfo.email`

## Data Contract สำคัญ

- Confirmed GMV/Orders ใช้ secured read model เท่านั้น
- Product / Ads / Traffic / Creator เป็น source/period scoped และห้ามนำยอดมาบวกซ้ำกับ Sales canonical
- ค่า unsupported หรือไม่มี coverage แสดง `—` / unavailable ไม่เดาเป็นศูนย์
- Data Through หมายถึงวันที่ข้อมูลครอบคลุมถึง ไม่ใช่เวลาที่ sync ล่าสุด
- Competitor Benchmark Snapshot ต้องแยก period จาก selected Sales scope
- Historical Snapshot เป็น fallback ที่ติดป้าย source/date ชัดเจน ไม่ใช่ live data

## Automated Verification

CI รันคำสั่ง:

```bash
node --test backend/tests/*.test.mjs tests/*.test.mjs
```

Coverage ปัจจุบันรวม:

- Auth / allowlist / workspace isolation
- Secured Phase 1 read model
- Source/error/fallback behavior
- Read-only RPC boundary
- Deployment package least-privilege gate
- Frontend production lock
- Dashboard routes / flows / accessibility
- Data contract / unavailable states
- Release-gate documentation contracts

Test output ถูกเก็บเป็น GitHub Actions artifact ชื่อ `phase1-test-output` ทุก run เพื่อใช้ตรวจ regression

## สิ่งที่ยังไม่ได้ทำ และไม่ควรทำอัตโนมัติจาก repo

สิ่งต่อไปนี้ต้องใช้ Google environment / credential / approval จริง จึงยังไม่ claim ว่าเสร็จ:

1. ยังไม่ได้ตั้ง `.clasp.json` production
2. ยังไม่ได้ตั้ง Script Properties จริง (`PPG_SPREADSHEET_ID`, `PPG_EXPECTED_WORKSPACE_ID`)
3. ยังไม่ได้เชื่อม Google Sheet production จริง
4. ยังไม่ได้ deploy Apps Script Web App production
5. ยังไม่ได้รัน browser E2E ด้วย Google Account allowlist จริง
6. ยังไม่ได้ทำ closed-period reconciliation กับข้อมูล production
7. ยังไม่ได้ทดสอบ rollback/recovery บน production copy
8. Phase 1 ยังไม่เปิด Import / persistent Actions / role administration

## Beta Gate ถัดไป

เมื่อได้รับ Google Sheet สำเนาทดสอบและสิทธิ์ที่เหมาะสม ให้ทำตามลำดับ:

1. Build Phase 1 package จาก branch/main ที่ CI ผ่าน
2. สร้าง Apps Script test project แยกจาก production
3. ตั้ง Script Properties ใน Apps Script เท่านั้น ห้าม commit credential/ID ลง Git
4. Deploy test Web App
5. ทดสอบ allowlisted user / inactive user / unauthorized user
6. ตรวจ Overview, Sales, Products, Marketing, Creators, Competitors, Review, Data Health และ Data Explorer กับ source ที่มีจริง
7. ทำ data reconciliation กับช่วงข้อมูลปิดหนึ่งช่วง
8. ทดสอบ source unavailable และ fallback label
9. บันทึก Known Issues / friction / setup time
10. ขออนุมัติแยกก่อน production deployment หรือเปิด write-capable Phase 2

## Local Verification

ถ้ามี repo อยู่บนเครื่อง:

```bash
node --test backend/tests/*.test.mjs tests/*.test.mjs
```

หาก test ใด fail ให้แก้ root cause ก่อน deploy ห้าม bypass release gate หรือแก้ด้วยการปิด test
