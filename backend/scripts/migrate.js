/**
 * Migration 004: ย้ายฐานข้อมูลเดิม (11 ตาราง) ให้ตรงกับ schema.sql ปัจจุบัน (7 ตาราง)
 *   - employee + sys_user  -> staff        (staff_id = employee_id เดิม, ออเดอร์เก่ายังชี้คนเดิม, ข้อมูลไม่หาย)
 *   - orders: employee_id -> staff_id, ลบ session_id / customer_id
 *   - ลบ table_session (ไม่มีโค้ดใช้), customer และ reservation (ตัดระบบจองโต๊ะออก: การจองเดิมถูกลบ)
 *   - dining_table.status: ตัด 'reserved' ออก (โต๊ะที่จองไว้ -> available)
 *   - ลบ trigger ของระบบเก่า (MySQL) แล้วให้รัน database/triggers.sql ใหม่หลังสคริปต์นี้
 *
 * ใช้สคริปต์แทนไฟล์ .sql เพราะต้องเช็กก่อนว่าตาราง/คอลัมน์/FK มีอยู่ไหม (TiDB ไม่มี stored procedure)
 * จึงรันซ้ำได้อย่างปลอดภัย และใช้ได้ทั้ง MySQL 8 และ TiDB Cloud
 * ฐานข้อมูลที่สร้างใหม่จาก schema.sql ล่าสุดไม่ต้องรันสคริปต์นี้
 *
 * วิธีใช้ (ในโฟลเดอร์ backend): npm run migrate   แล้ว (MySQL เท่านั้น) รัน database/triggers.sql ใหม่
 * กับ TiDB: ตั้ง DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME / DB_SSL=true ก่อนรัน
 */
require('dotenv').config();
const db = require('../src/config/db');

const exists = async (sql, params) => (await db.query(sql, params))[0][0].n > 0;
const hasTable = (t) => exists(
    'SELECT COUNT(*) n FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?', [t]);
const hasColumn = (t, c) => exists(
    'SELECT COUNT(*) n FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?', [t, c]);
const hasForeignKey = (t, name) => exists(
    `SELECT COUNT(*) n FROM information_schema.table_constraints
     WHERE table_schema = DATABASE() AND table_name = ? AND constraint_name = ? AND constraint_type = 'FOREIGN KEY'`, [t, name]);

async function run(label, sql, params) {
    await db.query(sql, params);
    console.log(`done  ${label}`);
}

async function dropForeignKey(table, name) {
    if (await hasForeignKey(table, name)) await run(`drop FK ${table}.${name}`, `ALTER TABLE ${table} DROP FOREIGN KEY ${name}`);
}

async function dropColumn(table, column) {
    if (await hasColumn(table, column)) await run(`drop column ${table}.${column}`, `ALTER TABLE ${table} DROP COLUMN ${column}`);
}

async function main() {
    const [[{ name }]] = await db.query('SELECT DATABASE() AS name');
    console.log(`database: ${name}`);

    // ---------- 1) staff ----------
    // ใช้ collation เดียวกับตารางเดิม (ค่า default ของ server อาจต่างกัน แล้วเทียบข้อความข้ามตารางไม่ได้)
    const [[{ collation }]] = await db.query(
        `SELECT table_collation AS collation FROM information_schema.tables
         WHERE table_schema = DATABASE() AND table_name = 'orders'`);
    if (!(await hasTable('staff'))) {
        await run('create table staff', `
            CREATE TABLE staff (
              staff_id      INT AUTO_INCREMENT PRIMARY KEY,
              first_name    VARCHAR(50),
              last_name     VARCHAR(50),
              phone         VARCHAR(15),
              email         VARCHAR(100),
              hire_date     DATE,
              username      VARCHAR(50) NOT NULL UNIQUE,
              password_hash VARCHAR(255) NOT NULL,
              role          ENUM('admin', 'chef', 'waiter', 'cashier') NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=${collation}`);
    }
    if (await hasTable('sys_user')) {
        await run('copy employee + sys_user -> staff', `
            INSERT INTO staff (staff_id, first_name, last_name, phone, email, hire_date, username, password_hash, role)
            SELECT e.employee_id, e.first_name, e.last_name, e.phone, e.email, e.hire_date, u.username, u.password_hash, u.role
            FROM sys_user u JOIN employee e ON e.employee_id = u.employee_id
            WHERE NOT EXISTS (SELECT 1 FROM staff s WHERE s.staff_id = e.employee_id)`);
    }

    // ---------- 2) orders ----------
    for (const fk of ['fk_orders_session', 'fk_orders_customer', 'fk_orders_employee', 'fk_orders_paid_by']) {
        await dropForeignKey('orders', fk);
    }
    await dropColumn('orders', 'session_id');
    await dropColumn('orders', 'customer_id');
    if (await hasColumn('orders', 'employee_id')) {
        await run('rename orders.employee_id -> staff_id', 'ALTER TABLE orders CHANGE COLUMN employee_id staff_id INT NULL');
    }
    // พนักงานที่ไม่มีบัญชี login จะไม่ถูกย้ายไป staff -> ตัดการอ้างถึงก่อนสร้าง FK ใหม่
    await run('clear refs to missing staff', `
        UPDATE orders SET staff_id = NULL
        WHERE staff_id IS NOT NULL AND staff_id NOT IN (SELECT staff_id FROM staff)`);
    await run('clear paid_by refs to missing staff', `
        UPDATE orders SET paid_by = NULL
        WHERE paid_by IS NOT NULL AND paid_by NOT IN (SELECT staff_id FROM staff)`);
    if (!(await hasForeignKey('orders', 'fk_orders_staff'))) {
        await run('add FK orders.staff_id', `ALTER TABLE orders ADD CONSTRAINT fk_orders_staff
            FOREIGN KEY (staff_id) REFERENCES staff(staff_id) ON DELETE SET NULL ON UPDATE CASCADE`);
    }
    if (!(await hasForeignKey('orders', 'fk_orders_paid_by'))) {
        await run('add FK orders.paid_by', `ALTER TABLE orders ADD CONSTRAINT fk_orders_paid_by
            FOREIGN KEY (paid_by) REFERENCES staff(staff_id) ON DELETE SET NULL ON UPDATE CASCADE`);
    }

    // ---------- 3) ตัดระบบจองโต๊ะ ----------
    // trigger ของการจอง / ตัวเก่าที่เปลี่ยนโต๊ะเป็น occupied เอง (TiDB ไม่มี trigger: ข้ามไป)
    for (const trg of ['trg_reservation_au_table', 'trg_reservation_ad_table', 'trg_orders_ai_table']) {
        try {
            await run(`drop trigger ${trg} (if exists)`, `DROP TRIGGER IF EXISTS ${trg}`);
        } catch (err) {
            console.log(`skip  drop trigger ${trg} (${err.code || err.message})`);
        }
    }
    if (await hasTable('reservation')) {
        const [[{ n }]] = await db.query('SELECT COUNT(*) n FROM reservation');
        console.log(`note  reservation has ${n} row(s); they are removed with the table`);
    }
    await run('reserved tables -> available', "UPDATE dining_table SET status = 'available' WHERE status = 'reserved'");
    await run('dining_table.status without reserved', `ALTER TABLE dining_table
        MODIFY status ENUM('available', 'occupied', 'inactive') NOT NULL DEFAULT 'available'`);

    // ---------- 4) ลบตารางเก่า (ลูกก่อนแม่) ----------
    for (const t of ['reservation', 'table_session', 'sys_user', 'customer', 'employee']) {
        if (await hasTable(t)) await run(`drop table ${t}`, `DROP TABLE ${t}`);
    }

    const [tables] = await db.query(
        'SELECT table_name AS t FROM information_schema.tables WHERE table_schema = DATABASE() ORDER BY table_name');
    console.log(`\n${tables.length} tables: ${tables.map((r) => r.t || r.TABLE_NAME).join(', ')}`);
    await db.end();
}

main().catch(async (err) => {
    console.error(err);
    await db.end().catch(() => {});
    process.exit(1);
});
