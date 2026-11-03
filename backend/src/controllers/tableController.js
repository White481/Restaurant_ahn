const tableModel = require('../models/tableModel');
const { HttpError, asyncHandler } = require('../middleware/errorHandler');
const { TABLE_TRANSITIONS, checkTransition } = require('../config/permissions');

function parseId(value) {
    const id = Number(value);
    if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'Invalid table id');
    return id;
}

// GET /api/tables (admin, waiter)
exports.getTables = asyncHandler(async (req, res) => {
    res.json(await tableModel.getTables());
});

// GET /api/tables/:id (ไม่ต้อง login) — ลูกค้าดูว่าโต๊ะเปิดให้สั่งแล้วหรือยัง
exports.getTable = asyncHandler(async (req, res) => {
    const table = await tableModel.getTable(parseId(req.params.id));
    if (!table) throw new HttpError(404, 'Table not found');
    res.json(table);
});

// PATCH /api/tables/:id/status { status: 'occupied' | 'available' | 'inactive' }
//   available -> occupied = เปิดโต๊ะ (ลูกค้าสั่งได้), occupied -> available = ปิดโต๊ะ
exports.updateTableStatus = asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const { status } = req.body || {};
    if (!Object.keys(TABLE_TRANSITIONS).includes(status)) {
        throw new HttpError(400, `status must be one of: ${Object.keys(TABLE_TRANSITIONS).join(', ')}`);
    }

    const from = await tableModel.getStatus(id);
    if (!from) throw new HttpError(404, 'Table not found');
    const denied = checkTransition(req.user.role, from, status, TABLE_TRANSITIONS, 'table');
    if (denied) throw new HttpError(denied.status, denied.message);

    await tableModel.updateStatus(id, from, status);
    res.json({ message: 'Table status updated', table_id: id, status });
});
