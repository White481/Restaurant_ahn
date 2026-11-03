# Backend (Node.js + Express + MySQL)

## Setup
1. สร้างฐานข้อมูลตามลำดับ: `database/schema.sql` → `triggers.sql` → `procedures.sql` → `seed.sql`
   (ฐานข้อมูลเดิม: รันไฟล์ใน `database/migrations/` ที่ยังไม่เคยรัน แล้ว `npm run migrate:8tables`)
2. `cd backend && npm install`
3. `cp .env.example .env` แล้วแก้ค่าใน `.env` (รหัสผ่าน DB, `JWT_SECRET`, `SEED_PASSWORD`)
4. `npm run seed:users`  (สร้างบัญชี admin / chef / waiter / cashier ด้วยรหัสจาก `.env`)
5. `npm run dev`  -> http://localhost:3000

| คำสั่ง | ทำอะไร |
|---|---|
| `npm run dev` | รัน server (รีสตาร์ตเองเมื่อแก้โค้ด) |
| `npm run seed:users` | สร้างบัญชีพนักงานตัวอย่าง |
| `npm run set:password -- <username>` | เปลี่ยนรหัสผ่าน (ถามรหัสใหม่ ไม่ต้องพิมพ์ในคำสั่ง) |
| `npm run migrate:8tables` | ย้ายฐานข้อมูลเดิม 11 ตาราง → 8 ตาราง (`staff`, ชื่อ/เบอร์ใน `reservation`) ข้อมูลไม่หาย รันซ้ำได้ |
| `npm run test:e2e` | 62 test cases ยิง API จริง (roles, triggers, CRUD, procedure, การจอง) แล้วคืนข้อมูลเดิม |

## API
สิทธิ์อยู่ใน `src/config/permissions.js` · เรียก endpoint ที่ต้อง login: ใส่ header `Authorization: Bearer <token>`

| Method | Endpoint | สิทธิ์ | คำอธิบาย |
|---|---|---|---|
| POST   | `/api/auth/login` | public | login -> ได้ `token` (JWT) |
| GET    | `/api/menus` | public | เมนูที่เปิดขาย |
| GET    | `/api/menus/all` | admin | เมนูทั้งหมดรวมที่ซ่อน |
| POST   | `/api/menus` | admin | เพิ่มเมนู |
| PUT    | `/api/menus/:id` | admin | แก้ไขเมนู / ซ่อน-แสดง (`is_active`) |
| DELETE | `/api/menus/:id` | admin | ลบเมนู (เคยถูกสั่งแล้ว -> ซ่อนแทน, `result: deleted \| hidden`) |
| POST   | `/api/orders` | public | สั่งอาหาร (transaction: orders + order_item, trigger ตัดสต็อก) |
| GET    | `/api/orders/:id/status` | public | สถานะของออเดอร์เดียว (หน้าติดตามของลูกค้า) |
| GET    | `/api/orders` | พนักงานทุก role | ออเดอร์ + รายการอาหาร (`?status=placed` กรองได้) |
| PATCH  | `/api/orders/:id` | ตาม `ORDER_TRANSITIONS` | เปลี่ยนสถานะทีละขั้น (chef: ครัว, waiter: เสิร์ฟ/ยกเลิก) |
| POST   | `/api/orders/:id/pay` | admin / cashier / waiter | รับชำระเงิน + ปิดออเดอร์ `{payment_method, amount_received}` |
| GET    | `/api/dashboard?date=YYYY-MM-DD` | admin | ยอดขายจาก `sp_sales_summary`, สถานะโต๊ะ, สต็อก, ออเดอร์ล่าสุด |
| POST   | `/api/reservations` | public | จองโต๊ะ `{name, phone, date, time, party_size}` ระบบเลือกโต๊ะที่เล็กสุดที่นั่งพอและว่าง |
| GET    | `/api/reservations?date=YYYY-MM-DD` | admin / waiter | การจองของวันนั้น |
| GET    | `/api/reservations/tables` | admin / waiter | รายการโต๊ะ (ไว้ย้ายโต๊ะ) |
| PATCH  | `/api/reservations/:id/status` | admin / waiter | `pending → confirmed → completed` หรือ `→ cancelled` |
| PUT    | `/api/reservations/:id` | admin / waiter | ย้ายโต๊ะ / เปลี่ยนวันเวลา / จำนวนคน (ตรวจที่นั่งและเวลาซ้อน) |
| DELETE | `/api/reservations/:id` | admin | ลบการจองถาวร |

## Error responses
| Status | เมื่อไหร่ |
|---|---|
| 400 | ข้อมูลไม่ถูกต้อง |
| 401 | ไม่ได้ login / token หมดอายุ |
| 403 | role ไม่มีสิทธิ์ |
| 404 | ไม่พบข้อมูล |
| 409 | เปลี่ยนสถานะข้ามขั้น, ออเดอร์ปิดแล้ว, วัตถุดิบไม่พอ (จาก trigger), ไม่มีโต๊ะว่าง / จองซ้อนเวลา |
| 500 | error ที่ไม่คาดคิด ตอบแค่ `Internal server error` (รายละเอียดอยู่ใน log ของ server) |
