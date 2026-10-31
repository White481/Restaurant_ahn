-- รันครั้งเดียวกับฐานข้อมูลที่สร้างไว้แล้ว (ข้อมูลเดิมไม่หาย)
-- ถ้าสร้างฐานข้อมูลใหม่จาก schema.sql ล่าสุด ไม่ต้องรันไฟล์นี้
USE restaurant_oms;

-- ซ่อนเมนูแทนการลบ: เมนูที่เคยถูกสั่งแล้วลบไม่ได้ (order_item อ้างถึงด้วย FK ON DELETE RESTRICT)
ALTER TABLE menu_item ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER image_url;
