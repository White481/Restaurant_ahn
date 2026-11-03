/**
 * Test cases ทั้งระบบ (ใช้ตอน demo): ยิง API จริงกับฐานข้อมูลจริง แล้วคืนข้อมูลเดิมให้ทั้งหมด
 *   - Access control: 4 role + ลูกค้า, ขั้นการเปลี่ยนสถานะ
 *   - เปิด/ปิดโต๊ะ: สั่งได้เฉพาะโต๊ะที่พนักงานเปิด (backend + trigger), ปิดไม่ได้ถ้ายังมีออเดอร์ค้าง
 *   - Triggers: ตัดสต็อก / คืนสต็อก / ปิดโต๊ะหลังชำระเงิน / ปฏิเสธเมื่อของไม่พอหรือโต๊ะยังไม่เปิด
 *   - CRUD เมนู, Stored procedure บน dashboard
 *
 * วิธีใช้ (ในโฟลเดอร์ backend, ต้องรัน schema + triggers + procedures + seed แล้ว):
 *   npm run test:e2e
 * รหัสผ่านอ่านจาก .env (SEED_<ROLE>_PASSWORD หรือ SEED_PASSWORD) ไม่ได้เขียนไว้ในโค้ด
 * ห้ามรันกับฐานข้อมูลที่ใช้งานจริง (สร้างออเดอร์ทดสอบชั่วคราว)
 */
require('dotenv').config();
const db = require('../src/config/db');
const app = require('../src/app');
const passwordFor = (role) => process.env[`SEED_${role.toUpperCase()}_PASSWORD`] || process.env.SEED_PASSWORD;

let pass = 0, fail = 0;
const check = (name, cond, extra = '') => { cond ? pass++ : fail++; console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  -> ' + extra : ''}`); };

(async () => {
  const [stockBefore] = await db.query('SELECT ingredient_id, quantity_in_stock FROM ingredient');
  const [tablesBefore] = await db.query('SELECT table_id, status FROM dining_table');
  const [[{ maxOrder }]] = await db.query('SELECT COALESCE(MAX(order_id),0) maxOrder FROM orders');
  const [[{ maxMenu }]] = await db.query('SELECT COALESCE(MAX(menu_item_id),0) maxMenu FROM menu_item');
  const server = app.listen(3101);
  const B = 'http://localhost:3101/api';
  const call = async (method, url, body, token) => {
    const r = await fetch(B + url, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined });
    let data = null; try { data = await r.json(); } catch {}
    return { status: r.status, data };
  };
  const stock = async (name) => (await db.query('SELECT quantity_in_stock q FROM ingredient WHERE ingredient_name=?', [name]))[0][0].q;
  const tableStatus = async (id) => (await db.query('SELECT status FROM dining_table WHERE table_id=?', [id]))[0][0].status;

  try {
    const tok = {};
    for (const u of ['admin', 'chef', 'waiter', 'cashier']) {
      const r = await call('POST', '/auth/login', { username: u, password: passwordFor(u) });
      tok[u] = r.data && r.data.token;
    }
    check('login 4 roles', Object.values(tok).every(Boolean));
    check('wrong password -> 401', (await call('POST', '/auth/login', { username: 'admin', password: 'nope' })).status === 401);
    check('no token -> 401', (await call('GET', '/orders')).status === 401);
    check('chef -> dashboard 403', (await call('GET', '/dashboard', null, tok.chef)).status === 403);
    check('waiter -> create menu 403', (await call('POST', '/menus', { item_name: 'x', price: 1 }, tok.waiter)).status === 403);

    // ---------- เปิด/ปิดโต๊ะ: ลูกค้าสั่งได้เฉพาะโต๊ะที่พนักงานเปิดแล้ว ----------
    await db.query("UPDATE dining_table SET status='available'");
    const closedOrder = await call('POST', '/orders', { table_id: 2, order_type: 'dine_in', payment_method: 'cash', items: [{ menu_item_id: 1, quantity: 1 }] });
    check('order on a closed table -> 409', closedOrder.status === 409, JSON.stringify(closedOrder.data));
    let sqlError = null;
    try { await db.query("INSERT INTO orders (table_id, order_type) VALUES (2, 'dine_in')"); } catch (e) { sqlError = e; }
    check('trigger: direct INSERT on closed table rejected (SIGNAL)', sqlError && sqlError.sqlState === '45000', sqlError && sqlError.sqlMessage);
    const pub = await call('GET', '/tables/2');
    check('customer reads table status (no login)', pub.status === 200 && pub.data.status === 'available' && pub.data.capacity === undefined);
    check('chef list tables -> 403', (await call('GET', '/tables', null, tok.chef)).status === 403);
    check('chef open table -> 403', (await call('PATCH', '/tables/2/status', { status: 'occupied' }, tok.chef)).status === 403);
    check('waiter opens table 2 -> 200', (await call('PATCH', '/tables/2/status', { status: 'occupied' }, tok.waiter)).status === 200);
    check('open an open table -> 409', (await call('PATCH', '/tables/2/status', { status: 'occupied' }, tok.waiter)).status === 409);
    check('waiter set inactive -> 403 (admin only)', (await call('PATCH', '/tables/5/status', { status: 'inactive' }, tok.waiter)).status === 403);
    check('admin set inactive -> 200', (await call('PATCH', '/tables/5/status', { status: 'inactive' }, tok.admin)).status === 200);
    check('bad table status -> 400', (await call('PATCH', '/tables/5/status', { status: 'reserved' }, tok.admin)).status === 400);
    for (const id of [1, 3, 4]) await call('PATCH', `/tables/${id}/status`, { status: 'occupied' }, tok.waiter);

    // ---------- trigger: ตัดสต็อก ----------
    const pork0 = await stock('หมูสับ'), egg0 = await stock('ไข่ไก่');
    const o1 = await call('POST', '/orders', { table_id: 2, order_type: 'dine_in', payment_method: 'cash', items: [{ menu_item_id: 1, quantity: 2 }] });
    check('customer creates order', o1.status === 201, JSON.stringify(o1.data));
    check('order without payment method -> 400', (await call('POST', '/orders', { table_id: 2, order_type: 'dine_in', items: [{ menu_item_id: 1, quantity: 1 }] })).status === 400);
    check('order with unknown payment method -> 400', (await call('POST', '/orders', { table_id: 2, order_type: 'dine_in', payment_method: 'later', items: [{ menu_item_id: 1, quantity: 1 }] })).status === 400);
    const id1 = o1.data.order_id;
    check('trigger: pork -200g', pork0 - (await stock('หมูสับ')) === 200, `${pork0} -> ${await stock('หมูสับ')}`);
    check('trigger: egg -2', egg0 - (await stock('ไข่ไก่')) === 2);
    const tables = await call('GET', '/tables', null, tok.waiter);
    check('waiter sees active orders per table', tables.status === 200 && tables.data.find((x) => x.table_id === 2).active_orders === 1);
    check('close table with unpaid order -> 409', (await call('PATCH', '/tables/2/status', { status: 'available' }, tok.waiter)).status === 409);

    // ---------- role transitions ----------
    check('waiter placed->preparing 403', (await call('PATCH', `/orders/${id1}`, { status: 'preparing' }, tok.waiter)).status === 403);
    check('chef placed->ready (skip) 409', (await call('PATCH', `/orders/${id1}`, { status: 'ready' }, tok.chef)).status === 409);
    check('chef placed->preparing 200', (await call('PATCH', `/orders/${id1}`, { status: 'preparing' }, tok.chef)).status === 200);
    check('chef preparing->ready 200', (await call('PATCH', `/orders/${id1}`, { status: 'ready' }, tok.chef)).status === 200);
    check('chef ready->served 403', (await call('PATCH', `/orders/${id1}`, { status: 'served' }, tok.chef)).status === 403);
    check('waiter ready->served 200', (await call('PATCH', `/orders/${id1}`, { status: 'served' }, tok.waiter)).status === 200);
    check('chef pay 403', (await call('POST', `/orders/${id1}/pay`, { payment_method: 'card' }, tok.chef)).status === 403);
    const pay = await call('POST', `/orders/${id1}/pay`, { payment_method: 'cash', amount_received: 200 }, tok.cashier);
    check('cashier pays cash 200 + change', pay.status === 200 && pay.data.change === 80, JSON.stringify(pay.data));
    const [[paidRow]] = await db.query(
      `SELECT s.username FROM orders o JOIN staff s ON s.staff_id = o.paid_by WHERE o.order_id = ?`, [id1]);
    check('paid_by records the cashier (receipt name)', paidRow && paidRow.username === 'cashier', JSON.stringify(paidRow));
    check('trigger: table 2 closed (available) after paid', (await tableStatus(2)) === 'available');
    check('completed order cannot change 409', (await call('PATCH', `/orders/${id1}`, { status: 'cancelled' }, tok.admin)).status === 409);

    // ---------- cancel -> คืนสต็อก ----------
    const prawn0 = await stock('กุ้งสด');
    const o2 = await call('POST', '/orders', { table_id: 3, order_type: 'dine_in', payment_method: 'cash', items: [{ menu_item_id: 2, quantity: 1 }] });
    check('trigger: prawn -150g', prawn0 - (await stock('กุ้งสด')) === 150);
    check('chef cancel 403', (await call('PATCH', `/orders/${o2.data.order_id}`, { status: 'cancelled' }, tok.chef)).status === 403);
    check('waiter cancel 200', (await call('PATCH', `/orders/${o2.data.order_id}`, { status: 'cancelled' }, tok.waiter)).status === 200);
    check('trigger: prawn restored after cancel', (await stock('กุ้งสด')) === prawn0);
    check('cancel keeps the table open', (await tableStatus(3)) === 'occupied');
    check('waiter closes table 3 (nothing unpaid) -> 200', (await call('PATCH', '/tables/3/status', { status: 'available' }, tok.waiter)).status === 200);

    // ---------- trigger SIGNAL: ของไม่พอ ----------
    const big = await call('POST', '/orders', { table_id: 4, order_type: 'take_away', payment_method: 'qr', items: [{ menu_item_id: 2, quantity: 99 }] });
    check('out of stock -> 409 from trigger', big.status === 409, JSON.stringify(big.data));
    check('out of stock: order rolled back', (await stock('กุ้งสด')) === prawn0);

    // ---------- menu CRUD ----------
    const c = await call('POST', '/menus', { item_name: 'ทดสอบ', item_name_en: 'Test', category: 'Main', price: 45 }, tok.admin);
    check('menu Create 201', c.status === 201);
    const mid = c.data.menu_item_id;
    check('menu Read public includes new', (await call('GET', '/menus')).data.some((m) => m.menu_item_id === mid));
    const u = await call('PUT', `/menus/${mid}`, { item_name: 'ทดสอบแก้ไข', price: 50, is_active: false }, tok.admin);
    check('menu Update (hide) 200', u.status === 200);
    check('hidden menu not public', !(await call('GET', '/menus')).data.some((m) => m.menu_item_id === mid));
    check('hidden menu in admin list', (await call('GET', '/menus/all', null, tok.admin)).data.some((m) => m.menu_item_id === mid && m.is_active === 0));
    check('order hidden menu -> 400', (await call('POST', '/orders', { table_id: 1, order_type: 'take_away', payment_method: 'qr', items: [{ menu_item_id: mid, quantity: 1 }] })).status === 400);
    const d = await call('DELETE', `/menus/${mid}`, null, tok.admin);
    check('menu Delete unused -> deleted', d.status === 200 && d.data.result === 'deleted');
    const d2 = await call('DELETE', '/menus/1', null, tok.admin);
    check('menu Delete ordered -> hidden', d2.status === 200 && d2.data.result === 'hidden');
    await db.query('UPDATE menu_item SET is_active = 1 WHERE menu_item_id = 1');
    check('bad price -> 400', (await call('POST', '/menus', { item_name: 'x', price: -5 }, tok.admin)).status === 400);
    check('non-numeric order id -> 400', (await call('GET', "/orders/1%20OR%201=1/status")).status === 400);

    // ---------- dashboard + stored procedure ----------
    const dash = await call('GET', '/dashboard', null, tok.admin);
    check('dashboard uses stored procedure', dash.status === 200 && dash.data.sales.source === 'procedure', JSON.stringify(dash.data.sales));
    check('SP revenue includes paid order', dash.data.sales.revenue >= 120);
    check('dashboard bad date 400', (await call('GET', '/dashboard?date=2026-13-99', null, tok.admin)).status === 400);
    check('dashboard past date ok', (await call('GET', '/dashboard?date=2020-01-01', null, tok.admin)).data.sales.revenue === 0);

  } catch (e) {
    fail++; console.log('ERROR', e);
  } finally {
    // คืนข้อมูลเดิม
    await db.query('DELETE FROM orders WHERE order_id > ?', [maxOrder]);
    await db.query('DELETE FROM menu_item WHERE menu_item_id > ?', [maxMenu]);
    for (const r of stockBefore) await db.query('UPDATE ingredient SET quantity_in_stock=? WHERE ingredient_id=?', [r.quantity_in_stock, r.ingredient_id]);
    for (const r of tablesBefore) await db.query('UPDATE dining_table SET status=? WHERE table_id=?', [r.status, r.table_id]);
    await db.query('UPDATE menu_item SET is_active = 1 WHERE menu_item_id = 1');
    server.close();
    console.log(`\n${pass} passed, ${fail} failed (test data cleaned up)`);
    await db.end();
    process.exitCode = fail > 0 ? 1 : 0;
  }
})();
