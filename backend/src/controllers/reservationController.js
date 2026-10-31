const reservationModel = require('../models/reservationModel');
const { HttpError, asyncHandler } = require('../middleware/errorHandler');
const { RESERVATION_TRANSITIONS, checkTransition } = require('../config/permissions');

const SHOP_TIME_ZONE = 'Asia/Bangkok';
const FIRST_SLOT = '10:00'; // รับจองตั้งแต่
const LAST_SLOT = '20:30';  // จองรอบสุดท้าย
const MAX_DAYS_AHEAD = 60;
const MAX_PARTY = 20;
const STATUSES = ['pending', 'confirmed', 'cancelled', 'completed'];

// วันและเวลาปัจจุบันตามเวลาร้าน (server บน cloud มักเป็น UTC)
function shopNow() {
    const parts = Object.fromEntries(
        new Intl.DateTimeFormat('en-CA', { timeZone: SHOP_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
            .formatToParts(new Date())
            .map((p) => [p.type, p.value])
    );
    return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

const addDays = (isoDate, days) => {
    const d = new Date(`${isoDate}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
};

function toPositiveInt(value) {
    const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
    return Number.isInteger(n) && n > 0 ? n : null;
}

function parseDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) {
        throw new HttpError(400, 'date must be in YYYY-MM-DD format');
    }
    return value;
}

// ตรวจวัน/เวลา/จำนวนคน ใช้ทั้งตอนลูกค้าจองและตอนพนักงานแก้ไข
function parseSlot({ date, time, party_size }) {
    const d = parseDate(date);
    if (typeof time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
        throw new HttpError(400, 'time must be in HH:MM format');
    }
    if (time < FIRST_SLOT || time > LAST_SLOT) {
        throw new HttpError(400, `Reservations are available from ${FIRST_SLOT} to ${LAST_SLOT}`);
    }
    const now = shopNow();
    if (d < now.date || (d === now.date && time <= now.time)) throw new HttpError(400, 'Reservation time must be in the future');
    if (d > addDays(now.date, MAX_DAYS_AHEAD)) throw new HttpError(400, `Reservations open up to ${MAX_DAYS_AHEAD} days ahead`);

    const partySize = toPositiveInt(party_size);
    if (partySize === null || partySize > MAX_PARTY) throw new HttpError(400, `party_size must be between 1 and ${MAX_PARTY}`);
    return { date: d, time, partySize };
}

// POST /api/reservations (public) ลูกค้าจองโต๊ะ ระบบเลือกโต๊ะที่ว่างและนั่งพอให้
exports.createReservation = asyncHandler(async (req, res) => {
    const { name, phone } = req.body || {};
    if (typeof name !== 'string' || !name.trim() || name.trim().length > 100) {
        throw new HttpError(400, 'name is required (max 100 characters)');
    }
    if (typeof phone !== 'string' || !/^[0-9+\-\s]{9,15}$/.test(phone.trim())) {
        throw new HttpError(400, 'phone must be 9-15 digits');
    }
    const slot = parseSlot(req.body);

    // เก็บชื่อเต็มในช่องเดียว (reservation.customer_name สูงสุด 100 ตัวอักษร ตรวจไว้ด้านบนแล้ว)
    const result = await reservationModel.createReservation({
        customerName: name.trim().replace(/\s+/g, ' '),
        phone: phone.trim().replace(/[\s-]/g, ''),
        ...slot
    });

    res.status(201).json({ message: 'Reservation received', ...result, date: slot.date, time: slot.time, party_size: slot.partySize });
});

// GET /api/reservations?date=YYYY-MM-DD (พนักงาน) ไม่ใส่วันที่ = วันนี้
exports.getReservations = asyncHandler(async (req, res) => {
    const date = req.query.date === undefined ? shopNow().date : parseDate(req.query.date);
    res.json(await reservationModel.getReservationsByDate(date));
});

// GET /api/reservations/tables (พนักงาน) รายการโต๊ะไว้เลือกตอนย้ายโต๊ะ
exports.getTables = asyncHandler(async (req, res) => {
    res.json(await reservationModel.getTables());
});

// PATCH /api/reservations/:id/status { status } ยืนยัน / เช็คอิน / ยกเลิก
exports.updateStatus = asyncHandler(async (req, res) => {
    const id = toPositiveInt(req.params.id);
    if (id === null) throw new HttpError(400, 'Invalid reservation id');
    const { status } = req.body || {};
    if (!STATUSES.includes(status)) throw new HttpError(400, `status must be one of: ${STATUSES.join(', ')}`);

    const reservation = await reservationModel.getReservation(id);
    if (!reservation) throw new HttpError(404, 'Reservation not found');

    const denied = checkTransition(req.user.role, reservation.status, status, RESERVATION_TRANSITIONS, 'reservation');
    if (denied) throw new HttpError(denied.status, denied.message);

    await reservationModel.updateStatus(id, reservation.status, status);
    res.json({ message: 'Reservation updated', reservation_id: id, status });
});

// PUT /api/reservations/:id { table_id, date, time, party_size } ย้ายโต๊ะ / เปลี่ยนเวลา
exports.updateReservation = asyncHandler(async (req, res) => {
    const id = toPositiveInt(req.params.id);
    if (id === null) throw new HttpError(400, 'Invalid reservation id');
    const tableId = toPositiveInt((req.body || {}).table_id);
    if (tableId === null) throw new HttpError(400, 'table_id must be a positive integer');

    await reservationModel.updateReservation(id, { tableId, ...parseSlot(req.body) });
    res.json({ message: 'Reservation updated', reservation_id: id });
});

// DELETE /api/reservations/:id (admin) ลบถาวร
exports.deleteReservation = asyncHandler(async (req, res) => {
    const id = toPositiveInt(req.params.id);
    if (id === null) throw new HttpError(400, 'Invalid reservation id');
    if (!(await reservationModel.deleteReservation(id))) throw new HttpError(404, 'Reservation not found');
    res.json({ message: 'Reservation deleted', reservation_id: id });
});
