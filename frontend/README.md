# Frontend (React + Vite + Tailwind CSS v4)

## รัน
```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```
ต้องเปิด backend (`cd backend && npm run dev`) พร้อมกัน เพราะ Vite จะ proxy คำขอ `/api/*` ไปที่ `http://localhost:3000` (ตั้งไว้ใน `vite.config.js`)

## หน้าต่างๆ
| URL | ผู้ใช้ | หน้าที่ |
|---|---|---|
| `/?table=1` | ลูกค้า | เมนูแบบ grid + ค้นหา + แท็บหมวด + ตะกร้า (ลิงก์ใน QR ของโต๊ะ เลข = `table_id`) |
| `/cart` | ลูกค้า | ยืนยันสั่งอาหาร (checkout) |
| `/order/:id` | ลูกค้า | ติดตามสถานะ (อัปเดตเองทุก 4 วินาที) |
| `/staff/login` | พนักงาน | เข้าสู่ระบบ |
| `/staff` | พนักงาน | กระดาน Kanban ออเดอร์ + แท็บประวัติ (รีเฟรชทุก 5 วินาที) |
| `/staff/menu` | admin | จัดการเมนู |

ทดลอง: login ด้วยบัญชี demo จาก `npm run seed:users` (เช่น `admin` / `admin1234`)

## โครงสร้าง `src/`
```
ui/          Button, Modal, Toast, Skeleton, EmptyState, fields  (ชิ้นส่วน UI กลาง)
hooks/       usePolling, useNow, useTheme, useAlertSound
components/  StatusBadge + status.js (ค่าคงที่/ป้ายสถานะ ใช้ทั้งสองฝั่ง)
customer/    MenuPage, CartPage (checkout), OrderStatusPage, CartContext
  components/  TopBar, CategoryTabs, MenuGrid, MenuCard, CartDrawer, OrderStepper
staff/       OrdersPage, MenuAdminPage, LoginPage, RequireAuth, AuthContext
  components/  StaffLayout, OrderBoard, OrderColumn, OrderCard, HistoryList, CancelModal, ...
services/    api.js  (จุดเดียวที่เรียก backend)
styles.css   Tailwind + design tokens (สีแบรนด์ ฟอนต์)
```

## แก้ธีม/สี
เปลี่ยนค่า `--color-brand-*` ใน `src/styles.css` ที่เดียว ทั้งแอปเปลี่ยนตาม (ใช้ผ่านคลาส `bg-brand-600`, `text-brand-700` ฯลฯ)
สีของสถานะออเดอร์อยู่ใน `components/StatusBadge.jsx` (ล็อกชุดเดียวทั้งแอป)

## ธีมมืด/สว่าง
ฝั่งพนักงานกดปุ่มธีมที่แถบบนเพื่อสลับ (ตามเครื่อง → สว่าง → มืด) ฝั่งลูกค้าเป็นโหมดสว่างเสมอ

## ยังไม่มี (ต้องมี API ฝั่ง backend ก่อน)
- รูปเมนูจริง: ตอนนี้ใช้ภาพแทนตามหมวด ต้องเพิ่มคอลัมน์ `image_url` ใน `menu_item` (MenuCard รองรับแล้ว: ถ้า API ส่ง `image_url` มาจะแสดงรูปเอง)
- ป้าย "หมด" ตามสต็อกวัตถุดิบ
- หน้า Stocks / Employees / Reports
- แจ้งเตือนแบบ push (ตอนนี้ polling) และมุมมองตามบทบาท (chef/waiter/cashier)
