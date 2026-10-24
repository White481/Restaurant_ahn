-- รันครั้งเดียวกับฐานข้อมูลที่สร้างไว้แล้ว (ข้อมูลเดิมไม่หาย)
-- ถ้าสร้างฐานข้อมูลใหม่จาก schema.sql ล่าสุด ไม่ต้องรันไฟล์นี้
USE restaurant_oms;

-- ลิงก์รูปเมนู (ไม่บังคับ) ใช้แสดงบนหน้าเมนูของลูกค้า
ALTER TABLE menu_item ADD COLUMN image_url VARCHAR(500) NULL AFTER price;
