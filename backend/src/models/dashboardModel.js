const db = require('../config/db');

// คำสั่งเดียวกับ stored procedure sp_sales_summary (database/procedures.sql)
// ใช้สำรองเฉพาะเมื่อฐานข้อมูลไม่มี procedure นี้ (เช่น TiDB Cloud ซึ่งไม่รองรับ stored procedure)
const SALES_SUMMARY_FALLBACK = `
    SELECT
      ? AS report_date,
      (SELECT COALESCE(SUM(total_price), 0) FROM orders WHERE status = 'completed' AND DATE(paid_at) = ?) AS revenue,
      (SELECT COUNT(*) FROM orders WHERE status = 'completed' AND DATE(paid_at) = ?) AS paid_orders,
      (SELECT COALESCE(AVG(total_price), 0) FROM orders WHERE status = 'completed' AND DATE(paid_at) = ?) AS avg_order,
      (SELECT COUNT(*) FROM orders WHERE DATE(order_date) = ?) AS total_orders,
      (SELECT COUNT(*) FROM orders WHERE status = 'cancelled' AND DATE(order_date) = ?) AS cancelled,
      (SELECT COALESCE(SUM(oi.quantity), 0) FROM order_item oi JOIN orders o ON o.order_id = oi.order_id
        WHERE o.status <> 'cancelled' AND DATE(o.order_date) = ?) AS items_sold`;

// สรุปยอดขายของวันที่ date (YYYY-MM-DD) ผ่าน stored procedure
// คืน { ...ตัวเลข, source: 'procedure' | 'query' } (source บอกว่าได้ผลมาจาก procedure จริงหรือคำสั่งสำรอง)
exports.getSalesSummary = async (date) => {
    let row;
    let source = 'procedure';
    try {
        // CALL คืนผลเป็น [ [แถวผลลัพธ์], ข้อมูลสถานะ ]
        const [results] = await db.query('CALL sp_sales_summary(?)', [date]);
        row = results[0][0];
    } catch (error) {
        if (!['ER_SP_DOES_NOT_EXIST', 'ER_PARSE_ERROR', 'ER_NOT_SUPPORTED_YET'].includes(error.code)) throw error;
        const [rows] = await db.query(SALES_SUMMARY_FALLBACK, Array(7).fill(date));
        row = rows[0];
        source = 'query';
    }
    return {
        revenue: Number(row.revenue) || 0,
        paid_orders: Number(row.paid_orders) || 0,
        avg_order: Math.round((Number(row.avg_order) || 0) * 100) / 100,
        total_orders: Number(row.total_orders) || 0,
        cancelled: Number(row.cancelled) || 0,
        items_sold: Number(row.items_sold) || 0,
        source
    };
};

// จำนวนออเดอร์ของวันที่เลือก แยกตามสถานะ -> { placed: 2, preparing: 1, ... }
exports.getOrderCountByStatus = async (date) => {
    const [rows] = await db.query(
        `SELECT status, COUNT(*) AS count
         FROM orders
         WHERE DATE(order_date) = ?
         GROUP BY status`,
        [date]
    );
    const result = {};
    for (const row of rows) {
        result[row.status] = row.count;
    }
    return result;
};

// เมนูขายดีของวันที่เลือก (ไม่นับออเดอร์ที่ยกเลิก)
exports.getTopSellingItems = async (date, limit = 5) => {
    const [rows] = await db.query(
        `SELECT mi.menu_item_id, mi.item_name, mi.item_name_en, mi.category,
                SUM(oi.quantity) AS total_qty,
                SUM(oi.subtotal)  AS total_revenue
         FROM order_item oi
         JOIN orders o ON o.order_id = oi.order_id
         JOIN menu_item mi ON mi.menu_item_id = oi.menu_item_id
         WHERE DATE(o.order_date) = ?
           AND o.status != 'cancelled'
         GROUP BY mi.menu_item_id
         ORDER BY total_qty DESC
         LIMIT ?`,
        [date, limit]
    );
    return rows;
};

// สถานะการใช้งานโต๊ะ (trigger เปลี่ยนให้อัตโนมัติเมื่อมีออเดอร์เข้า/ออเดอร์จบ)
exports.getTableStats = async () => {
    const [rows] = await db.query(
        `SELECT status, COUNT(*) AS count
         FROM dining_table
         GROUP BY status`
    );
    const result = {};
    for (const row of rows) {
        result[row.status] = row.count;
    }
    return result;
};

// สต็อกวัตถุดิบ น้อยสุดอยู่บน (trigger ตัดสต็อกเมื่อสั่ง และคืนเมื่อยกเลิก)
exports.getIngredientStock = async () => {
    const [rows] = await db.query(
        `SELECT ingredient_id, ingredient_name, quantity_in_stock, unit
         FROM ingredient
         ORDER BY quantity_in_stock ASC, ingredient_name`
    );
    return rows;
};

// จำนวนลูกค้าทั้งหมด
exports.getTotalCustomers = async () => {
    const [rows] = await db.query('SELECT COUNT(*) AS count FROM customer');
    return rows[0].count;
};

// จำนวนพนักงานทั้งหมด
exports.getTotalEmployees = async () => {
    const [rows] = await db.query('SELECT COUNT(*) AS count FROM employee');
    return rows[0].count;
};

// ออเดอร์ล่าสุด 10 รายการ (พร้อมรายการอาหาร)
exports.getRecentOrders = async (limit = 10) => {
    const [orders] = await db.query(
        `SELECT o.order_id, o.table_id, o.order_type, o.status,
                o.total_price, o.order_date, o.payment_method,
                t.table_number,
                NULLIF(CONCAT_WS(' ', e.first_name, e.last_name), '') AS employee_name
         FROM orders o
         LEFT JOIN dining_table t ON t.table_id = o.table_id
         LEFT JOIN employee e ON e.employee_id = o.employee_id
         ORDER BY o.order_date DESC
         LIMIT ?`,
        [limit]
    );

    if (orders.length === 0) return [];

    const [items] = await db.query(
        `SELECT oi.order_id, mi.item_name, mi.item_name_en, oi.quantity, oi.subtotal
         FROM order_item oi
         JOIN menu_item mi ON mi.menu_item_id = oi.menu_item_id
         WHERE oi.order_id IN (?)`,
        [orders.map((o) => o.order_id)]
    );

    const itemsByOrder = new Map();
    for (const item of items) {
        if (!itemsByOrder.has(item.order_id)) itemsByOrder.set(item.order_id, []);
        itemsByOrder.get(item.order_id).push(item);
    }

    return orders.map((order) => ({ ...order, items: itemsByOrder.get(order.order_id) || [] }));
};
