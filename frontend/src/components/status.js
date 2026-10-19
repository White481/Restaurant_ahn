// ค่าคงที่เกี่ยวกับสถานะออเดอร์ (ต้องตรงกับ ENUM ใน orders.status ของ schema.sql)
// ข้อความที่แสดงอยู่ใน i18n/messages.js: status.* (ป้ายสถานะ) col.* (หัวคอลัมน์) next.* (ปุ่มขั้นถัดไป)

// ลำดับขั้นปกติของออเดอร์ (ใช้วาด stepper ฝั่งลูกค้า)
export const STATUS_FLOW = ['placed', 'preparing', 'ready', 'served', 'completed'];

// สถานะที่ยังไม่จบ (ต้องดำเนินการอยู่)
export const ACTIVE_STATUSES = ['placed', 'preparing', 'ready', 'served'];

// คอลัมน์บนกระดานของพนักงาน (completed / cancelled ไปอยู่แท็บ "ประวัติ")
export const BOARD_STATUSES = ['placed', 'preparing', 'ready', 'served'];

export const FINISHED_STATUSES = ['completed', 'cancelled'];

// สถานะถัดไปเมื่อกดปุ่มหลักบนการ์ด (served -> completed ต้องผ่านหน้ารับชำระเงิน)
export const NEXT_STEP = {
  placed: 'preparing',
  preparing: 'ready',
  ready: 'served',
  served: 'completed'
};

// สถานะที่ยังยกเลิกได้
export const CANCELLABLE = ['placed', 'preparing', 'ready'];

// สถานะที่ต้องจับตาว่ารอนานเกินไปหรือไม่
export const TIMED_STATUSES = ['placed', 'preparing', 'ready'];
export const WARN_MINUTES = 10;
export const LATE_MINUTES = 20;

// role ที่รับชำระเงินได้ (ต้องตรงกับ requireAuth ของ POST /api/orders/:id/pay ใน backend)
export const PAYMENT_ROLES = ['admin', 'cashier', 'waiter'];

export const ORDER_TYPE_ICON = { dine_in: '🍽️', take_away: '🥡' };

export const formatBaht = (value) =>
  `฿${Number(value).toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
