// ค่าคงที่เกี่ยวกับสถานะออเดอร์ (ต้องตรงกับ ENUM ใน orders.status ของ schema.sql)
export const STATUS_LABEL = {
  placed: 'รับออเดอร์แล้ว',
  preparing: 'กำลังเตรียม',
  ready: 'พร้อมเสิร์ฟ',
  served: 'เสิร์ฟแล้ว',
  completed: 'เสร็จสิ้น',
  cancelled: 'ยกเลิก'
};

// ลำดับขั้นปกติของออเดอร์ (ใช้วาด stepper ฝั่งลูกค้า)
export const STATUS_FLOW = ['placed', 'preparing', 'ready', 'served', 'completed'];

// สถานะที่ยังไม่จบ (ต้องดำเนินการอยู่)
export const ACTIVE_STATUSES = ['placed', 'preparing', 'ready', 'served'];

// คอลัมน์บนกระดานของพนักงาน (completed / cancelled ไปอยู่แท็บ "ประวัติ")
export const BOARD_COLUMNS = [
  { status: 'placed', title: 'ใหม่' },
  { status: 'preparing', title: 'กำลังทำ' },
  { status: 'ready', title: 'พร้อมเสิร์ฟ' },
  { status: 'served', title: 'เสิร์ฟแล้ว (รอชำระ)' }
];

export const FINISHED_STATUSES = ['completed', 'cancelled'];

// ปุ่ม "ขั้นถัดไป" ฝั่งพนักงาน
export const NEXT_STEP = {
  placed: { status: 'preparing', label: 'เริ่มทำ' },
  preparing: { status: 'ready', label: 'พร้อมเสิร์ฟ' },
  ready: { status: 'served', label: 'เสิร์ฟแล้ว' },
  served: { status: 'completed', label: 'ชำระแล้ว / ปิดออเดอร์' }
};

// สถานะที่ยังยกเลิกได้
export const CANCELLABLE = ['placed', 'preparing', 'ready'];

// สถานะที่ต้องจับตาว่ารอนานเกินไปหรือไม่
export const TIMED_STATUSES = ['placed', 'preparing', 'ready'];
export const WARN_MINUTES = 10;
export const LATE_MINUTES = 20;

export const ORDER_TYPE_LABEL = { dine_in: 'ทานที่ร้าน', take_away: 'กลับบ้าน' };
export const ORDER_TYPE_ICON = { dine_in: '🍽️', take_away: '🥡' };
export const PAYMENT_LABEL = { cash: 'เงินสด', card: 'บัตร', qr: 'QR', other: 'อื่นๆ' };

export const formatBaht = (value) =>
  `฿${Number(value).toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
