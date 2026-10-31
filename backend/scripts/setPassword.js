/**
 * เปลี่ยนรหัสผ่านของบัญชีพนักงาน (hash ด้วย bcrypt ก่อนบันทึก)
 *
 * วิธีใช้ (ในโฟลเดอร์ backend):
 *   npm run set:password -- <username>
 * แล้วพิมพ์รหัสผ่านใหม่เมื่อถูกถาม (ไม่ต้องพิมพ์รหัสในคำสั่ง จะได้ไม่ค้างอยู่ใน history ของ terminal)
 */
const readline = require('readline');
const bcrypt = require('bcryptjs');
const db = require('../src/config/db');

function ask(question) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
    }));
}

async function main() {
    const username = process.argv[2];
    if (!username) throw new Error('Usage: npm run set:password -- <username>');

    const password = process.env.NEW_PASSWORD || await ask(`New password for ${username}: `);
    if (password.length < 8) throw new Error('Password must be at least 8 characters');

    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.execute('UPDATE sys_user SET password_hash = ? WHERE username = ?', [hash, username]);
    if (result.affectedRows === 0) throw new Error(`User ${username} not found`);

    console.log(`Password updated for ${username}`);
    await db.end();
}

main().catch((err) => {
    console.error(err.message);
    process.exit(1);
});
