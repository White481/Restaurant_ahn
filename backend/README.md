# Backend (Node.js + Express + MySQL)

## Setup
1. รัน `database/schema.sql` แล้ว `database/seed.sql` ใน MySQL
   (ถ้ามีฐานข้อมูลเดิมอยู่แล้วและไม่อยากล้างข้อมูล ให้รัน `database/migrations/001_receipt_and_language.sql` ครั้งเดียวแทน)
2. `cd backend && npm install`
3. `cp .env.example .env` แล้วแก้ค่าใน `.env` (รหัสผ่าน DB, `JWT_SECRET`)
4. `npm run seed:users`  (สร้างบัญชี demo: admin / chef / waiter / cashier)
5. `npm run dev`  -> http://localhost:3000

> ติดตั้ง package ที่โฟลเดอร์ `backend/` เท่านั้น (ไม่ต้องมี package.json ที่ root)

## API
| Method | Endpoint | สิทธิ์ | คำอธิบาย |
|---|---|---|---|
| POST  | `/api/auth/login`  | public | login -> ได้ `token` (JWT) |
| GET   | `/api/menus`       | public | ดึงเมนูทั้งหมด |
| POST  | `/api/menus`       | admin  | เพิ่มเมนู |
| POST  | `/api/orders`      | public | สั่งอาหาร (บันทึกลง orders + order_item) |
| GET   | `/api/orders/:id/status` | public | ดูสถานะของออเดอร์เดียว (หน้าติดตามของลูกค้า) |
| GET   | `/api/orders`      | login  | ดึงออเดอร์ + รายการอาหาร (`?status=placed` กรองได้) |
| PATCH | `/api/orders/:id`  | login  | อัปเดตสถานะ (placed/preparing/ready/served/cancelled) ปิดออเดอร์ (`completed`) ต้องผ่าน `/pay` |
| POST  | `/api/orders/:id/pay` | admin/cashier/waiter | รับชำระเงิน + ปิดออเดอร์ `{payment_method, amount_received}` (cash ต้องมี `amount_received`) |

เรียก endpoint ที่ต้อง login: ใส่ header `Authorization: Bearer <token>`
