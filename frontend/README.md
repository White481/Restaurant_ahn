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
| `/staff` | พนักงาน | กระดาน Kanban ออเดอร์ + แท็บประวัติ (รีเฟรชทุก 5 วินาที), รับชำระเงิน, ใบเสร็จ |
| `/staff/menu` | admin | จัดการเมนู |

ทดลอง: login ด้วยบัญชี demo จาก `npm run seed:users` (เช่น `admin` / `admin1234`)

## ภาษา ไทย / English
- สวิตช์ **ไทย | EN** อยู่แถบบนขวา (ข้างสวิตช์ ลูกค้า|พนักงาน) จำค่าไว้ในเครื่อง (`localStorage` คีย์ `oms_lang`)
- ข้อความทั้งหมดอยู่ใน `src/i18n/messages.js` ที่เดียว (มี `th` และ `en` คีย์เดียวกัน) ในโค้ดเรียกใช้ด้วย `const { t } = useLang()` แล้ว `t('คีย์', { ตัวแปร })`
- เพิ่มข้อความใหม่: เพิ่มคีย์ในทั้ง `th` และ `en` (ถ้าลืม จะถอยไปแสดงภาษาไทย แล้วค่อยแสดงชื่อคีย์)
- ชื่อเมนูภาษาอังกฤษมาจากคอลัมน์ `menu_item.item_name_en` (กรอกในหน้าจัดการเมนู) ถ้าเมนูไหนไม่มี จะแสดงชื่อไทย
- ข้อความ error ที่มาจาก backend เป็นภาษาอังกฤษเสมอ แสดงตามที่ได้รับ

## รับชำระเงิน + ใบเสร็จ
1. พนักงานกด **ชำระเงิน** บนการ์ดในคอลัมน์ "เสิร์ฟแล้ว" -> หน้าต่างรับชำระเงิน (เงินสดกรอกจำนวนที่รับ ระบบคำนวณเงินทอน / บัตร / QR)
2. ยืนยันแล้วออเดอร์เป็น "เสร็จสิ้น" (เรียก `POST /api/orders/:id/pay`) และเปิดใบเสร็จ
3. ในหน้าต่างใบเสร็จ **พนักงานเลือกภาษาของใบเสร็จได้ (ไทย / English)** แยกจากภาษาของหน้าเว็บ ระบบจำค่าที่เลือกล่าสุดไว้ จากนั้นกด **พิมพ์ใบเสร็จ**
4. ใบเสร็จย้อนหลังเปิดซ้ำได้จากแท็บ "ประวัติ"
- ข้อมูลร้านบนใบเสร็จ (ชื่อ ที่อยู่ เบอร์ เลขผู้เสียภาษี) และอัตรา VAT แก้ที่ `src/config/shop.js`
- สมมติฐาน: ราคาเมนู **รวม VAT แล้ว** (ถ้าร้านบวก VAT เพิ่ม ต้องแก้ `src/utils/receipt.js`)
- การพิมพ์ใช้ `window.print()` + `src/print.css` (กระดาษ 80 มม. ซ่อนทุกอย่างยกเว้นใบเสร็จ) ในหน้าต่างพิมพ์ของเบราว์เซอร์ให้ปิด "Headers and footers" และตั้งกระดาษเป็น 80 มม. (เครื่องพิมพ์ความร้อน)
- สิทธิ์: เฉพาะ `admin`, `cashier`, `waiter` รับชำระเงินได้ (`chef` ไม่เห็นปุ่มชำระเงิน)

## โครงสร้าง `src/`
```
ui/          Button, Modal, Toast, Skeleton, EmptyState, fields  (ชิ้นส่วน UI กลาง)
hooks/       usePolling, useNow, useTheme, useAlertSound
components/  StatusBadge, Receipt, ModeSwitch, LangSwitch + status.js (ค่าคงที่สถานะ)
i18n/        messages.js (ข้อความ th/en), LanguageContext, ตัวแปล/จัดรูปแบบวันที่
config/      shop.js (ข้อมูลร้าน + อัตรา VAT)
utils/       receipt.js (คำนวณ VAT / เงินทอน เป็นสตางค์)
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
- ตั้งค่าร้านผ่านหน้าเว็บ (ตอนนี้แก้ใน `config/shop.js`)
- รูปเมนูจริง: ตอนนี้ใช้ภาพแทนตามหมวด ต้องเพิ่มคอลัมน์ `image_url` ใน `menu_item` (MenuCard รองรับแล้ว: ถ้า API ส่ง `image_url` มาจะแสดงรูปเอง)
- ป้าย "หมด" ตามสต็อกวัตถุดิบ
- หน้า Stocks / Employees / Reports
- แจ้งเตือนแบบ push (ตอนนี้ polling) และมุมมองตามบทบาท (chef/waiter/cashier)
