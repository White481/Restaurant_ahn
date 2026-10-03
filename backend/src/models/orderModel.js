const db = require('../config/db');

exports.createOrder = async (orderData, items) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. สร้าง Record ในตาราง orders
        const { table_id, session_id, customer_id, employee_id, order_type, special_request, payment_method } = orderData;
        const [orderResult] = await connection.execute(
            `INSERT INTO orders (table_id, session_id, customer_id, employee_id, order_type, special_request, payment_method)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [table_id, session_id || null, customer_id || null, employee_id || null, order_type, special_request || null, payment_method || null]
        );

        const orderId = orderResult.insertId;
        let totalPrice = 0;

        // 2. เพิ่มรายการ order_item และคำนวณราคารวม
        for (const item of items) {
            // ดึงราคาเมนูจากตาราง menu_item
            const [menuRows] = await connection.execute('SELECT price FROM menu_item WHERE menu_item_id = ?', [item.menu_item_id]);
            if (menuRows.length === 0) throw new Error(`Menu item ${item.menu_item_id} not found`);

            const subtotal = menuRows[0].price * item.quantity;
            totalPrice += subtotal;

            await connection.execute(
                `INSERT INTO order_item (order_id, menu_item_id, quantity, subtotal)
                 VALUES (?, ?, ?, ?)`,
                [orderId, item.menu_item_id, item.quantity, subtotal]
            );
        }

        // 3. อัปเดตราคารวมในตาราง orders
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

// 1. ดึงรายการออเดอร์ทั้งหมด
exports.getAllOrders = async () => {
  const [rows] = await db.execute('SELECT * FROM orders ORDER BY order_id DESC');
  return rows;
};

// 2. อัปเดตสถานะออเดอร์
exports.updateStatus = async (id, status) => {
  await db.execute('UPDATE orders SET status = ? WHERE order_id = ?', [status, id]);
};