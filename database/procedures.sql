-- =====================================================================
-- Stored procedures (MySQL 8+) — รันหลัง schema.sql
--   MySQL CLI:  mysql -u root -p restaurant_oms < database/procedures.sql
-- หมายเหตุ: TiDB Cloud ไม่รองรับ stored procedure (backend มีคำสั่ง SQL สำรองให้)
-- =====================================================================
USE restaurant_oms;

DROP PROCEDURE IF EXISTS sp_sales_summary;

DELIMITER $$

-- ---------------------------------------------------------------------
-- สรุปยอดขายของวันที่เลือก (ใช้กับหน้า Dashboard ของ admin: GET /api/dashboard?date=YYYY-MM-DD)
--   revenue        รายได้จากออเดอร์ที่ชำระเงินแล้วในวันนั้น (นับตาม paid_at)
--   paid_orders    จำนวนออเดอร์ที่ชำระเงินแล้ว
--   avg_order      ยอดเฉลี่ยต่อออเดอร์ที่ชำระแล้ว
--   total_orders   ออเดอร์ทั้งหมดที่สั่งในวันนั้น (นับตาม order_date)
--   cancelled      ออเดอร์ที่ถูกยกเลิกในวันนั้น
--   items_sold     จำนวนจานที่ขายได้ (ไม่นับออเดอร์ที่ยกเลิก)
-- ทดสอบ: CALL sp_sales_summary(CURDATE());
-- ---------------------------------------------------------------------
CREATE PROCEDURE sp_sales_summary(IN p_date DATE)
BEGIN
  SELECT
    p_date AS report_date,
    (SELECT COALESCE(SUM(total_price), 0) FROM orders
      WHERE status = 'completed' AND DATE(paid_at) = p_date) AS revenue,
    (SELECT COUNT(*) FROM orders
      WHERE status = 'completed' AND DATE(paid_at) = p_date) AS paid_orders,
    (SELECT COALESCE(AVG(total_price), 0) FROM orders
      WHERE status = 'completed' AND DATE(paid_at) = p_date) AS avg_order,
    (SELECT COUNT(*) FROM orders
      WHERE DATE(order_date) = p_date) AS total_orders,
    (SELECT COUNT(*) FROM orders
      WHERE status = 'cancelled' AND DATE(order_date) = p_date) AS cancelled,
    (SELECT COALESCE(SUM(oi.quantity), 0) FROM order_item oi
      JOIN orders o ON o.order_id = oi.order_id
      WHERE o.status <> 'cancelled' AND DATE(o.order_date) = p_date) AS items_sold;
END$$

DELIMITER ;
