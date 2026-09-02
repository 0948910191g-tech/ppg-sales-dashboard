# Secured read model before operations

**Status: accepted** — Phase 1 เปิด Dashboard ผ่าน Google Account และ `Users` allowlist แล้วให้บริการเฉพาะ Read Model จาก approved View Tabs; งาน import, canonical workflow, persistent Actions และ role administration จะเปิดหลัง Phase 1 sign-off ใน Phase 2 เพื่อให้ความเสี่ยงด้านการเข้าถึงและความถูกต้องของข้อมูลถูกพิสูจน์ก่อนเปิดความสามารถที่เปลี่ยน state ได้

## Considered options

- เปิด operational backend และ write workflow พร้อม Dashboard ตั้งแต่แรก: เลือกไม่ได้ เพราะเพิ่ม blast radius ก่อนมีหลักฐานเรื่อง identity, source coverage และ rollback
- ใช้ลิงก์หรือ Sheet viewer เป็น access control: เลือกไม่ได้ เพราะสิทธิ์ดู Sheet ไม่ใช่ policy ของ Dashboard และไม่เพียงพอสำหรับการคุม scope
- เริ่มจาก secured read model แล้วค่อยเพิ่ม operations: เลือก เพราะลดขอบเขตการเปลี่ยนแปลงและทำให้ release gate ตรวจได้แบบไม่ mutate production

## Consequences

- Phase 1 ต้องแสดง missing data, fallback และ benchmark scope อย่างชัดเจน และห้ามแปลงข้อมูลที่ไม่มีเป็นศูนย์
- ผู้ใช้จะเห็น Action walkthrough แทน persistent task จนกว่าจะมีการอนุมัติ Phase 2
- การใช้ Apps Script project เดิมต่อเนื่องได้ แต่ทุก write path ต้องถูกปิดฝั่ง server จนกว่า gate และ approval ของ Phase 2 จะผ่าน
