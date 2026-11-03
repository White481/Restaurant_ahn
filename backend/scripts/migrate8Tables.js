/**
 * Migration 004: ลดฐานข้อมูลที่มีข้อมูลอยู่แล้วจาก 11 ตารางเหลือ 8 ตาราง (ข้อมูลเดิมไม่หาย)
 *   - employee + sys_user  -> staff        (staff_id = employee_id เดิม, ออเดอร์เก่ายังชี้คนเดิม)
 *   - customer             -> reservation.customer_name / reservation.phone
 *   - table_session        -> ลบ (ไม่มีโค้ดใช้)
 *   - orders: employee_id -> staff_id, ลบ session_id / customer_id
 *
 * ใช้สคริปต์แทนไฟล์ .sql เพราะต้องเช็กก่อนว่าตาราง/คอลัมน์/FK มีอยู่ไหม (TiDB ไม่มี stored procedure)
 * จึงรันซ้ำได้อย่างปลอดภัย และใช้ได้ทั้ง MySQL 8 และ TiDB Cloud
 * ฐานข้อมูลที่สร้างใหม่จาก schema.sql ล่าสุดไม่ต้องรันสคริปต์นี้
 *
 * วิธีใช้ (ในโฟลเดอร์ backend): npm run migrate:8tables
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
const hasIndex = (t, name) => exists(
    'SELECT COUNT(*) n FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?', [t, name]);

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

    // ---------- 3) reservation ----------
    if (!(await hasColumn('reservation', 'customer_name'))) {
        await run('add reservation.customer_name / phone', `ALTER TABLE reservation
            ADD COLUMN customer_name VARCHAR(100) NULL AFTER reservation_id,
            ADD COLUMN phone VARCHAR(15) NULL AFTER customer_name`);
    }
    if (await hasColumn('reservation', 'customer_id') && await hasTable('customer')) {
        await run('copy customer -> reservation', `
            UPDATE reservation r JOIN customer c ON c.customer_id = r.customer_id
            SET r.customer_name = LEFT(CONCAT_WS(' ', c.first_name, c.last_name), 100), r.phone = c.phone
            WHERE r.customer_name IS NULL`);
    }
    await run('fill empty name / phone', `
        UPDATE reservation SET customer_name = COALESCE(NULLIF(customer_name, ''), '-'), phone = COALESCE(NULLIF(phone, ''), '-')
        WHERE customer_name IS NULL OR customer_name = '' OR phone IS NULL OR phone = ''`);
    await run('reservation name / phone NOT NULL', `ALTER TABLE reservation
        MODIFY customer_name VARCHAR(100) NOT NULL, MODIFY phone VARCHAR(15) NOT NULL`);
    await dropForeignKey('reservation', 'fk_reservation_customer');
    await dropColumn('reservation', 'customer_id');
    if (!(await hasIndex('reservation', 'idx_reservation_phone'))) {
        await run('index reservation.phone', 'CREATE INDEX idx_reservation_phone ON reservation(phone)');
    }

    // ---------- 4) ลบตารางเก่า (ลูกก่อนแม่) ----------
    for (const t of ['table_session', 'sys_user', 'customer', 'employee']) {
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
