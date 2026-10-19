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
    // cashier_name = ชื่อพนักงานที่รับชำระเงิน (ใช้พิมพ์บนใบเสร็จ) ยังไม่ชำระ = NULL
    const base = `SELECT o.*, NULLIF(CONCAT_WS(' ', e.first_name, e.last_name), '') AS cashier_name
                  FROM orders o LEFT JOIN employee e ON e.employee_id = o.paid_by`;
    const [orders] = status
        ? await db.execute(`${base} WHERE o.status = ? ORDER BY o.order_id DESC`, [status])
        : await db.execute(`${base} ORDER BY o.order_id DESC`);

    if (orders.length === 0) return [];

    const [items] = await db.query(
        `SELECT oi.order_id, oi.order_item_id, oi.menu_item_id, mi.item_name, mi.item_name_en, oi.quantity, oi.subtotal
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

// ดูสถานะของออเดอร์เดียว (ใช้กับหน้าติดตามสถานะของลูกค้า) คืน null ถ้าไม่พบ
exports.getStatus = async (id) => {
    const [rows] = await db.execute('SELECT order_id, status FROM orders WHERE order_id = ?', [id]);
    return rows[0] || null;
};

// รับชำระเงินและปิดออเดอร์ในขั้นตอนเดียว (ใช้ transaction + ล็อกแถว กันสองเครื่องกดจ่ายพร้อมกัน)
// payment_method: 'cash' ต้องมี amount_received (>= ยอดรวม) ส่วน card/qr ไม่ต้องใช้
exports.payOrder = async (id, { payment_method, amount_received, paid_by }) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [rows] = await connection.execute(
            'SELECT order_id, status, total_price FROM orders WHERE order_id = ? FOR UPDATE',
            [id]
        );
        if (rows.length === 0) throw new HttpError(404, 'Order not found');
        const order = rows[0];
        if (['completed', 'cancelled'].includes(order.status)) {
            throw new HttpError(409, `Order is already ${order.status}`);
        }

        const totalCents = Math.round(Number(order.total_price) * 100);
        let receivedCents = null;
        if (payment_method === 'cash') {
            receivedCents = Math.round(amount_received * 100);
            if (receivedCents < totalCents) throw new HttpError(400, 'amount_received is less than the order total');
        }

        await connection.execute(
            `UPDATE orders
             SET payment_method = ?, amount_received = ?, paid_by = ?, paid_at = NOW(), status = 'completed'
             WHERE order_id = ?`,
            [payment_method, receivedCents === null ? null : receivedCents / 100, paid_by || null, id]
        );

        await connection.commit();
        return {
            order_id: id,
            total_price: totalCents / 100,
            amount_received: receivedCents === null ? null : receivedCents / 100,
            change: receivedCents === null ? null : (receivedCents - totalCents) / 100
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};
