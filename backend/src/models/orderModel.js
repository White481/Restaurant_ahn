const db = require('../config/db');
const { HttpError } = require('../middleware/errorHandler');

exports.ORDER_TYPES = ['dine_in', 'take_away'];
exports.PAYMENT_METHODS = ['cash', 'card', 'qr', 'other'];
exports.VALID_STATUSES = ['placed', 'preparing', 'ready', 'served', 'completed', 'cancelled'];

exports.createOrder = async (orderData, items) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { table_id, session_id, customer_id, employee_id, order_type, special_request, payment_method } = orderData;

        const [tables] = await connection.execute('SELECT table_id FROM dining_table WHERE table_id = ?', [table_id]);
        if (tables.length === 0) throw new HttpError(400, `Table ${table_id} not found`);

        // 1. สร้าง record ในตาราง orders
        const [orderResult] = await connection.execute(
            `INSERT INTO orders (table_id, session_id, customer_id, employee_id, order_type, special_request, payment_method)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [table_id, session_id || null, customer_id || null, employee_id || null, order_type, special_request || null, payment_method || null]
        );
        const orderId = orderResult.insertId;

        // 2. เพิ่มรายการอาหารลง order_item (ราคาดึงจาก DB เสมอ ไม่เชื่อราคาจาก client)
        // คำนวณเป็น "สตางค์" (integer) เพื่อเลี่ยงปัญหาทศนิยมของ floating point เช่น 0.1 + 0.2
        let totalCents = 0;
        for (const item of items) {
            const [menuRows] = await connection.execute(
                'SELECT price FROM menu_item WHERE menu_item_id = ?',
                [item.menu_item_id]
            );
            if (menuRows.length === 0) throw new HttpError(400, `Menu item ${item.menu_item_id} not found`);

            const priceCents = Math.round(Number(menuRows[0].price) * 100);
            const subtotalCents = priceCents * item.quantity;
            totalCents += subtotalCents;

            await connection.execute(
                `INSERT INTO order_item (order_id, menu_item_id, quantity, subtotal)
                 VALUES (?, ?, ?, ?)`,
                [orderId, item.menu_item_id, item.quantity, subtotalCents / 100]
            );
        }

        // 3. อัปเดตราคารวมในตาราง orders
        const totalPrice = totalCents / 100;
        await connection.execute('UPDATE orders SET total_price = ? WHERE order_id = ?', [totalPrice, orderId]);

        await connection.commit();
        return { orderId, totalPrice };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// ดึงออเดอร์พร้อมรายการอาหาร (ใช้กับหน้า Dashboard / ห้องครัว)
// status (optional): กรองตามสถานะ เช่น 'placed'
exports.getAllOrders = async ({ status } = {}) => {
    const [orders] = status
        ? await db.execute('SELECT * FROM orders WHERE status = ? ORDER BY order_id DESC', [status])
        : await db.execute('SELECT * FROM orders ORDER BY order_id DESC');

    if (orders.length === 0) return [];

    const [items] = await db.query(
        `SELECT oi.order_id, oi.order_item_id, oi.menu_item_id, mi.item_name, oi.quantity, oi.subtotal
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

// คืน true ถ้าพบออเดอร์และอัปเดตแล้ว, false ถ้าไม่พบออเดอร์นี้
exports.updateStatus = async (id, status) => {
    const [rows] = await db.execute('SELECT order_id FROM orders WHERE order_id = ?', [id]);
    if (rows.length === 0) return false;

    await db.execute('UPDATE orders SET status = ? WHERE order_id = ?', [status, id]);
    return true;
};
