# แผน Phase 1 — Secured Read-only PPG Dashboard

## เป้าหมาย

เปลี่ยน Dashboard จากการอ่าน Google Sheets ตรง เป็น Apps Script Web App ที่ตรวจ Google Account และ `Users` allowlist ก่อนส่ง UI/ข้อมูล โดยคง Historical Snapshot เป็น fallback และเลื่อน import, canonical workflow และ Action writes ไป Phase 2

## ขอบเขต Phase 1

- Apps Script Web App แบบ secured read-only สำหรับ Google Accounts ที่อยู่ใน `Users`
- ใช้ Apps Script project เดิม แต่บังคับ `READ_ONLY` ฝั่ง server และปิด write RPC
- อ่านเฉพาะ `Daily_Sales`, `Product_Period`, `Ads_Period`, `Traffic_Period`, `Creator_Period` ผ่าน server
- สร้าง period options จาก coverage จริง และคำนวณ Sales comparison จาก `Daily_Sales` เท่าที่ coverage ครบ
- ใช้ `confirmed_gmv` เป็น Sales GMV; missing values ต้องเป็น `null/—` ไม่แปลงเป็นศูนย์
- Historical Snapshot ใช้เป็น fallback แบบ atomic พร้อมวันที่และแหล่งข้อมูลชัดเจน
- Competitor คงเป็น Benchmark Snapshot แยก scope จากช่วงยอดขาย
- Attention Queue จัดอันดับเพื่อ Review จาก live data โดยไม่เดา threshold ธุรกิจ
- Actions เป็น walkthrough เท่านั้น ไม่สร้างหรือเปลี่ยนงานจริง

## Public interfaces

- `doGet()` ตรวจ identity/allowlist ก่อนส่ง UI
- `getPhase1Bootstrap()` คืน user, coverage, periods, source availability และ data-through
- `getPhase1Data({start, end, platform})` คืน daily, products, ads, traffic, creators, comparison และ metadata
- ทุก RPC ใช้ envelope `{ok,data,meta,error}` และตรวจ allowlist ซ้ำทุก request

## Phase 2 roadmap

หลัง Phase 1 sign-off เท่านั้น: schema dry-run บนสำเนา, Drive/import adapters, accepted canonical batches, reconciliation/rollback, persistent Actions และ role administration จากนั้นจึงเพิ่ม Drive scopes และเปิด write RPC

## Test และ release gates

- ทดสอบ allowlisted/inactive/unknown user, blank identity, read-only mutation blocking, schema/date/platform validation, null preservation, period generation และ comparison coverage
- ทดสอบ missing tab, header mismatch, timeout และ permission error โดย auth error ต้องไม่ fallback
- Reconcile GMV/orders กับ Sheet ต้นทางอย่างน้อยหนึ่งเดือนและสองแพลตฟอร์ม
- Browser QA สำหรับ allowed/denied accounts, desktop/mobile, keyboard, focus และ fallback state
- ห้าม seed `Users`, แก้ Sheet จริง, push หรือ deploy จนได้รับอนุมัติแยก

## สมมติฐาน

- ผู้ชมทุกคนมี Google Account และได้รับ Sheet Viewer access
- `PPG_PHASE_MODE=READ_ONLY` และ `PPG_SPREADSHEET_ID` อยู่ใน Script Properties ฝั่ง server
- Historical Snapshot ได้รับอนุญาตให้แสดงแก่ allowlisted viewers
- ไม่มี Git repository; ไม่ทำ commit, production mutation หรือ deployment ในงานนี้
