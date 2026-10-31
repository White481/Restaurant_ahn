-- =====================================================================
-- Triggers (MySQL 8+) — รันหลัง schema.sql
--   MySQL CLI:  mysql -u root -p restaurant_oms < database/triggers.sql
--   Workbench:  เปิดไฟล์นี้แล้วกด Execute (รองรับ DELIMITER)
-- หมายเหตุ: TiDB Cloud ไม่รองรับ trigger / stored procedure
-- =====================================================================
USE restaurant_oms;

DROP TRIGGER IF EXISTS trg_order_item_bi_stock;
DROP TRIGGER IF EXISTS trg_orders_ai_table;
DROP TRIGGER IF EXISTS trg_orders_au_status;

DELIMITER $$

-- ---------------------------------------------------------------------
-- 1) ตัดสต็อกวัตถุดิบตามสูตร (menu_item_ingredient) ทุกครั้งที่เพิ่มรายการอาหารในออเดอร์
--    ถ้าวัตถุดิบตัวไหนไม่พอ -> SIGNAL ยกเลิกการ INSERT (backend rollback ทั้งออเดอร์ และแจ้งลูกค้าว่าของหมด)
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_order_item_bi_stock
BEFORE INSERT ON order_item

FOR EACH ROW
BEGIN
  DECLARE v_short VARCHAR(100);

  SELECT i.ingredient_name INTO v_short
  FROM menu_item_ingredient r
  JOIN ingredient i ON i.ingredient_id = r.ingredient_id
  WHERE r.menu_item_id = NEW.menu_item_id
    AND i.quantity_in_stock < r.quantity_needed * NEW.quantity
  LIMIT 1;

  IF v_short IS NOT NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Out of stock: not enough ingredients for this item';
  END IF;

  UPDATE ingredient i
  JOIN menu_item_ingredient r ON r.ingredient_id = i.ingredient_id
  SET i.quantity_in_stock = i.quantity_in_stock - r.quantity_needed * NEW.quantity
  WHERE r.menu_item_id = NEW.menu_item_id;
END$$

-- ---------------------------------------------------------------------
-- 2) ออเดอร์ทานที่ร้านเข้ามา -> โต๊ะเปลี่ยนเป็น "occupied" อัตโนมัติ
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_orders_ai_table
AFTER INSERT ON orders
FOR EACH ROW
BEGIN
  IF NEW.order_type = 'dine_in' THEN
    UPDATE dining_table SET status = 'occupied'
    WHERE table_id = NEW.table_id AND status = 'available';
  END IF;
END$$

-- ---------------------------------------------------------------------
-- 3) เมื่อออเดอร์จบ (completed / cancelled)
--    - ยกเลิก: คืนสต็อกวัตถุดิบที่ถูกตัดไปตอนสั่ง
--    - โต๊ะไม่มีออเดอร์ที่ยังไม่จบเหลืออยู่แล้ว -> โต๊ะกลับเป็น "available"
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_orders_au_status
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
    UPDATE ingredient i
    JOIN (
      SELECT r.ingredient_id, SUM(r.quantity_needed * oi.quantity) AS qty
      FROM order_item oi
      JOIN menu_item_ingredient r ON r.menu_item_id = oi.menu_item_id
      WHERE oi.order_id = NEW.order_id
      GROUP BY r.ingredient_id
    ) used ON used.ingredient_id = i.ingredient_id
    SET i.quantity_in_stock = i.quantity_in_stock + used.qty;
  END IF;

  IF NEW.status IN ('completed', 'cancelled') AND OLD.status NOT IN ('completed', 'cancelled') THEN
    UPDATE dining_table t
    SET t.status = 'available'
    WHERE t.table_id = NEW.table_id
      AND t.status = 'occupied'
      AND NOT EXISTS (
        SELECT 1 FROM orders o
        WHERE o.table_id = NEW.table_id
          AND o.order_id <> NEW.order_id
          AND o.status NOT IN ('completed', 'cancelled')
      );
  END IF;
END$$

DELIMITER ;
