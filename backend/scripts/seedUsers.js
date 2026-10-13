/**
 * สร้างพนักงาน + บัญชี login ตัวอย่าง (รหัสผ่านถูก hash ด้วย bcrypt ก่อนเก็บลง DB)
 *
 * วิธีใช้ (รันในโฟลเดอร์ backend หลังรัน schema.sql และมีไฟล์ .env แล้ว):
 *   npm run seed:users
 *
 * รหัสผ่านด้านล่างเป็นของ "ทดลองใช้" เท่านั้น ห้ามใช้ตอน deploy จริง
 */
const bcrypt = require('bcryptjs');
const db = require('../src/config/db');

const USERS = [
    { first_name: 'Admin', last_name: 'Demo', position: 'Manager', username: 'admin', password: 'admin1234', role: 'admin' },
    { first_name: 'Chef', last_name: 'Demo', position: 'Chef', username: 'chef', password: 'chef1234', role: 'chef' },
    { first_name: 'Waiter', last_name: 'Demo', position: 'Waiter', username: 'waiter', password: 'waiter1234', role: 'waiter' },
    { first_name: 'Cashier', last_name: 'Demo', position: 'Cashier', username: 'cashier', password: 'cashier1234', role: 'cashier' }
];

async function main() {
    for (const u of USERS) {
        const [existing] = await db.execute('SELECT user_id FROM sys_user WHERE username = ?', [u.username]);
        if (existing.length > 0) {
            console.log(`skip   ${u.username} (already exists)`);
            continue;
        }

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const [emp] = await connection.execute(
                'INSERT INTO employee (first_name, last_name, position, hire_date) VALUES (?, ?, ?, CURDATE())',
                [u.first_name, u.last_name, u.position]
            );

            const passwordHash = await bcrypt.hash(u.password, 10);
            await connection.execute(
                'INSERT INTO sys_user (employee_id, username, password_hash, role) VALUES (?, ?, ?, ?)',
                [emp.insertId, u.username, passwordHash, u.role]
            );

            await connection.commit();
            console.log(`create ${u.username} (role: ${u.role})`);
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    }
    await db.end();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
