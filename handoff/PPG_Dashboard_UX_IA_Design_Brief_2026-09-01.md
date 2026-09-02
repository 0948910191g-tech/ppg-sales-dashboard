# PPG Dashboard — UX / User Flow / Information Architecture Design Brief

## วิธีใช้ไฟล์นี้

ให้ส่งไฟล์นี้ทั้งชุดให้ ChatGPT แล้วใช้คำสั่งว่า:

> จาก Product Context และ UX Requirements ด้านล่าง ให้ออกแบบ UX/UI ของแอปตามข้อกำหนดทั้งหมด โดยเริ่มจาก Information Architecture, User Flow และ Wireframe ก่อนทำ Visual Design ห้ามเริ่มจากการตกแต่งหน้าจอทันที

---

## 1. Product Context

ชื่อระบบ: **PPG Omnichannel Commerce Executive Dashboard**

ระบบนี้เป็น Web App สำหรับผู้บริหารและทีม E-commerce ใช้ตรวจยอดขายและ performance จากหลายช่องทาง ได้แก่ Shopee, TikTok Shop, Product, Ads, Traffic และ Creator

ระบบเป็น **secured read-only dashboard** ใน Phase 1 ผู้ใช้สามารถอ่านข้อมูลและเปิด Review Walkthrough ได้ แต่ยังไม่มีการสร้าง แก้ไข หรือลบ Action แบบถาวร

ผู้ใช้หลัก:

- ผู้บริหาร / Business Owner: ต้องการเห็นภาพรวมและสัญญาณสำคัญอย่างรวดเร็ว
- ทีม E-commerce Operations: ต้องการวิเคราะห์ยอดขาย สินค้า Ads Traffic และ Creator
- ผู้มีสิทธิ์เข้าชม: ต้องเห็นข้อมูลเฉพาะเมื่อผ่านการอนุญาตเท่านั้น

## 2. UX North Star

ออกแบบประสบการณ์ให้ผู้ใช้ตอบคำถามต่อไปนี้ได้ตามลำดับ:

1. ข้อมูลชุดนี้เชื่อถือได้หรือไม่
2. Performance ของธุรกิจเป็นอย่างไร
3. อะไรคือสัญญาณหรือสาเหตุที่ควรตรวจ
4. ควรเปิดหลักฐานอะไรต่อ
5. มีข้อมูลส่วนใดที่ยังสรุปไม่ได้

ลำดับการอ่านหลัก:

```text
Status → KPI → Trend → Cause → Review Action
```

## 3. Information Architecture

จัดกลุ่มเมนูหลักให้เหลือ 4 กลุ่ม เพื่อลดความซับซ้อนของเมนูเดิม:

```text
PPG Command Center
│
├── Command Center
│   └── Overview
│
├── Performance
│   ├── Sales
│   ├── Products
│   ├── Marketing
│   ├── Creators
│   └── Competitors
│
├── Review
│   ├── Attention Queue
│   ├── Context Drawer
│   └── Review Walkthrough
│
└── Data
    ├── Data Health
    └── Data Explorer
```

### Navigation Rules

- Overview เป็นหน้าเริ่มต้น
- Global Context ต้องคงอยู่หรือถูกส่งต่อระหว่างทุกหน้า
- Performance ใช้โครงสร้างเดียวกันทุก subsection
- Competitor ต้องแสดงเป็น Benchmark Snapshot แยกจาก Sales period
- Review คือการตรวจสอบและเปิดหลักฐาน ไม่ใช่ task management ใน Phase 1
- Data Health และ Data Explorer อยู่ในกลุ่ม Data เดียวกัน

## 4. Global Context

ทุกหน้าต้องมี context bar เดียวกัน:

```text
Period | Compare Period | Platform | Category
```

พร้อมสถานะข้อมูล:

```text
Secured Read-Only
Data Through: [date / —]
Live Read Model / Historical Snapshot / Unavailable
```

กฎ:

- เมื่อเปลี่ยน Period หรือ Platform ต้อง refresh ทุกส่วนที่ผูกกับ scope นั้น
- ห้าม reset context เมื่อเปลี่ยนหน้า
- Category ต้องแสดง unavailable หาก source ยังไม่มีข้อมูลรองรับ
- ต้องบอกให้ชัดว่า Data Through คือ coverage date ไม่ใช่ sync time

## 5. Main User Flow

```text
เปิด Web App
   ↓
ตรวจสอบสิทธิ์ผู้ใช้
   ├── ไม่ได้รับอนุญาต → Denied State
   └── ได้รับอนุญาต
          ↓
      Overview
          ↓
   ตรวจ Data Status
          ↓
   เลือก Period / Platform
          ↓
   อ่าน KPI
          ↓
   ดู Trend + Channel Matrix
          ↓
   เปิด Attention Queue
          ↓
   เปิด Context Drawer
          ↓
   เปิด Evidence ใน Performance
          ↓
   Review Walkthrough
```

Phase 1 ต้องจบที่ Review Walkthrough เท่านั้น ห้ามมี persistent task mutation

## 6. Core User Flows

### Flow A — Executive Overview

```text
Overview
 → ดู Data Health
 → ดู Confirmed GMV / Orders / AOV
 → ดู Channel Split
 → ดู GMV Trend
 → ดู Attention Queue
 → เลือก Review Signal
```

เป้าหมาย: ผู้บริหารต้องเข้าใจภาพรวมได้ภายใน 10–15 วินาที โดยไม่ต้องเปิดหลายหน้า

### Flow B — Diagnose Sales Problem

```text
Overview
 → เลือก KPI หรือ Attention Signal
 → เปิด Context Drawer
 → Open Sales Evidence
 → ดู Daily Breakdown
 → ตรวจ Shopee / TikTok
 → ตรวจ Coverage Reason
 → กลับมา Review
```

ทุกหน้าต้องส่งต่อ Metric, Period, Platform และ Source เดิมไปด้วย

### Flow C — Performance Investigation

```text
Performance
 → Sales / Products / Marketing / Creators
 → อ่าน Summary
 → อ่าน Table หรือ Chart
 → Filter ตาม Platform
 → เปิด Source Evidence
 → ส่งกลับ Review Context
```

### Flow D — Data Health

```text
Data
 → Data Health
 → ดู Source Availability
 → ดู Data Through
 → ดู Coverage
 → ดู Error / Fallback State
 → เปิด Data Explorer
```

### Flow E — Competitor Benchmark

```text
Performance
 → Competitors
 → เห็นป้าย Competitor Benchmark Snapshot
 → ดู Benchmark Scope
 → ดู Market / Share / Price Evidence
```

ห้ามทำให้ผู้ใช้เข้าใจว่า Competitor data เป็นข้อมูลใน Sales period เดียวกัน

## 7. Screen Requirements

| Screen | หน้าที่ | เนื้อหาหลัก | Primary Action |
|---|---|---|---|
| Overview | ภาพรวมสถานะธุรกิจ | Data Status, KPI, Trend, Channel Matrix, Attention Queue | เปิด Review Signal |
| Sales | วิเคราะห์ยอดขาย | Sales KPI, Daily Breakdown, Platform Comparison | ดู Sales Evidence |
| Products | วิเคราะห์สินค้า | Product Summary, SKU Table, Source Scope | เปิด Product Evidence |
| Marketing | วิเคราะห์ Ads/Traffic | Spend, Sales from Ads, ROAS, Traffic | ดู Marketing Evidence |
| Creators | วิเคราะห์ Creator | Creator Summary, GMV, Orders, Creator Rows | ดู Creator Evidence |
| Competitors | ดู benchmark | Benchmark Scope, Market Share, Competitor Table | ตรวจ Benchmark Scope |
| Review | รวมสัญญาณ | Attention Queue, Priority, Source Context | เปิด Context |
| Data Health | ตรวจสุขภาพข้อมูล | Source Status, Coverage, Data Through, Errors | ดู Source Status |
| Data Explorer | อธิบายข้อมูล | Source Family, Granularity, Fallback, Availability | ดูรายละเอียด source |

## 8. Required Data States

ต้องออกแบบ state เหล่านี้แยกกันอย่างชัดเจน:

1. Loading
2. Secured Live Read Model
3. Historical Snapshot
4. Source Unavailable
5. Comparison Unavailable
6. No Coverage
7. Access Denied
8. Partial Coverage
9. Period-only Source
10. Empty Review Queue

ตัวอย่าง UX Copy:

```text
ไม่มีข้อมูลเปรียบเทียบสำหรับช่วงที่เลือก
ข้อมูลชุดนี้รองรับเฉพาะระดับช่วงเวลา
Data Through: —
ไม่พบข้อมูลในช่วงเวลาที่เลือก
Historical Snapshot · Captured: [date]
Source coverage unavailable
```

## 9. Data Truth Rules

- ใช้ `—` เมื่อไม่มีข้อมูล ห้ามใช้ `0` แทนข้อมูลที่หายไป
- ห้ามแสดง comparison หาก coverage ของ current หรือ previous period ไม่ครบ
- Product, Ads, Traffic และ Creator เป็น period-scoped source
- ห้ามสร้าง daily หรือ weekly aggregate จาก source ที่รองรับเฉพาะ period
- Data Through ต้องหมายถึงวันที่ข้อมูลครอบคลุมถึง ไม่ใช่เวลาที่ระบบ sync
- Historical Snapshot ต้องมี label และ source/date ชัดเจน
- Auth failure ต้องแสดง Denied State และห้าม fallback เพื่อเปิดเผยข้อมูล
- Competitor Benchmark ต้องแยกจาก Sales period เสมอ
- ทุก Attention Signal ต้องแสดง Source, Metric, Period และ Review action

## 10. UX and Interaction Rules

- Context Drawer ใช้สำหรับดูหลักฐานและ metadata ของ signal
- ปุ่มหลักควรสื่อการกระทำชัด เช่น `Review`, `Open Evidence`, `View Source`
- หลีกเลี่ยงคำว่า `Create Action` หรือ `Assign Task` ใน Phase 1
- ทุกหน้าต้องมี breadcrumb หรือชื่อ context ที่บอกว่ากำลังดูข้อมูลของช่วงใด
- Filter ที่เปลี่ยนข้อมูลต้องมี feedback ว่ากำลัง loading หรือข้อมูลเปลี่ยนแล้ว
- Empty state ต้องบอกสาเหตุและทางไปต่อ ไม่ใช่แสดงพื้นที่ว่าง
- Error state ต้องแยก auth error ออกจาก source error
- Table ต้องอ่านได้บน mobile ด้วย horizontal scroll หรือ responsive row pattern
- Interactive control ทุกตัวต้องรองรับ keyboard และมี visible focus state

## 11. Responsive UX

### Desktop

- มี navigation rail หรือ grouped sidebar
- Global Context อยู่ด้านบนแบบ persistent
- Overview ใช้ 2-column layout สำหรับ Trend, Queue และ Evidence

### Tablet

- ยุบ sidebar เป็น horizontal navigation หรือ compact rail
- รักษา Global Context ให้ครบ 4 controls
- ลดจำนวน columns แต่ไม่ซ่อน Data Status

### Mobile

เรียงเนื้อหาตามลำดับ:

```text
Data Status
 → Context Controls
 → KPI
 → Trend
 → Attention Queue
 → Channel Matrix
 → Next Review
```

ห้ามซ่อน critical data state ไว้ใต้เมนูหรือ drawer ที่ผู้ใช้ต้องค้นหาเอง

## 12. Visual Direction สำหรับรอบออกแบบ UI

ให้คง visual identity จาก Design System เดิม:

- Canvas: `#F4F1EA`
- Panel: `#FFFDF8`
- Ink: `#10233C`
- Cobalt Action: `#1D5FD1`
- Shopee: `#EE4D2D`
- TikTok: `#111318`
- Success: `#177A5B`
- Warning: `#A96300`
- Critical: `#C43D52`
- UI Font: Prompt
- Metric Font: Outfit / tabular numerals

หลีกเลี่ยง:

- Generic SaaS dashboard
- Card จำนวนมากจนไม่มี hierarchy
- Gradient และ glassmorphism
- กราฟที่ดูเหมือนมีข้อมูลทั้งที่ coverage ไม่ครบ
- สีที่สื่อความหมายโดยไม่มี text label
- Visual decoration ที่แย่งความสนใจจาก Data Status และ Review action

## 13. สิ่งที่ต้องการให้ ChatGPT ส่งกลับมา

ให้จัดส่งผลลัพธ์ตามลำดับนี้:

1. UX diagnosis จาก requirements
2. Final Information Architecture
3. Primary User Flow และ edge-case flows
4. Sitemap / navigation model
5. Screen-by-screen wireframe description
6. Component hierarchy
7. State matrix: Loading, Live, Fallback, Unavailable, Denied
8. Desktop / Tablet / Mobile behavior
9. UX copy recommendations
10. Visual design direction
11. High-fidelity screen concepts สำหรับ Overview, Sales, Review และ Data Health
12. รายการ assumption ที่ต้องให้ Product Owner ยืนยัน

ห้ามข้ามขั้นตอน UX แล้วเริ่มจากการเลือกสีหรือวาด card ทันที

## 14. Definition of Done สำหรับ UX Design

- ผู้ใช้ใหม่รู้ว่าต้องเริ่มจากหน้าใด
- ผู้บริหารเห็น Data Status และ KPI ก่อนรายละเอียด
- ผู้ใช้สามารถไปจาก signal ไปยัง evidence ได้โดยไม่เสีย context
- ผู้ใช้แยก Live, Historical Snapshot, Unavailable และ Benchmark ได้ทันที
- ไม่มี flow ใดสื่อว่าระบบเขียนหรือบันทึก Action ใน Phase 1
- Mobile ยังรักษาลำดับ Status → KPI → Trend → Review
- ทุก unavailable state มีเหตุผลและทางไปต่อ
- ทุก screen มี primary action เดียวที่ชัดเจน
