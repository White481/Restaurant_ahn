const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const { HttpError, asyncHandler } = require('../middleware/errorHandler');

// hash หลอก ไว้เทียบเมื่อไม่พบ username เพื่อให้เวลาตอบใกล้เคียงกัน
// (กันคนวัดเวลาตอบเพื่อเดาว่ามี username นี้อยู่ในระบบหรือไม่)
const DUMMY_HASH = bcrypt.hashSync('dummy-password', 10);

exports.login = asyncHandler(async (req, res) => {
    const { username, password } = req.body || {};

    if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
        throw new HttpError(400, 'Bad Request: username and password are required');
    }

    const user = await userModel.findUserByUsername(username);

    // bcrypt.compare เทียบรหัสผ่านที่พิมพ์มากับ hash ใน DB (ไม่มีการถอด hash กลับเป็นรหัสจริง)
    const passwordMatches = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);

    if (!user || !passwordMatches) {
        throw new HttpError(401, 'Invalid username or password');
    }

    const token = jwt.sign(
        { id: user.user_id, employee_id: user.employee_id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.json({
        message: 'Login successful',
        token,
        user: {
            id: user.user_id,
            username: user.username,
            role: user.role,
            employee_name: `${user.first_name} ${user.last_name}`
        }
    });
});
