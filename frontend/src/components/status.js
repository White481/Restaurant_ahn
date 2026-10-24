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

// ไอคอน (ชื่อใน ui/Icon.jsx) ของประเภทออเดอร์
export const ORDER_TYPE_ICON = { dine_in: 'table', take_away: 'takeaway' };

// สีประจำสถานะ (โทนดินจาก design tokens ใน styles.css) ใช้ชุดเดียวทั้งแอป แสดงคู่กับข้อความเสมอ ไม่ใช้สีอย่างเดียว
export const STATUS_TONE = {
  placed: 'bg-peach-100 text-peach-700 dark:bg-peach-900 dark:text-peach-300',
  preparing: 'bg-turmeric-100 text-turmeric-700 dark:bg-turmeric-900 dark:text-turmeric-300',
  ready: 'bg-sage-100 text-sage-700 dark:bg-sage-900 dark:text-sage-300',
  served: 'bg-tea-100 text-tea-700 dark:bg-tea-900 dark:text-tea-300',
  completed: 'bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-200',
  cancelled: 'bg-chili-100 text-chili-700 dark:bg-chili-900 dark:text-chili-300'
};

export const STATUS_DOT = {
  placed: 'bg-peach-500',
  preparing: 'bg-turmeric-500',
  ready: 'bg-sage-500',
  served: 'bg-tea-500',
  completed: 'bg-stone-500',
  cancelled: 'bg-chili-500'
};

export const formatBaht = (value) =>
  `฿${Number(value).toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
