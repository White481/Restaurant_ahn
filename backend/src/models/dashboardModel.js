const db = require('../config/db');

// สรุปยอดรายได้วันนี้ (เฉพาะออเดอร์ที่ completed แล้ว)
exports.getTodayRevenue = async () => {
    const [rows] = await db.query(
        `SELECT COALESCE(SUM(total_price), 0) AS revenue
         FROM orders
         WHERE status = 'completed'
           AND DATE(order_date) = CURDATE()`
    );
    return Number(rows[0].revenue) || 0;
};

// จำนวนออเดอร์วันนี้แยกตามสถานะ
exports.getTodayOrderCountByStatus = async () => {
    const [rows] = await db.query(
        `SELECT status, COUNT(*) AS count
         FROM orders
         WHERE DATE(order_date) = CURDATE()
         GROUP BY status`
    );
    // แปลงจาก array ของ { status, count } เป็น object { placed: 0, preparing: 0, ... }
    const result = {};
    for (const row of rows) {
        result[row.status] = row.count;
    }
    return result;
};

// ยอดเฉลี่ยต่อออเดอร์วันนี้ (เฉพาะ completed)
exports.getTodayAverageOrderValue = async () => {
    const [rows] = await db.query(
        `SELECT COALESCE(AVG(total_price), 0) AS avg_value
         FROM orders
         WHERE status = 'completed'
           AND DATE(order_date) = CURDATE()`
    );
    return Number(rows[0].avg_value) || 0;
};

// เมนูขายดับ 5 อันดับแรกของวันนี้
exports.getTopSellingItems = async (limit = 5) => {
    const [rows] = await db.query(
        `SELECT mi.menu_item_id, mi.item_name, mi.item_name_en, mi.category,
                SUM(oi.quantity) AS total_qty,
                SUM(oi.subtotal)  AS total_revenue
         FROM order_item oi
         JOIN orders o ON o.order_id = oi.order_id
         JOIN menu_item mi ON mi.menu_item_id = oi.menu_item_id
         WHERE DATE(o.order_date) = CURDATE()
           AND o.status != 'cancelled'
         GROUP BY mi.menu_item_id
         ORDER BY total_qty DESC
         LIMIT ?`,
        [limit]
    );
    return rows;
};

// สถานะการใช้งานโต๊ะ
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
