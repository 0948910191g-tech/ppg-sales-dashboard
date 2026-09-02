# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **ผู้บริหารระดับสูง (C-Level / Business Owners)**: ต้องการมองเห็นภาพรวม Confirmed GMV, สัดส่วนยอดขายระหว่าง Shopee และ TikTok Shop, แนวโน้มจากช่วงที่มีข้อมูลจริง และสัญญาณที่ควรเปิด Review
- **ทีมการตลาด & E-commerce Operations**: ต้องการตรวจ performance ของ Ads, Product, Traffic และ Creator ในขอบเขต period ที่ source รองรับ พร้อม benchmark คู่แข่งที่มี scope แยกชัดเจน
- **ผู้มีสิทธิ์เข้าชม**: ผู้ใช้ Google Account ที่ได้รับอนุญาตตาม `Users` allowlist และยัง active; ผู้ไม่มีสิทธิ์ต้องไม่เห็นข้อมูลหรือ Historical Snapshot

## Product Purpose

ระบบแดชบอร์ดวิเคราะห์ยอดขายและการตลาดแบบ Omnichannel ระดับองค์กรที่ให้ผู้มีสิทธิ์อ่านข้อมูลจาก secured Read Model เพื่อช่วยตรวจ Confirmed GMV, performance และสัญญาณสำหรับการตัดสินใจ โดยแยก Historical Snapshot และ Competitor Benchmark Snapshot ออกจาก Live Sales scope อย่างชัดเจน

## Positioning

แดชบอร์ดที่รวม **ข้อมูลยอดขายและ performance ภายใน** กับ **ข้อมูลคู่แข่งเชิง benchmark** ใน single-page workspace เดียว โดยทำให้ช่วงข้อมูล, platform, coverage และสถานะ live/fallback เห็นก่อนตีความทุก metric ระบบคำนวณ comparison เฉพาะเมื่อ Daily Sales มี coverage ครบ และไม่สร้างตัวเลขทดแทนข้อมูลที่ขาด

## Operating Context

- **การใช้งานหลัก**: เปิดบน Apps Script Web App สำหรับมอนิเตอร์ช่วงข้อมูลที่มี coverage จริง ตั้งแต่วันต่อเนื่องหลายเดือนได้ โดยไม่ยึดช่วง Q3 หรือ period ที่ฝังตายตัว
- **สถานะข้อมูล**: แสดง Data Through เป็นวันที่ล่าสุดที่ข้อมูลครอบคลุม ไม่เรียกว่าเวลาที่ sync; เมื่อ live source ใช้ไม่ได้จะแสดง Historical Snapshot ทั้งชุดพร้อม source/date
- **การนำเสนอ & ส่งออก**: Phase 1 เน้นการอ่านและ Review; export, import และ workflow ที่เปลี่ยน state ต้องผ่าน scope และ approval ของ Phase 2 ก่อน

## Capabilities and Constraints

- **ความสามารถหลัก (Capabilities)**:
  - สรุป Confirmed GMV, Orders, AOV และ platform split จาก Daily Sales ที่อยู่ใน selected scope โดยแสดง `—` เมื่อ unavailable
  - Channel Scorecard และ Sales comparison เฉพาะช่วงที่ Daily Sales coverage ครบ
  - Trend รายวันจาก Daily Sales เท่านั้น โดยไม่สร้าง day/week aggregate จาก period-only sources
  - Product, Ads, Traffic และ Creator views ที่ระบุ source period และ platform scope
  - Attention Queue ที่จัดอันดับ Review signals จาก live rows โดยไม่อ้าง threshold ธุรกิจที่ไม่มีใน source
  - Competitor Benchmark Snapshot ที่แยกขอบเขตจาก selected Sales period
  - Historical Snapshot fallback แบบ atomic เมื่อ live source ล้มเหลวที่ไม่ใช่ auth failure
- **ข้อจำกัดทางเทคนิค (Constraints)**:
  - Browser ต้องไม่อ่าน Google Sheet โดยตรงและต้องไม่เห็น Spreadsheet identifier; protected data ส่งผ่าน server read seam เท่านั้น
  - Phase 1 เป็น secured read-only: server ตรวจ Google identity + `Users` allowlist ทุก request และปิด write/import/action/admin RPC
  - ใช้เฉพาะ approved View Tabs: `Daily_Sales`, `Product_Period`, `Ads_Period`, `Traffic_Period`, `Creator_Period`
  - missing values คงเป็น `null`/unavailable; ห้ามแปลงเป็นศูนย์หรือสรุป comparison จาก coverage ที่ไม่ครบ
  - UI ใช้ Tailwind CSS, FontAwesome 6, Chart.js และ Google Font "Prompt" ตาม design tokens

## Brand Commitments

- **ชื่อระบบ**: Omnichannel & Competitor Sales Executive Dashboard
- **โทนเสียงและภาษา (Voice & Tone)**: ทางการระดับผู้บริหาร เข้าใจง่าย ใช้ภาษาไทยเป็นหลักผสมผสานคำศัพท์เทคนิค E-commerce สากล
- **เอกลักษณ์ภาพ (Visual Identity)**: Warm ivory canvas, deep navy ink และ cobalt action ตาม Category Command Wall; Shopee/TikTok และ semantic state ใช้สีที่ระบุใน `DESIGN.md` พร้อม label ที่อ่านได้แม้ไม่มีสี

## Evidence on Hand

- **Frontend**: [`dashboard.html`](./dashboard.html) เป็น UI shell และ Historical Snapshot ที่ต้องติดป้ายว่า sample/historical เมื่อไม่ได้มาจาก live Read Model
- **Approved live sources**: View Tabs `Daily_Sales`, `Product_Period`, `Ads_Period`, `Traffic_Period` และ `Creator_Period`; headers/coverage ต้องตรวจผ่าน release gate ก่อนอนุมัติ deployment
- **Backend contract**: [`backend/README.md`](./backend/README.md) และ [`backend/HANDOFF.md`](./backend/HANDOFF.md) เป็นบริบทของ Apps Script RPC และ Phase 2 roadmap

## Product Principles

1. **Executive Clarity First**: ข้อมูลสำคัญต้องมองเห็น scope, status และตัวเลขได้ใน 3 วินาทีแรก
2. **Data Truth Before Action**: แสดง source, coverage, Data Through และ unavailable state ก่อนให้ผู้ใช้ตีความ; ไม่สร้างศูนย์หรือ trend จากข้อมูลที่ไม่มี
3. **Review Before Operations**: Attention Queue ช่วยจัดลำดับการ Review แต่ไม่ตัดสินแทนคนและไม่บันทึก Action ใน Phase 1
4. **Least Privilege by Default**: identity/allowlist และ read-only boundary ต้องบังคับจาก server ไม่ใช่ความร่วมมือของ browser
5. **Responsive and Accessible**: ใช้งานได้ดีบน desktop/tablet/mobile พร้อม keyboard, focus และ WCAG AA

## Phase boundaries

- **Phase 1**: secured Read Model, dynamic coverage periods, Sales comparison ที่ coverage ครบ, Historical Snapshot fallback, benchmark scope แยก และ Action walkthrough
- **Phase 2 (หลัง sign-off)**: canonical import, Drive lifecycle, accepted batches/reconciliation, persistent Actions และ role administration ตาม handoff

## Accessibility & Inclusion

- รองรับการใช้งานผ่านคีย์บอร์ดและ Screen Reader ด้วยโครงสร้าง HTML Semantics และ ARIA Roles ที่ได้มาตรฐาน WCAG 2.1 AA
