// รวมเครื่องมือจัดการ error ไว้ที่เดียว

// error ที่ "เรารู้ว่าเกิดจาก client ส่งข้อมูลผิด" -> ตอบ status 4xx พร้อมข้อความได้
class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

// Express 4 ไม่จับ error ใน async function ให้เอง (Express 5 จับให้)
// ครอบ handler ด้วยฟังก์ชันนี้ แล้ว error จะถูกส่งต่อไปที่ errorHandler ด้านล่างเสมอ
const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

const notFound = (req, res) => {
    res.status(404).json({ message: 'Not found' });
};

// ต้องมี 4 พารามิเตอร์ Express ถึงจะรู้ว่านี่คือ error handler
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    if (err instanceof HttpError) {
        return res.status(err.status).json({ message: err.message });
    }
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ message: 'Invalid JSON body' });
    }
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(400).json({ message: 'Referenced record does not exist' });
    }

    // error ที่ไม่คาดคิด: log ไว้ที่ server เท่านั้น ไม่ส่งรายละเอียดกลับไปให้ client
    console.error('Unexpected error:', err);
    res.status(500).json({ message: 'Internal server error' });
};

module.exports = { HttpError, asyncHandler, notFound, errorHandler };
