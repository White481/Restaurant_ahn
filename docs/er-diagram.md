# ER Diagram — Restaurant Order Management System

สร้างจาก `database/schema.sql` (ตรงกับฐานข้อมูลจริงทุกตารางและทุก FK) · รูปภาพ: [er-diagram.png](er-diagram.png)

- **11 entities**, **12 relationships** (13 foreign keys — ความสัมพันธ์ M:N นับเป็น 1)
- `PK` = primary key, `FK` = foreign key, `UK` = unique

```mermaid
erDiagram
    employee ||--o| sys_user : "has login"
    employee ||--o{ orders : "takes (employee_id)"
    employee ||--o{ orders : "receives payment (paid_by)"
    customer ||--o{ orders : places
    customer ||--o{ reservation : makes
    dining_table ||--o{ reservation : "reserved for"
    dining_table ||--o{ table_session : "QR session"
    dining_table ||--o{ orders : "served at"
    table_session |o--o{ orders : "ordered via"
    orders ||--|{ order_item : contains
    menu_item ||--o{ order_item : "ordered as"
    menu_item ||--o{ menu_item_ingredient : "recipe"
    ingredient ||--o{ menu_item_ingredient : "used in"

    employee {
        INT employee_id PK
        VARCHAR first_name
        VARCHAR last_name
        VARCHAR position
        VARCHAR phone
        VARCHAR email
        DATE hire_date
    }
    sys_user {
        INT user_id PK
        INT employee_id FK,UK
        VARCHAR username UK
        VARCHAR password_hash "bcrypt"
        ENUM role "admin|chef|waiter|cashier"
    }
    customer {
        INT customer_id PK
        VARCHAR first_name
        VARCHAR last_name
        VARCHAR phone
        VARCHAR address
    }
    dining_table {
        INT table_id PK
        VARCHAR table_number UK
        INT capacity
        ENUM status "available|occupied|reserved|inactive"
    }
    table_session {
        INT session_id PK
        INT table_id FK
        VARCHAR qr_token UK
        TIMESTAMP created_at
        TIMESTAMP expires_at
        ENUM status "active|closed|expired"
    }
    reservation {
        INT reservation_id PK
        INT customer_id FK
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
        INT session_id FK
        INT customer_id FK
        INT employee_id FK
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
| 1 | employee — sys_user | 1 : 0..1 | `sys_user.employee_id` (UNIQUE) | CASCADE |
| 2 | employee — orders (สั่งแทนลูกค้า) | 1 : 0..N | `orders.employee_id` | SET NULL |
| 3 | employee — orders (รับชำระเงิน) | 1 : 0..N | `orders.paid_by` | SET NULL |
| 4 | customer — orders | 1 : 0..N | `orders.customer_id` | SET NULL |
| 5 | customer — reservation | 1 : 0..N | `reservation.customer_id` | CASCADE |
| 6 | dining_table — reservation | 1 : 0..N | `reservation.table_id` | CASCADE |
| 7 | dining_table — table_session | 1 : 0..N | `table_session.table_id` | CASCADE |
| 8 | dining_table — orders | 1 : 0..N | `orders.table_id` | RESTRICT |
| 9 | table_session — orders | 0..1 : 0..N | `orders.session_id` | SET NULL |
| 10 | orders — order_item | 1 : 1..N | `order_item.order_id` | CASCADE |
| 11 | menu_item — order_item | 1 : 0..N | `order_item.menu_item_id` | RESTRICT |
| 12 | menu_item — ingredient (M:N ผ่าน `menu_item_ingredient`) | M : N | `menu_item_ingredient.menu_item_id`, `.ingredient_id` | CASCADE |

`menu_item_ingredient` เป็นตารางเชื่อม (bridge) ของความสัมพันธ์ M:N ระหว่างเมนูกับวัตถุดิบ PK เป็น composite key `(menu_item_id, ingredient_id)`
