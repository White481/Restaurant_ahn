/**
 * สร้างพนักงาน + บัญชี login ตัวอย่าง (รหัสผ่านถูก hash ด้วย bcrypt ก่อนเก็บลง DB)
 *
 * วิธีใช้ (รันในโฟลเดอร์ backend หลังรัน schema.sql และมีไฟล์ .env แล้ว):
 *   1. ตั้งรหัสผ่านใน .env: SEED_PASSWORD=... (ใช้กับทุกบัญชี)
 *      หรือแยกรายบัญชี: SEED_ADMIN_PASSWORD, SEED_CHEF_PASSWORD, SEED_WAITER_PASSWORD, SEED_CASHIER_PASSWORD
 *   2. npm run seed:users
 * รหัสผ่านไม่ได้เขียนไว้ในโค้ด (ไม่หลุดขึ้น GitHub) เปลี่ยนภายหลังได้ด้วย npm run set:password
 */
const bcrypt = require('bcryptjs');
const db = require('../src/config/db');

const USERS = [
    { first_name: 'Admin', last_name: 'Demo', position: 'Manager', username: 'admin', role: 'admin' },
    { first_name: 'Chef', last_name: 'Demo', position: 'Chef', username: 'chef', role: 'chef' },
    { first_name: 'Waiter', last_name: 'Demo', position: 'Waiter', username: 'waiter', role: 'waiter' },
    { first_name: 'Cashier', last_name: 'Demo', position: 'Cashier', username: 'cashier', role: 'cashier' }
];

const passwordFor = (role) => process.env[`SEED_${role.toUpperCase()}_PASSWORD`] || process.env.SEED_PASSWORD;

async function main() {
    const missing = USERS.filter((u) => !passwordFor(u.role) || passwordFor(u.role).length < 8);
    if (missing.length > 0) {
        throw new Error(
            'Set SEED_PASSWORD (or SEED_<ROLE>_PASSWORD) in backend/.env, at least 8 characters. ' +
            `Missing for: ${missing.map((u) => u.username).join(', ')}`
        );
    }

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

            const passwordHash = await bcrypt.hash(passwordFor(u.role), 10);
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
