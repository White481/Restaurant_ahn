# Backend (Node.js + Express + MySQL)

## Setup
1. สร้างฐานข้อมูลตามลำดับ: `database/schema.sql` → `triggers.sql` → `procedures.sql` → `seed.sql`
   (ฐานข้อมูลเดิม: รันไฟล์ใน `database/migrations/` ที่ยังไม่เคยรันแทน)
2. `cd backend && npm install`
3. `cp .env.example .env` แล้วแก้ค่าใน `.env` (รหัสผ่าน DB, `JWT_SECRET`, `SEED_PASSWORD`)
4. `npm run seed:users`  (สร้างบัญชี admin / chef / waiter / cashier ด้วยรหัสจาก `.env`)
5. `npm run dev`  -> http://localhost:3000

| คำสั่ง | ทำอะไร |
|---|---|
| `npm run dev` | รัน server (รีสตาร์ตเองเมื่อแก้โค้ด) |
| `npm run seed:users` | สร้างบัญชีพนักงานตัวอย่าง |
| `npm run set:password -- <username>` | เปลี่ยนรหัสผ่าน (ถามรหัสใหม่ ไม่ต้องพิมพ์ในคำสั่ง) |
| `npm run test:e2e` | 39 test cases ยิง API จริง (roles, triggers, CRUD, procedure) แล้วคืนข้อมูลเดิม |

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

## Error responses
| Status | เมื่อไหร่ |
|---|---|
| 400 | ข้อมูลไม่ถูกต้อง |
| 401 | ไม่ได้ login / token หมดอายุ |
| 403 | role ไม่มีสิทธิ์ |
| 404 | ไม่พบข้อมูล |
| 409 | เปลี่ยนสถานะข้ามขั้น, ออเดอร์ปิดแล้ว, วัตถุดิบไม่พอ (จาก trigger) |
| 500 | error ที่ไม่คาดคิด ตอบแค่ `Internal server error` (รายละเอียดอยู่ใน log ของ server) |
