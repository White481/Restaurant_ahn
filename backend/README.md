# Backend (Node.js + Express + MySQL)

## Setup
1. รัน `database/schema.sql` แล้ว `database/seed.sql` ใน MySQL
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
| GET   | `/api/orders`      | login  | ดึงออเดอร์ + รายการอาหาร (`?status=placed` กรองได้) |
| PATCH | `/api/orders/:id`  | login  | อัปเดตสถานะ (placed/preparing/ready/served/completed/cancelled) |

เรียก endpoint ที่ต้อง login: ใส่ header `Authorization: Bearer <token>`
