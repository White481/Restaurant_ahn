-- Sample data for Restaurant OMS
-- วิธีใช้: รันหลัง schema.sql "ครั้งเดียว" (รันซ้ำจะชน UNIQUE ของ table_number)
-- พนักงาน/บัญชี login ไม่ได้ใส่ที่นี่ เพราะต้อง hash รหัสผ่าน -> ใช้ `npm run seed:users` ใน backend/
USE restaurant_oms;

-- โต๊ะ
INSERT INTO dining_table (table_number, capacity, status) VALUES
  ('T1', 2, 'available'),
  ('T2', 2, 'available'),
  ('T3', 4, 'available'),
  ('T4', 4, 'available'),
  ('T5', 6, 'available');

-- เมนู
INSERT INTO menu_item (item_name, category, price) VALUES
  ('ข้าวผัดกะเพราหมูสับ', 'Main',      60.00),
  ('ผัดไทยกุ้งสด',        'Main',      80.00),
  ('ข้าวมันไก่',          'Main',      55.00),
  ('ต้มยำกุ้ง',           'Soup',     120.00),
  ('ส้มตำไทย',           'Salad',     50.00),
  ('ไก่ทอด',             'Appetizer', 70.00),
  ('ชาเย็น',             'Drink',     35.00),
  ('น้ำเปล่า',            'Drink',     10.00);

-- วัตถุดิบ
INSERT INTO ingredient (ingredient_name, quantity_in_stock, unit) VALUES
  ('หมูสับ',     5000, 'g'),
  ('ข้าวสวย',    8000, 'g'),
  ('ไข่ไก่',      100, 'pcs'),
  ('กุ้งสด',     3000, 'g'),
  ('เส้นผัดไทย', 4000, 'g'),
  ('ไก่',        6000, 'g'),
  ('มะละกอ',     2000, 'g'),
  ('ผงชาไทย',    1000, 'g');

-- สูตรอาหาร (เทียบ id ด้วยชื่อ จึงไม่ขึ้นกับเลข auto-increment)
INSERT INTO menu_item_ingredient (menu_item_id, ingredient_id, quantity_needed, unit)
SELECT m.menu_item_id, i.ingredient_id, r.qty, r.unit
FROM (
  SELECT 'ข้าวผัดกะเพราหมูสับ' AS menu, 'หมูสับ'     AS ing, 100 AS qty, 'g'   AS unit UNION ALL
  SELECT 'ข้าวผัดกะเพราหมูสับ',          'ข้าวสวย',            250,        'g'           UNION ALL
  SELECT 'ข้าวผัดกะเพราหมูสับ',          'ไข่ไก่',               1,        'pcs'         UNION ALL
  SELECT 'ผัดไทยกุ้งสด',                 'กุ้งสด',             150,        'g'           UNION ALL
  SELECT 'ผัดไทยกุ้งสด',                 'เส้นผัดไทย',         200,        'g'           UNION ALL
  SELECT 'ผัดไทยกุ้งสด',                 'ไข่ไก่',               1,        'pcs'         UNION ALL
  SELECT 'ข้าวมันไก่',                   'ไก่',                200,        'g'           UNION ALL
  SELECT 'ข้าวมันไก่',                   'ข้าวสวย',            250,        'g'           UNION ALL
  SELECT 'ต้มยำกุ้ง',                    'กุ้งสด',             200,        'g'           UNION ALL
  SELECT 'ส้มตำไทย',                    'มะละกอ',             150,        'g'           UNION ALL
  SELECT 'ไก่ทอด',                      'ไก่',                250,        'g'           UNION ALL
  SELECT 'ชาเย็น',                      'ผงชาไทย',             20,        'g'
) AS r
JOIN menu_item m ON m.item_name = r.menu
JOIN ingredient i ON i.ingredient_name = r.ing;
