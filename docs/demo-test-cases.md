# Demo Test Cases — Final Project (30 คะแนน)

ลำดับการ demo ตาม rubric แต่ละข้อมี **สิ่งที่ต้องเปิดให้ดู**, **ขั้นตอน**, **ผลที่ต้องได้**
ใช้ MySQL ในเครื่องตอน demo เพราะ TiDB Cloud ของเว็บออนไลน์ไม่รองรับ trigger / stored procedure

**เตรียมก่อนเริ่ม (5 นาที)**
1. `brew services start mysql` แล้วรัน `database/triggers.sql` + `database/procedures.sql` ถ้ายังไม่เคยรัน
2. เปิด 2 terminal: `cd backend && npm run dev` และ `cd frontend && npm run dev`
3. เปิด MySQL Workbench (หรือ `mysql -u root -p restaurant_oms`) ไว้รันคำสั่งโชว์ผล
4. เปิดเบราว์เซอร์ 2 หน้าต่าง: ลูกค้า `http://localhost:5173/?table=2` และพนักงาน `http://localhost:5173/staff`

---

## 1. ER Diagram & Database Schema (6)

| # | ทำอะไร | ผลที่ต้องได้ |
|---|---|---|
| 1.1 | เปิด [`docs/er-diagram.png`](er-diagram.png) | 11 entities, 12 relationships, PK/FK ครบ |
| 1.2 | เปิด `database/schema.sql` ชี้ `PRIMARY KEY`, `FOREIGN KEY ... REFERENCES`, composite PK ของ `menu_item_ingredient` | ตรงกับ ER ทุกตาราง |
| 1.3 | รัน `SHOW TABLES;` และ `SHOW CREATE TABLE order_item;` | เห็น FK `fk_orderitem_order`, `fk_orderitem_menuitem` |
| 1.4 | อธิบายการเชื่อม DB กับแอป: `backend/.env` → `src/config/db.js` (connection pool) → `models/*.js` (SQL) → `controllers/` → `routes/` → `app.js` | — |

## 2. CRUD Functionality (7)
หน้า **พนักงาน → เมนู** (login `admin`)

| # | Operation | ขั้นตอน | ผลที่ต้องได้ |
|---|---|---|---|
| 2.1 | **Create** | กรอก "ข้าวไข่เจียว", 45, หมวด Main → เพิ่มเมนู | ขึ้นในรายการ และในหน้าลูกค้าทันที |
| 2.2 | **Read** | เปิดหน้าลูกค้า / รายการเมนูของ admin | เห็นเมนูใหม่ (ลูกค้าเห็นเฉพาะที่เปิดขาย) |
| 2.3 | **Update** | กด "แก้ไข" → เปลี่ยนราคาเป็น 50 → บันทึก | ราคาเปลี่ยนทั้งสองหน้า |
| 2.4 | **Update (ซ่อน)** | กด "ซ่อน" | หายจากหน้าลูกค้า แต่ admin ยังเห็นพร้อมป้าย "ซ่อนอยู่" |
| 2.5 | **Delete** | กด "ลบ" ที่ "ข้าวไข่เจียว" → ยืนยัน | "ลบเมนูแล้ว" หายจาก DB |
| 2.6 | **Delete ที่ติด FK** | กด "ลบ" ที่เมนูที่เคยถูกสั่ง เช่น ข้าวผัดกะเพรา | "เคยถูกสั่งแล้ว จึงซ่อนไว้แทนการลบ" (FK `ON DELETE RESTRICT` ปกป้องประวัติออเดอร์) แล้วกด "แสดง" คืน |
| 2.7 | ออเดอร์: Create / Read / Update | ลูกค้าสั่งอาหาร → ขึ้นบนกระดานพนักงาน → เลื่อนสถานะ | ทำงานครบ |

## 3. Access Control & Roles (4)
เปิด `backend/src/config/permissions.js` ให้ดูตารางสิทธิ์ แล้ว login ทีละ role

| # | Role | ขั้นตอน | ผลที่ต้องได้ |
|---|---|---|---|
| 3.1 | ลูกค้า | เปิด `/staff` โดยไม่ login | ถูกพาไปหน้า login |
| 3.2 | chef | ดูกระดาน | เห็นปุ่ม "เริ่มทำ/ทำเสร็จ" เท่านั้น ไม่มีปุ่มยกเลิก/ชำระเงิน ไม่มีเมนู "จัดการเมนู/แดชบอร์ด" |
| 3.3 | waiter | ดูกระดาน | เห็น "เสิร์ฟแล้ว", "ยกเลิก", "ชำระเงิน" แต่กด "เริ่มทำ" ไม่ได้ |
| 3.4 | cashier | ดูกระดาน | เห็นแค่ "ชำระเงิน" |
| 3.5 | admin | ทุกหน้า | ทำได้ทุกอย่าง |
| 3.6 | ตรวจที่ backend จริง | `npm run test:e2e` (ข้อ "waiter placed->preparing 403", "chef pay 403", "chef -> dashboard 403") | backend ปฏิเสธแม้จะยิง API ตรงโดยไม่ผ่านหน้าเว็บ |

## 4. Security (4)

| # | ทำอะไร | ผลที่ต้องได้ |
|---|---|---|
| 4.1 | เปิด `models/orderModel.js` ชี้ `db.execute('... WHERE order_id = ?', [id])` | parameterized ทุกคำสั่ง |
| 4.2 | หน้า login พิมพ์ username `admin' OR '1'='1` | "Invalid username or password" (ไม่หลุด) |
| 4.3 | เปิด `backend/.env.example` และ `.gitignore` | ไม่มีรหัสจริงในโค้ด, `.env` ไม่ถูก commit |
| 4.4 | เปิด `middleware/errorHandler.js` แล้วลองเปิด `http://localhost:3000/api/orders/abc/status` | ได้ `Invalid order id` ไม่มีรายละเอียด DB |
| 4.5 | (optional) `SELECT username, password_hash FROM sys_user;` | เห็นเป็น bcrypt hash `$2a$10$...` |

## 5. SQL Features (3) — โชว์สด
ใช้ 2 จอคู่กัน: หน้าเว็บ + MySQL

**Trigger 1: ตัดสต็อก**
```sql
SELECT ingredient_name, quantity_in_stock FROM ingredient WHERE ingredient_name IN ('หมูสับ','ไข่ไก่');
```
ลูกค้าสั่ง ข้าวผัดกะเพรา × 2 แล้วรันคำสั่งเดิม → หมูสับ −200 g, ไข่ −2 (หรือดูที่แดชบอร์ด → สต็อกวัตถุดิบ)

**Trigger 2: สถานะโต๊ะ**
```sql
SELECT table_id, status FROM dining_table;
```
หลังสั่ง โต๊ะ 2 เป็น `occupied` พอชำระเงินแล้วกลับเป็น `available`

**Trigger 3: ยกเลิกแล้วคืนสต็อก** — waiter ยกเลิกออเดอร์ → สต็อกกลับเท่าเดิม

**Trigger ปฏิเสธ (SIGNAL)** — สั่ง ผัดไทยกุ้งสด × 99 → "Out of stock: not enough ingredients for this item" และไม่มีออเดอร์ค้างใน DB

**Stored procedure**
```sql
CALL sp_sales_summary(CURDATE());
```
แล้วเปิดแดชบอร์ด: ตัวเลขตรงกัน และมีข้อความ "ยอดขายคำนวณโดย stored procedure sp_sales_summary" ลองเปลี่ยนวันที่ → แดชบอร์ดเรียก procedure ใหม่ด้วยวันนั้น

โค้ดที่เรียก: `backend/src/models/dashboardModel.js` → `db.query('CALL sp_sales_summary(?)', [date])`

## 6. UI & Navigation (3)
ลูกค้า: เมนู → ตะกร้า → ยืนยันสั่ง → ติดตามสถานะ (อัปเดตเอง) / พนักงาน: กระดาน → ประวัติ → ใบเสร็จ → เมนู → แดชบอร์ด, สลับภาษา ไทย/EN, โหมดมืด, มือถือ

## 7. Professionalism (3)
- อธิบาย flow ของข้อมูล 1 ออเดอร์: หน้าเว็บ → `POST /api/orders` → controller ตรวจข้อมูล → model เปิด transaction → INSERT `orders` + `order_item` (trigger ตัดสต็อก) → COMMIT
- ปิดท้ายด้วย `npm run test:e2e` ให้เห็น **39 passed, 0 failed**
