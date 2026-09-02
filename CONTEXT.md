# PPG Sales Dashboard

คำศัพท์ร่วมของพื้นที่ทำงานสำหรับดูยอดขายและ performance แบบมีขอบเขตชัดเจน โดยแยกข้อมูลที่ใช้ตัดสินใจได้จากข้อมูลที่ยังไม่พร้อมใช้งาน

## Sales and coverage

**Confirmed GMV**:
ยอดขายสินค้าที่ผ่านสถานะยืนยันแล้ว และเป็นตัวเลขหลักสำหรับสรุป Sales ของ Dashboard
_Avoid_: Gross GMV, estimated GMV, revenue (เมื่อหมายถึงคนละ metric)

**Coverage**:
ช่วงวันที่และแพลตฟอร์มที่มีข้อมูลของ source ครบพอให้แสดงหรือเปรียบเทียบได้
_Avoid_: freshness (Coverage ไม่ได้หมายถึงเวลาที่ข้อมูลถูก sync)

**Data Through**:
วันที่ล่าสุดที่ชุดข้อมูลนั้นครอบคลุมถึง ใช้บอกขอบเขตของข้อมูล ไม่ใช่เวลาที่ระบบดึงข้อมูล
_Avoid_: last synced, real-time timestamp

**Comparison Period**:
ช่วงข้อมูลก่อนหน้าที่มีขอบเขตเทียบเคียงกับช่วงที่เลือกและมี Coverage รองรับ
_Avoid_: automatic trend, inferred comparison

## Read model and snapshots

**Read Model**:
ชุดข้อมูลที่จัดรูปเพื่อการอ่านและวิเคราะห์ โดยไม่ถือเป็นแหล่งรับรองสำหรับการแก้ไขข้อมูลต้นทาง
_Avoid_: canonical write model, source of truth (เมื่อหมายถึงข้อมูลสำหรับการเขียน)

**View Tab**:
ตารางมุมมองที่เผยแพร่เพื่อให้ Dashboard อ่านตามขอบเขตที่กำหนด ไม่ใช่ตารางนำเข้าแบบ canonical
_Avoid_: raw import, canonical table

**Historical Snapshot**:
ชุดข้อมูลย้อนหลังที่บันทึกไว้เพื่อให้ผู้มีสิทธิ์ยังดูบริบทเดิมได้เมื่อ Live Read Model ใช้งานไม่ได้
_Avoid_: live fallback, current data

**Competitor Benchmark Snapshot**:
ภาพเปรียบเทียบคู่แข่ง ณ ขอบเขตการเก็บข้อมูลของ benchmark ซึ่งแยกจากช่วง Sales ที่ผู้ใช้เลือก
_Avoid_: competitor Sales period, live market share

## Review and access

**Attention Queue**:
รายการสัญญาณจากข้อมูลที่มีอยู่ เรียงเพื่อให้มนุษย์เปิด Review ต่อ ไม่ใช่รายการงานที่ระบบสั่งให้ทำ
_Avoid_: alert threshold, automated action queue

**Review Signal**:
ข้อสังเกตที่ผูกกับ source, metric และช่วงข้อมูลอย่างชัดเจน เพื่อให้ผู้ใช้ตรวจหลักฐานก่อนตัดสินใจ
_Avoid_: business verdict, automated recommendation

**Allowlist User**:
ผู้ใช้ Google Account ที่มีรายการอยู่ใน `Users` และสถานะ active จึงมีสิทธิ์เข้าถึง Dashboard
_Avoid_: anyone with the link, Sheet viewer (สิทธิ์เปิด Sheet ไม่เท่ากับสิทธิ์เข้า Dashboard)

**Read-only Phase**:
ขอบเขตการใช้งานที่ผู้ใช้ดูข้อมูลและ Review ได้ แต่ยังไม่สร้าง แก้ไข หรือนำเข้าข้อมูลถาวร
_Avoid_: operational mode, write-enabled dashboard

**Action Walkthrough**:
ทางเดินตัวอย่างจากสัญญาณไปยังแนวทางปฏิบัติ ซึ่งยังไม่บันทึกเป็นงานถาวรใน Phase 1
_Avoid_: persistent Action, task creation
