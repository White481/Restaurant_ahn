const jwt = require('jsonwebtoken');

function readToken(req) {
    const [scheme, token] = (req.headers.authorization || '').split(' ');
    return scheme === 'Bearer' && token ? token : null;
}

// บังคับ login: requireAuth() = ใครที่ login แล้วก็ผ่าน
//               requireAuth(['admin']) = เฉพาะ role ที่ระบุ
exports.requireAuth = (allowedRoles = []) => (req, res, next) => {
    const token = readToken(req);
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized: missing token' });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        if (allowedRoles.length > 0 && !allowedRoles.includes(payload.role)) {
            return res.status(403).json({ message: 'Forbidden: insufficient role' });
        }
        req.user = payload;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Unauthorized: invalid or expired token' });
    }
};

// ไม่บังคับ login แต่ถ้ามี token ที่ถูกต้องก็ใส่ req.user ให้
// ใช้กับ POST /orders: ลูกค้าสั่งได้โดยไม่ login ส่วนพนักงานที่ login จะถูกบันทึก employee_id ให้เอง
exports.optionalAuth = (req, res, next) => {
    const token = readToken(req);
    if (token) {
        try {
            req.user = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            // token เสีย/หมดอายุ: ถือว่าเป็นลูกค้าทั่วไป
        }
    }
    next();
};
