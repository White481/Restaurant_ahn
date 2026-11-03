// สิทธิ์ของแต่ละ role รวมไว้ที่เดียว (ใช้ทั้งใน routes และ controllers)
// ลูกค้า (ไม่ login): ดูเมนู, สั่งอาหาร, ดูสถานะออเดอร์ตัวเอง
// frontend มีสำเนาของตารางนี้ใน src/components/status.js ไว้ซ่อนปุ่มที่กดไม่ได้ (ความปลอดภัยจริงอยู่ที่ backend)

const ROLES = ['admin', 'chef', 'waiter', 'cashier'];

const PERMISSIONS = {
    viewOrders: ROLES,                          // ดูกระดานออเดอร์
    payOrder: ['admin', 'cashier', 'waiter'],   // รับชำระเงิน + ปิดออเดอร์
    manageMenu: ['admin'],                      // เพิ่ม / แก้ / ลบ / ซ่อนเมนู
    viewDashboard: ['admin'],                   // รายงานยอดขาย + สต็อก
    manageTables: ['admin', 'waiter']           // ดูโต๊ะ + เปิด/ปิดโต๊ะ
};

// การเปลี่ยนสถานะโต๊ะ: ลูกค้าสั่งอาหารได้เฉพาะโต๊ะที่ occupied (พนักงานเปิดโต๊ะให้แล้ว)
// ปิดโต๊ะ (occupied -> available) ทำได้เมื่อไม่มีออเดอร์ค้าง / ชำระเงินครบแล้ว trigger ปิดให้เอง
const TABLE_TRANSITIONS = {
    available: { occupied: PERMISSIONS.manageTables, inactive: ['admin'] },
    occupied: { available: PERMISSIONS.manageTables },
    inactive: { available: ['admin'] }
};

// การเปลี่ยนสถานะออเดอร์: { สถานะปัจจุบัน: { สถานะถัดไป: [role ที่ทำได้] } }
// เดินหน้าทีละขั้นเท่านั้น (ข้ามขั้น/ย้อนกลับไม่ได้) ส่วน served -> completed ต้องผ่าน POST /pay
const ORDER_TRANSITIONS = {
    placed: { preparing: ['admin', 'chef'], cancelled: ['admin', 'waiter'] },
    preparing: { ready: ['admin', 'chef'], cancelled: ['admin', 'waiter'] },
    ready: { served: ['admin', 'waiter'], cancelled: ['admin', 'waiter'] },
    served: {},
    completed: {},
    cancelled: {}
};

// คืน null ถ้าเปลี่ยนได้ หรือ { status, message } ถ้าเปลี่ยนไม่ได้
// table = ORDER_TRANSITIONS (ค่าเริ่มต้น) หรือ TABLE_TRANSITIONS
function checkTransition(role, from, to, table = ORDER_TRANSITIONS, label = 'order') {
    const allowedRoles = (table[from] || {})[to];
    if (!allowedRoles) {
        return { status: 409, message: `Cannot change ${label} status from ${from} to ${to}` };
    }
    if (!allowedRoles.includes(role)) {
        return { status: 403, message: `Role ${role} cannot change ${label} status from ${from} to ${to}` };
    }
    return null;
}

module.exports = { ROLES, PERMISSIONS, ORDER_TRANSITIONS, TABLE_TRANSITIONS, checkTransition };
