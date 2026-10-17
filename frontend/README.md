# Frontend (React + Vite)

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
| `/?table=1` | ลูกค้า | เมนู (ลิงก์ที่ฝังใน QR ของโต๊ะ เลข = `table_id`) |
| `/cart` | ลูกค้า | ตะกร้า + ยืนยันสั่งอาหาร |
| `/order/:id` | ลูกค้า | ติดตามสถานะ (ถามซ้ำทุก 4 วินาที) |
| `/staff/login` | พนักงาน | เข้าสู่ระบบ |
| `/staff` | พนักงาน | ออเดอร์ (รีเฟรชทุก 5 วินาที) + จัดการเมนู (admin) |

ทดลอง: login ด้วยบัญชี demo จาก `npm run seed:users` (เช่น `admin` / `admin1234`)

## โครงสร้าง `src/`
- `services/api.js` ที่เดียวที่เรียก backend (ใส่ token ให้, แปลง error)
- `customer/` หน้าและ state ฝั่งลูกค้า (`CartContext`)
- `staff/` หน้าและ state ฝั่งพนักงาน (`AuthContext`, `RequireAuth`)
- `components/` ของที่ใช้ร่วมกัน (`StatusBadge`, ค่าคงที่สถานะใน `status.js`)

## ยังไม่มีเพราะ backend ยังไม่มี endpoint
Stocks, Employees, Reports (อยู่ในสไลด์ แต่ยังไม่มี API) เมื่อ backend ทำแล้ว ให้เพิ่มฟังก์ชันใน `services/api.js` และหน้าใน `staff/`
