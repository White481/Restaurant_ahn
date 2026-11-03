const db = require('../config/db');
const { HttpError } = require('../middleware/errorHandler');

// ออเดอร์ที่ยังไม่จบ = ยังไม่ชำระเงินและยังไม่ถูกยกเลิก
const ACTIVE_ORDERS = `(SELECT COUNT(*) FROM orders o
                        WHERE o.table_id = t.table_id AND o.status NOT IN ('completed', 'cancelled'))`;

// รายการโต๊ะทั้งหมด + จำนวนออเดอร์ที่ยังค้าง (หน้า "โต๊ะ" ของพนักงาน)
exports.getTables = async () => {
    const [rows] = await db.query(
        `SELECT t.table_id, t.table_number, t.capacity, t.status, ${ACTIVE_ORDERS} AS active_orders
         FROM dining_table t
         ORDER BY t.table_id`
    );
    return rows;
};

// สถานะโต๊ะเดียว (ลูกค้าเช็กก่อนสั่งว่าโต๊ะเปิดแล้วหรือยัง ไม่ส่งข้อมูลอื่น)
exports.getTable = async (id) => {
    const [rows] = await db.execute('SELECT table_id, table_number, status FROM dining_table WHERE table_id = ?', [id]);
    return rows[0] || null;
};

exports.getStatus = async (id) => {
    const [rows] = await db.execute('SELECT status FROM dining_table WHERE table_id = ?', [id]);
    return rows[0] ? rows[0].status : null;
};

// เปลี่ยนสถานะโต๊ะ (เช็กสิทธิ์ใน controller แล้ว)
// ปิดโต๊ะ: ต้องไม่มีออเดอร์ค้าง / UPDATE แบบมีเงื่อนไข from กันสองคนกดพร้อมกัน
exports.updateStatus = async (id, from, to) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        if (from === 'occupied' && to === 'available') {
            const [[{ active }]] = await conn.execute(
                `SELECT COUNT(*) AS active FROM orders
                 WHERE table_id = ? AND status NOT IN ('completed', 'cancelled') FOR UPDATE`,
                [id]
            );
            if (active > 0) throw new HttpError(409, `Table still has ${active} unpaid order(s)`);
        }
        const [result] = await conn.execute(
            'UPDATE dining_table SET status = ? WHERE table_id = ? AND status = ?',
            [to, id, from]
        );
        if (result.affectedRows === 0) throw new HttpError(409, 'Table status was changed by someone else, please refresh');
        await conn.commit();
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};
