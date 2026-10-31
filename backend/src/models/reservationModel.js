const db = require('../config/db');
const { HttpError } = require('../middleware/errorHandler');

// การจอง 1 ครั้งกันโต๊ะไว้ 2 ชั่วโมง: การจองโต๊ะเดียวกันวันเดียวกันที่เวลาห่างกันน้อยกว่านี้ถือว่าซ้อน
const SLOT_SECONDS = 2 * 60 * 60;

// เงื่อนไข "โต๊ะ t ไม่มีการจองที่ยังไม่จบซ้อนเวลา" ใช้ทั้งตอนหาโต๊ะอัตโนมัติและตอนเลือกโต๊ะเอง
// พารามิเตอร์ตามลำดับ: excludeReservationId, date, time, SLOT_SECONDS
const NO_OVERLAP = `NOT EXISTS (
    SELECT 1 FROM reservation r
    WHERE r.table_id = t.table_id
      AND r.reservation_id <> ?
      AND r.reservation_date = ?
      AND r.status IN ('pending', 'confirmed')
      AND ABS(TIME_TO_SEC(TIMEDIFF(r.reservation_time, ?))) < ?
)`;

// ส่งวันที่/เวลาเป็นข้อความ (DATE ของ mysql2 เป็น Date object ซึ่งแปลงเป็น JSON แล้ววันอาจเลื่อนตาม timezone)
const SELECT_RESERVATION = `
    SELECT r.reservation_id, r.customer_name, r.phone, r.table_id, r.party_size, r.status,
           DATE_FORMAT(r.reservation_date, '%Y-%m-%d') AS reservation_date,
           TIME_FORMAT(r.reservation_time, '%H:%i') AS reservation_time,
           t.table_number, t.capacity
    FROM reservation r
    JOIN dining_table t ON t.table_id = r.table_id`;

// หาโต๊ะที่เล็กที่สุดที่นั่งพอและว่างในช่วงเวลานั้น (ล็อกแถวโต๊ะไว้กันสองคนจองโต๊ะเดียวกันพร้อมกัน)
async function findFreeTable(conn, { date, time, partySize, excludeId = 0 }) {
    const [rows] = await conn.execute(
        `SELECT t.table_id, t.table_number, t.capacity
         FROM dining_table t
         WHERE t.capacity >= ? AND t.status <> 'inactive' AND ${NO_OVERLAP}
         ORDER BY t.capacity, t.table_id
         LIMIT 1
         FOR UPDATE`,
        [partySize, excludeId, date, time, SLOT_SECONDS]
    );
    return rows[0] || null;
}

// ตรวจโต๊ะที่พนักงานเลือกเอง: มีอยู่จริง, ที่นั่งพอ, ไม่ซ้อนเวลากับการจองอื่น
async function assertTableFree(conn, { tableId, date, time, partySize, excludeId }) {
    const [rows] = await conn.execute(
        `SELECT t.table_id, t.capacity, ${NO_OVERLAP} AS is_free
         FROM dining_table t WHERE t.table_id = ? FOR UPDATE`,
        [excludeId, date, time, SLOT_SECONDS, tableId]
    );
    if (rows.length === 0) throw new HttpError(400, `Table ${tableId} not found`);
    if (rows[0].capacity < partySize) throw new HttpError(409, `Table ${tableId} seats only ${rows[0].capacity}`);
    if (!rows[0].is_free) throw new HttpError(409, `Table ${tableId} is already reserved around that time`);
}

// ลูกค้าจองโต๊ะ: หาโต๊ะว่าง -> บันทึกการจองพร้อมชื่อและเบอร์ผู้จอง (ทั้งหมดใน transaction เดียว)
exports.createReservation = async ({ customerName, phone, date, time, partySize }) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const table = await findFreeTable(conn, { date, time, partySize });
        if (!table) throw new HttpError(409, 'No table is available for that date and time');

        const [result] = await conn.execute(
            `INSERT INTO reservation (customer_name, phone, table_id, reservation_date, reservation_time, party_size)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [customerName, phone, table.table_id, date, time, partySize]
        );

        await conn.commit();
        return { reservation_id: result.insertId, table_number: table.table_number, status: 'pending' };
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
};

// การจองของวันที่เลือก เรียงตามเวลา
exports.getReservationsByDate = async (date) => {
    const [rows] = await db.execute(
        `${SELECT_RESERVATION} WHERE r.reservation_date = ? ORDER BY r.reservation_time, r.reservation_id`,
        [date]
    );
    return rows;
};

exports.getReservation = async (id) => {
    const [rows] = await db.execute(`${SELECT_RESERVATION} WHERE r.reservation_id = ?`, [id]);
    return rows[0] || null;
};

// เปลี่ยนสถานะจาก from -> to (controller ตรวจสิทธิ์และขั้นแล้ว) ใส่ status = from ใน WHERE กันกดซ้อนกัน
exports.updateStatus = async (id, from, to) => {
    const [result] = await db.execute(
        'UPDATE reservation SET status = ? WHERE reservation_id = ? AND status = ?',
        [to, id, from]
    );
    if (result.affectedRows === 0) throw new HttpError(409, 'Reservation was changed by someone else, please refresh');
};

// แก้ไขการจอง (โต๊ะ วัน เวลา จำนวนคน) เฉพาะที่ยังไม่จบ
exports.updateReservation = async (id, { tableId, date, time, partySize }) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const [rows] = await conn.execute('SELECT status FROM reservation WHERE reservation_id = ? FOR UPDATE', [id]);
        if (rows.length === 0) throw new HttpError(404, 'Reservation not found');
        if (!['pending', 'confirmed'].includes(rows[0].status)) {
            throw new HttpError(409, `Reservation is already ${rows[0].status}`);
        }

        await assertTableFree(conn, { tableId, date, time, partySize, excludeId: id });
        await conn.execute(
            `UPDATE reservation SET table_id = ?, reservation_date = ?, reservation_time = ?, party_size = ?
             WHERE reservation_id = ?`,
            [tableId, date, time, partySize, id]
        );
        await conn.commit();
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
};

// คืน true ถ้าพบและลบแล้ว
exports.deleteReservation = async (id) => {
    const [result] = await db.execute('DELETE FROM reservation WHERE reservation_id = ?', [id]);
    return result.affectedRows > 0;
};

// โต๊ะทั้งหมด (ให้พนักงานเลือกตอนย้ายโต๊ะ)
exports.getTables = async () => {
    const [rows] = await db.query('SELECT table_id, table_number, capacity, status FROM dining_table ORDER BY table_id');
    return rows;
};
