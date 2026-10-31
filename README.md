# All About Food! — Restaurant Order Management System (Group 10)

ระบบจัดการออเดอร์ร้านอาหาร: ลูกค้าสแกน QR ที่โต๊ะเพื่อสั่งอาหาร หรือจองโต๊ะล่วงหน้า ส่วนพนักงานจัดการออเดอร์และการจองตามหน้าที่ (ครัว / เสิร์ฟ / แคชเชียร์) และแอดมินจัดการเมนูและดูรายงานยอดขาย

- **Frontend:** React + Vite + Tailwind CSS · **Backend:** Node.js + Express · **Database:** MySQL 8
- Live demo: https://restaurant-ahn-hclv.vercel.app (API: https://restaurant-ahn-1.onrender.com)

## Structure
| Folder | หน้าที่ |
|---|---|
| `database/` | `schema.sql` (8 ตาราง), `triggers.sql`, `procedures.sql`, `seed.sql`, `migrations/` |
| `backend/` | REST API: `routes/` → `controllers/` → `models/` (SQL), `middleware/auth.js` (JWT + role), `config/permissions.js` (สิทธิ์ทั้งหมด) |
| `frontend/` | `customer/` (สั่งอาหาร, ติดตามออเดอร์, จองโต๊ะ) และ `staff/` (กระดานออเดอร์, การจอง, จัดการเมนู, แดชบอร์ด) |
| `docs/` | [สรุประบบสำหรับทีม (PDF)](docs/system-overview.pdf), [ER diagram](docs/er-diagram.md), [demo test cases](docs/demo-test-cases.md) |

## Getting started (local)
1. สร้างฐานข้อมูล (MySQL 8) ตามลำดับ:
   ```bash
   mysql -u root -p < database/schema.sql
   mysql -u root -p < database/triggers.sql
   mysql -u root -p < database/procedures.sql
   mysql -u root -p < database/seed.sql
   ```
   ฐานข้อมูลเดิมที่สร้างไว้แล้ว: รันไฟล์ใน `database/migrations/` ที่ยังไม่เคยรัน (เรียงตามเลข)
2. Backend
   ```bash
   cd backend && npm install
   cp .env.example .env      # ใส่รหัส DB, JWT_SECRET, SEED_PASSWORD
   npm run seed:users        # สร้างบัญชี admin / chef / waiter / cashier
   npm run dev               # http://localhost:3000
   ```
3. Frontend
   ```bash
   cd frontend && npm install && npm run dev   # http://localhost:5173
   ```
4. ทดสอบทั้งระบบ: `cd backend && npm run test:e2e` (60 test cases ยิง API จริงแล้วคืนข้อมูลเดิมให้)

## Roles & permissions
สิทธิ์ทั้งหมดอยู่ที่ [`backend/src/config/permissions.js`](backend/src/config/permissions.js) ที่เดียว backend ตรวจทุก request (JWT) ส่วน frontend ซ่อนปุ่มที่ role นั้นกดไม่ได้

| ทำอะไร | ลูกค้า | chef | waiter | cashier | admin |
|---|:-:|:-:|:-:|:-:|:-:|
| ดูเมนู / สั่งอาหาร / ติดตามออเดอร์ตัวเอง / จองโต๊ะ | ✓ | ✓ | ✓ | ✓ | ✓ |
| ดูกระดานออเดอร์ | | ✓ | ✓ | ✓ | ✓ |
| `placed → preparing → ready` (ครัว) | | ✓ | | | ✓ |
| `ready → served` (เสิร์ฟ) | | | ✓ | | ✓ |
| ยกเลิกออเดอร์ (ก่อนเสิร์ฟ) | | | ✓ | | ✓ |
| รับชำระเงิน `served → completed` | | | ✓ | ✓ | ✓ |
| จัดการการจอง (ยืนยัน / ลูกค้ามาถึง / ยกเลิก / ย้ายโต๊ะ) | | | ✓ | | ✓ |
| ลบการจอง | | | | | ✓ |
| จัดการเมนู (CRUD) | | | | | ✓ |
| แดชบอร์ด / รายงานยอดขาย / สต็อก | | | | | ✓ |

สถานะเดินหน้าทีละขั้นเท่านั้น ข้ามขั้นหรือย้อนกลับไม่ได้ (409) และ role ที่ไม่มีสิทธิ์ได้ 403

## SQL features
| ประเภท | ชื่อ | ทำอะไร | เห็นผลที่ไหน |
|---|---|---|---|
| Trigger | `trg_order_item_bi_stock` | BEFORE INSERT `order_item`: ตัดสต็อกวัตถุดิบตามสูตร ถ้าไม่พอ `SIGNAL` ยกเลิกทั้งออเดอร์ | แดชบอร์ด → สต็อกวัตถุดิบ / ลูกค้าเห็น "Out of stock" |
| Trigger | `trg_orders_ai_table` | AFTER INSERT `orders`: ออเดอร์ทานที่ร้าน → โต๊ะ (ว่างหรือจองไว้) เป็น `occupied` | แดชบอร์ด → สถานะโต๊ะ |
| Trigger | `trg_orders_au_status` | AFTER UPDATE `orders`: ยกเลิก → คืนสต็อก, ออเดอร์จบครบ → โต๊ะกลับเป็น `available` | แดชบอร์ด |
| Trigger | `trg_reservation_au_table` | AFTER UPDATE `reservation`: ยืนยันการจองของวันนี้ → โต๊ะเป็น `reserved`, ยกเลิก/ย้ายโต๊ะ → ปล่อยโต๊ะ | แดชบอร์ด → สถานะโต๊ะ |
| Trigger | `trg_reservation_ad_table` | AFTER DELETE `reservation`: ลบการจองที่ยืนยันแล้วของวันนี้ → ปล่อยโต๊ะ | แดชบอร์ด |
| Stored procedure | `sp_sales_summary(p_date)` | สรุปรายได้, ออเดอร์ที่ชำระ, ยอดเฉลี่ย, ยกเลิก, จำนวนจาน ของวันที่เลือก | แดชบอร์ด → เลือกวันที่ (`CALL` จาก `dashboardModel.js`) |

> TiDB Cloud (ฐานข้อมูลของเว็บ demo) ไม่รองรับ trigger และ stored procedure: backend จะคำนวณยอดขายด้วย SQL query แทน และหน้าแดชบอร์ดบอกไว้ว่าใช้วิธีไหน ให้ demo ส่วนนี้กับ MySQL

## Security
- SQL ทุกคำสั่งใช้ parameterized query (`?`) ไม่มีการต่อ string จากข้อมูลผู้ใช้
- รหัสผ่านเก็บเป็น bcrypt hash, login ผิดตอบข้อความเดียวกันทุกกรณี
- ค่าลับทั้งหมด (DB, JWT, รหัสบัญชีตัวอย่าง) อยู่ใน `.env` ซึ่งไม่ถูก commit; เปลี่ยนรหัสได้ด้วย `npm run set:password -- <username>`
- error ที่ไม่คาดคิดตอบ `Internal server error` เท่านั้น รายละเอียด DB ถูก log ไว้ที่ server ไม่ส่งให้ client
- ราคาอาหารดึงจาก DB เสมอ ไม่เชื่อราคาจาก client; รับชำระเงินใช้ transaction + `SELECT ... FOR UPDATE`

## Team workflow
- ห้าม commit ไฟล์ `.env`
- push เข้า `main` แล้ว Render (backend) และ Vercel (frontend) จะ deploy ให้อัตโนมัติ
