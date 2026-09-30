# Restaurant Order Management System (Group 10)

ระบบจัดการออเดอร์ร้านอาหาร: ลูกค้าสแกน QR ที่โต๊ะเพื่อสั่งอาหาร และพนักงาน/แอดมินจัดการออเดอร์ เมนู สต็อก พนักงาน และรายงาน

## Structure
| Folder | หน้าที่ |
|---|---|
| `docs/` | เอกสาร proposal, ER diagram, user flows, สไลด์นำเสนอ |
| `database/` | schema, triggers, seed data, report queries (MySQL) |
| `backend/` | API + business logic + auth/role |
| `frontend/` | `customer/` (สั่งอาหาร) และ `staff/` (dashboard ฯลฯ) |
| `design/` | ลิงก์ Figma / FigJam |

## Getting started
1. `git clone <repo-url>`
2. สร้างฐานข้อมูล: รัน `database/schema.sql` -> `triggers.sql` -> `seed.sql`
3. Backend: copy `backend/.env.example` เป็น `backend/.env` แล้วใส่ค่าจริง
4. (เติมคำสั่งรันเมื่อเลือก stack แล้ว)

## Team workflow
- ห้าม push ตรงเข้า `main` ให้แตก branch เช่น `feature/checkout-page` แล้วเปิด Pull Request
- ห้าม commit ไฟล์ `.env`

## Timeline
Week 8 Proposal · Week 9 ER + Schema · Week 10-11 UI Mockups · Week 12-13 Backend + Triggers · Week 14 Integration/QA · Week 15 Final
