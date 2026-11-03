# ER Diagram — Restaurant Order Management System

สร้างจาก `database/schema.sql` (ตรงกับฐานข้อมูลจริงทุกตารางและทุก FK) · รูปภาพ: [er-diagram.png](er-diagram.png)

- **8 entities**, **7 relationships** (8 foreign keys — ความสัมพันธ์ M:N นับเป็น 1)
- `PK` = primary key, `FK` = foreign key, `UK` = unique

```mermaid
erDiagram
    staff ||--o{ orders : "takes"
    staff ||--o{ orders : "cashier"
    dining_table ||--o{ reservation : "reserved for"
    dining_table ||--o{ orders : "served at"
    orders ||--|{ order_item : contains
    menu_item ||--o{ order_item : "ordered as"
    menu_item ||--o{ menu_item_ingredient : "recipe"
    ingredient ||--o{ menu_item_ingredient : "used in"

    staff {
        INT staff_id PK
        VARCHAR first_name
        VARCHAR last_name
        VARCHAR phone
        VARCHAR email
        DATE hire_date
        VARCHAR username UK
        VARCHAR password_hash "bcrypt"
        ENUM role "admin|chef|waiter|cashier"
    }
    dining_table {
        INT table_id PK
        VARCHAR table_number UK
        INT capacity
        ENUM status "available|occupied|reserved|inactive"
    }
    reservation {
        INT reservation_id PK
        VARCHAR customer_name
        VARCHAR phone
        INT table_id FK
        DATE reservation_date
        TIME reservation_time
        INT party_size
        ENUM status "pending|confirmed|cancelled|completed"
    }
    menu_item {
        INT menu_item_id PK
        VARCHAR item_name
        VARCHAR item_name_en
        VARCHAR category
        DECIMAL price
        VARCHAR image_url
        TINYINT is_active
    }
    ingredient {
        INT ingredient_id PK
        VARCHAR ingredient_name
        INT quantity_in_stock
        VARCHAR unit
    }
    menu_item_ingredient {
        INT menu_item_id PK,FK
        INT ingredient_id PK,FK
        INT quantity_needed
        VARCHAR unit
    }
    orders {
        INT order_id PK
        INT table_id FK
        INT staff_id FK
        INT paid_by FK
        ENUM order_type "dine_in|take_away"
        TIMESTAMP order_date
        DECIMAL total_price
        TEXT special_request
        ENUM payment_method "cash|card|qr|other"
        DECIMAL amount_received
        TIMESTAMP paid_at
        ENUM status "placed|preparing|ready|served|completed|cancelled"
    }
    order_item {
        INT order_item_id PK
        INT order_id FK
        INT menu_item_id FK
        INT quantity
        DECIMAL subtotal
    }
```

## Relationships

| # | Relationship | Cardinality | FK | On delete |
|---|---|---|---|---|
| 1 | staff — orders (สั่งแทนลูกค้า) | 1 : 0..N | `orders.staff_id` | SET NULL |
| 2 | staff — orders (รับชำระเงิน) | 1 : 0..N | `orders.paid_by` | SET NULL |
| 3 | dining_table — reservation | 1 : 0..N | `reservation.table_id` | CASCADE |
| 4 | dining_table — orders | 1 : 0..N | `orders.table_id` | RESTRICT |
| 5 | orders — order_item | 1 : 1..N | `order_item.order_id` | CASCADE |
| 6 | menu_item — order_item | 1 : 0..N | `order_item.menu_item_id` | RESTRICT |
| 7 | menu_item — ingredient (M:N ผ่าน `menu_item_ingredient`) | M : N | `menu_item_ingredient.menu_item_id`, `.ingredient_id` | CASCADE |

- `menu_item_ingredient` เป็นตารางเชื่อม (bridge) ของความสัมพันธ์ M:N ระหว่างเมนูกับวัตถุดิบ PK เป็น composite key `(menu_item_id, ingredient_id)`
- `order_item` ก็เป็นตารางเชื่อม M:N ระหว่างออเดอร์กับเมนู แต่มี PK ของตัวเอง เพราะเก็บ `subtotal` ณ เวลาที่สั่ง (ราคาเมนูเปลี่ยนทีหลัง บิลเก่าไม่เปลี่ยน)

## ทำไมเหลือ 8 ตาราง (ลดจาก 11)

| เดิม | ตอนนี้ | เหตุผล |
|---|---|---|
| `employee` + `sys_user` (1:1) | `staff` | พนักงานทุกคนต้อง login เข้าระบบ แยกสองตารางไม่ได้ประโยชน์ |
| `customer` | `reservation.customer_name`, `reservation.phone` | ร้านไม่มีระบบสมาชิก ชื่อและเบอร์เป็นข้อมูลติดต่อของการจองครั้งนั้น |
| `table_session` | ลบ | QR ประจำโต๊ะ (`/?table=2`) ใช้แค่ `dining_table` ก็พอ |
