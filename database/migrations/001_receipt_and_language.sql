-- รันครั้งเดียวกับฐานข้อมูลที่สร้างไว้แล้ว (ข้อมูลเดิมไม่หาย)
-- ถ้าสร้างฐานข้อมูลใหม่จาก schema.sql + seed.sql ล่าสุด ไม่ต้องรันไฟล์นี้
USE restaurant_oms;

-- 1) ชื่อเมนูภาษาอังกฤษ
ALTER TABLE menu_item ADD COLUMN item_name_en VARCHAR(100) NULL AFTER item_name;

-- 2) ข้อมูลการรับชำระเงิน (ใช้ออกใบเสร็จ)
ALTER TABLE orders
  ADD COLUMN amount_received DECIMAL(10,2) NULL AFTER payment_method,
  ADD COLUMN paid_at TIMESTAMP NULL DEFAULT NULL AFTER amount_received,
  ADD COLUMN paid_by INT NULL AFTER paid_at,
  ADD CONSTRAINT fk_orders_paid_by
    FOREIGN KEY (paid_by) REFERENCES employee(employee_id)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- 3) ใส่ชื่ออังกฤษให้เมนูตัวอย่างจาก seed.sql (เมนูอื่นที่เพิ่มเองให้ไปกรอกในหน้าจัดการเมนู)
UPDATE menu_item SET item_name_en = 'Basil Pork Stir-fry with Rice'     WHERE item_name = 'ข้าวผัดกะเพราหมูสับ';
UPDATE menu_item SET item_name_en = 'Pad Thai with Fresh Prawns'        WHERE item_name = 'ผัดไทยกุ้งสด';
UPDATE menu_item SET item_name_en = 'Hainanese Chicken Rice'            WHERE item_name = 'ข้าวมันไก่';
UPDATE menu_item SET item_name_en = 'Tom Yum Goong (Spicy Prawn Soup)'  WHERE item_name = 'ต้มยำกุ้ง';
UPDATE menu_item SET item_name_en = 'Papaya Salad (Som Tam)'            WHERE item_name = 'ส้มตำไทย';
UPDATE menu_item SET item_name_en = 'Fried Chicken'                     WHERE item_name = 'ไก่ทอด';
UPDATE menu_item SET item_name_en = 'Thai Iced Tea'                     WHERE item_name = 'ชาเย็น';
UPDATE menu_item SET item_name_en = 'Drinking Water'                    WHERE item_name = 'น้ำเปล่า';
