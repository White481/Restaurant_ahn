# Demo Test Cases — Final Project (30 คะแนน)

ลำดับการ demo ตาม rubric แต่ละข้อมี **สิ่งที่ต้องเปิดให้ดู**, **ขั้นตอน**, **ผลที่ต้องได้**
ใช้ MySQL ในเครื่อง (ดูใน MySQL Workbench) ตอน demo เพราะ TiDB Cloud ของเว็บออนไลน์ไม่รองรับ trigger / stored procedure
สคริปต์พูดแบ่ง 3 คน: [`presentation-script.md`](presentation-script.md)

**เตรียมก่อนเริ่ม (5 นาที)**
1. `brew services start mysql` (ฐานข้อมูลสร้างไว้แล้ว ถ้ายังไม่มี: `schema.sql` → `triggers.sql` → `procedures.sql` → `seed.sql` → `npm run seed:users`)
2. เปิด 2 terminal: `cd backend && npm run dev` และ `cd frontend && npm run dev`
3. เปิด MySQL Workbench ที่ฐานข้อมูล `restaurant_oms` (คลิกขวา → Refresh All)
4. เปิดเบราว์เซอร์ 2 หน้าต่าง: ลูกค้า `http://localhost:5173/?table=2` และพนักงาน `http://localhost:5173/staff`
5. โต๊ะทุกตัวควรเป็น "ว่าง" ก่อนเริ่ม: `SELECT table_id, status FROM dining_table;`

---

## 1. ER Diagram & Database Schema (6)

| # | ทำอะไร | ผลที่ต้องได้ |
|---|---|---|
| 1.1 | เปิด [`docs/er-diagram.png`](er-diagram.png) | 7 entities, 6 relationships, PK/FK ครบ · ทุกตารางถูกใช้จริง · M:N 2 จุด (`order_item`, `menu_item_ingredient`) · เหตุผลที่ลดจาก 11 ตารางอยู่ท้าย [`er-diagram.md`](er-diagram.md) |
| 1.2 | เปิด `database/schema.sql` ชี้ `PRIMARY KEY`, `FOREIGN KEY ... REFERENCES`, composite PK ของ `menu_item_ingredient` | ตรงกับ ER ทุกตาราง |
| 1.3 | Workbench: `SHOW TABLES;` และ `SHOW CREATE TABLE orders;` | 7 ตาราง · เห็น FK `fk_orders_table`, `fk_orders_staff`, `fk_orders_paid_by` |
| 1.4 | อธิบาย query ที่ใช้ความสัมพันธ์: `orderModel.getAllOrders` (`orders JOIN staff` หาชื่อแคชเชียร์), trigger ตัดสต็อก (`menu_item_ingredient JOIN ingredient`) | — |
| 1.5 | อธิบายการเชื่อม DB กับแอป: `backend/.env` → `src/config/db.js` (connection pool) → `models/*.js` (SQL) → `controllers/` → `routes/` → `app.js` | — |

## 2. CRUD Functionality (7)
หน้า **พนักงาน → เมนู** (login `admin`)

| # | Operation | ขั้นตอน | ผลที่ต้องได้ |
|---|---|---|---|
| 2.1 | **Create** | กรอก "ข้าวไข่เจียว", 45, หมวด Main → เพิ่มเมนู | ขึ้นในรายการ · Workbench `SELECT * FROM menu_item ORDER BY menu_item_id DESC LIMIT 1;` เห็นแถวใหม่ทันที |
| 2.2 | **Read** | เปิดหน้าลูกค้า / รายการเมนูของ admin | เห็นเมนูใหม่ (ลูกค้าเห็นเฉพาะที่เปิดขาย) |
| 2.3 | **Update** | กด "แก้ไข" → เปลี่ยนราคาเป็น 50 → บันทึก | ราคาเปลี่ยนทั้งสองหน้าและใน MySQL |
| 2.4 | **Update (ซ่อน)** | กด "ซ่อน" | หายจากหน้าลูกค้า แต่ admin ยังเห็นพร้อมป้าย "ซ่อนอยู่" (`is_active = 0`) |
| 2.5 | **Delete** | กด "ลบ" ที่ "ข้าวไข่เจียว" → ยืนยัน | "ลบเมนูแล้ว" หายจาก DB |
| 2.6 | **Delete ที่ติด FK** | กด "ลบ" ที่เมนูที่เคยถูกสั่ง เช่น ข้าวผัดกะเพรา | "เคยถูกสั่งแล้ว จึงซ่อนไว้แทนการลบ" (FK `ON DELETE RESTRICT` ปกป้องประวัติออเดอร์) แล้วกด "แสดง" คืน |
| 2.7 | **Validation** | เพิ่มเมนูราคา -5 / เว้นชื่อว่าง | ข้อความ error ไม่บันทึกลง DB |
| 2.8 | ออเดอร์: Create / Read / Update | (ทำในข้อ 3 และ 5) ลูกค้าสั่ง → ขึ้นบนกระดาน → เลื่อนสถานะ → ชำระเงิน | ทำงานครบ |
| 2.9 | โต๊ะ: Read / Update | พนักงาน → โต๊ะ → เปิดโต๊ะ / ปิดโต๊ะ | `dining_table.status` เปลี่ยนใน MySQL ทันที |

## 3. Access Control & Roles (4)
เปิด `backend/src/config/permissions.js` ให้ดูตารางสิทธิ์ แล้ว login ทีละ role

| # | Role | ขั้นตอน | ผลที่ต้องได้ |
|---|---|---|---|
| 3.1 | ลูกค้า (ไม่ login) | เปิด `/staff` | ถูกพาไปหน้า login · ฝั่งลูกค้าทำได้แค่ดูเมนูและสั่งที่โต๊ะที่เปิดแล้ว |
| 3.2 | waiter | เมนู "โต๊ะ" → เปิดโต๊ะ 2 | ลูกค้าโต๊ะ 2 สั่งได้ · เห็น "เสิร์ฟแล้ว", "ยกเลิก", "ชำระเงิน" แต่ไม่มีปุ่ม "เริ่มทำ" |
| 3.3 | chef | ดูกระดาน | เห็นแค่ "เริ่มทำ/ทำเสร็จ" · ไม่มีเมนู "โต๊ะ / เมนู / แดชบอร์ด" |
| 3.4 | cashier | ดูกระดาน | เห็นแค่ "ชำระเงิน" |
| 3.5 | admin | ทุกหน้า | ทำได้ทุกอย่าง + ปิดใช้งานโต๊ะได้ (waiter ทำไม่ได้) |
| 3.6 | ตรวจที่ backend จริง | `npm run test:e2e` (ข้อ "chef open table -> 403", "waiter placed->preparing 403", "chef -> dashboard 403") | backend ปฏิเสธแม้จะยิง API ตรงโดยไม่ผ่านหน้าเว็บ |

## 4. Security (4)

| # | ทำอะไร | ผลที่ต้องได้ |
|---|---|---|
| 4.1 | เปิด `models/orderModel.js` ชี้ `db.execute('... WHERE order_id = ?', [id])` | parameterized ทุกคำสั่ง ไม่มีการต่อ string จากข้อมูลผู้ใช้ |
| 4.2 | หน้า login พิมพ์ username `admin' OR '1'='1` | "Invalid username or password" (ไม่หลุด) |
| 4.3 | เปิด `backend/.env.example` และ `.gitignore` · `src/config/db.js` | ไม่มีรหัสจริงในโค้ด, `.env` ไม่ถูก commit, ลืมตั้ง env = แจ้งชื่อตัวแปรที่ขาด |
| 4.4 | เปิด `middleware/errorHandler.js` แล้วลองเปิด `http://localhost:3000/api/orders/abc/status` | ได้ `Invalid order id` ไม่มีรายละเอียด DB · error ที่ไม่คาดคิดตอบแค่ `Internal server error` |
| 4.5 | (optional) Workbench `SELECT username, password_hash FROM staff;` | เห็นเป็น bcrypt hash `$2a$10$...` |
| 4.6 | (optional) เปิดเว็บลูกค้าโดยไม่สแกน QR หรือโต๊ะที่ยังไม่เปิด | สั่งไม่ได้ (กันสั่งจากนอกร้าน) |

## 5. SQL Features (3) — โชว์สด
ใช้ 2 จอคู่กัน: หน้าเว็บ + MySQL Workbench

**Trigger 2: โต๊ะยังไม่เปิด → ปฏิเสธ (SIGNAL)** — ก่อน waiter เปิดโต๊ะ ลองรันใน Workbench:
```sql
INSERT INTO orders (table_id, order_type) VALUES (2, 'dine_in');
-- Error 1644: Table is not open: please ask staff to open the table first
```
จากนั้น waiter กด "เปิดโต๊ะ" ที่โต๊ะ 2 → `SELECT table_id, status FROM dining_table;` โต๊ะ 2 เป็น `occupied`

**Trigger 1: ตัดสต็อก**
```sql
SELECT ingredient_name, quantity_in_stock FROM ingredient WHERE ingredient_name IN ('หมูสับ','ไข่ไก่');
```
ลูกค้าโต๊ะ 2 สั่ง ข้าวผัดกะเพรา × 2 แล้วรันคำสั่งเดิม → หมูสับ −200 g, ไข่ −2 (หรือดูที่แดชบอร์ด → สต็อกวัตถุดิบ)

**Trigger 1 ปฏิเสธ (SIGNAL)** — สั่ง ผัดไทยกุ้งสด × 99 → "Out of stock: not enough ingredients for this item" และไม่มีออเดอร์ค้างใน DB

**Trigger 3: ยกเลิกแล้วคืนสต็อก / ชำระเงินแล้วปิดโต๊ะ**
- waiter ยกเลิกออเดอร์ → สต็อกกลับเท่าเดิม (โต๊ะยังเปิดอยู่ ลูกค้าสั่งใหม่ได้)
- chef เริ่มทำ → ทำเสร็จ → waiter เสิร์ฟ → cashier ชำระเงิน → `SELECT table_id, status FROM dining_table;` โต๊ะ 2 กลับเป็น `available` เอง

**Stored procedure**
```sql
CALL sp_sales_summary(CURDATE());
```
แล้วเปิดแดชบอร์ด: ตัวเลขตรงกัน และมีข้อความ "ยอดขายคำนวณโดย stored procedure sp_sales_summary" ลองเปลี่ยนวันที่ → แดชบอร์ดเรียก procedure ใหม่ด้วยวันนั้น

โค้ดที่เรียก: `backend/src/models/dashboardModel.js` → `db.query('CALL sp_sales_summary(?)', [date])`

## 6. UI & Navigation (3)
ลูกค้า: เมนู → ตะกร้า (เลือก QR เห็นรูปพร้อมเพย์) → ยืนยันสั่ง → ติดตามสถานะ (อัปเดตเอง) / พนักงาน: กระดาน → ประวัติ → ใบเสร็จ → โต๊ะ → เมนู → แดชบอร์ด, สลับภาษา ไทย/EN, โหมดมืด, มือถือ

## 7. Professionalism (3)
- อธิบาย flow ของข้อมูล 1 ออเดอร์: หน้าเว็บ → `POST /api/orders` → controller ตรวจข้อมูล → model เปิด transaction, ล็อกแถวโต๊ะ (`FOR UPDATE`) ตรวจว่าเปิดแล้ว → INSERT `orders` (trigger ตรวจโต๊ะ) + `order_item` (trigger ตัดสต็อก) → COMMIT
- ปิดท้ายด้วย `npm run test:e2e` ให้เห็น **55 passed, 0 failed**
