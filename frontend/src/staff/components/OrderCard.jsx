import Button from '../../ui/Button.jsx';
import {
  CANCELLABLE,
  LATE_MINUTES,
  NEXT_STEP,
  ORDER_TYPE_ICON,
  ORDER_TYPE_LABEL,
  PAYMENT_LABEL,
  TIMED_STATUSES,
  WARN_MINUTES,
  formatBaht
} from '../../components/status.js';

const BORDER = {
  ok: 'border-stone-200 dark:border-stone-700',
  none: 'border-stone-200 dark:border-stone-700',
  warn: 'border-amber-400 dark:border-amber-500',
  late: 'border-red-500'
};

const TIMER = {
  ok: 'text-stone-500 dark:text-stone-400',
  none: 'text-stone-500 dark:text-stone-400',
  warn: 'font-bold text-amber-700 dark:text-amber-300',
  late: 'font-bold text-red-600 dark:text-red-400'
};

// การ์ดออเดอร์ 1 ใบ: ตัวจับเวลาที่รอมา (เหลือง >10 นาที, แดง >20 นาที), รายการอาหาร, โน้ต, ปุ่มขั้นถัดไปปุ่มใหญ่ปุ่มเดียว
export default function OrderCard({ order, now, fresh, busy, onAdvance, onCancel }) {
  const orderedAt = new Date(order.order_date);
  const ageMinutes = Math.max(0, Math.floor((now - orderedAt.getTime()) / 60000));
  const urgency = TIMED_STATUSES.includes(order.status) ? (ageMinutes >= LATE_MINUTES ? 'late' : ageMinutes >= WARN_MINUTES ? 'warn' : 'ok') : 'none';
  const next = NEXT_STEP[order.status];

  return (
    <article
      data-testid={`order-${order.order_id}`}
      data-urgency={urgency}
      className={`rounded-xl border-2 bg-white p-4 shadow-sm dark:bg-stone-900 ${BORDER[urgency]} ${fresh ? 'flash-new' : ''}`}
    >
      <header className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold">
            #{order.order_id} · โต๊ะ {order.table_id}
          </h3>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {ORDER_TYPE_ICON[order.order_type]} {ORDER_TYPE_LABEL[order.order_type] || order.order_type}
            {order.payment_method ? ` · ${PAYMENT_LABEL[order.payment_method] || order.payment_method}` : ''}
          </p>
        </div>
        <div className="text-right text-sm">
          <p className="tabular-nums text-stone-500 dark:text-stone-400">{orderedAt.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</p>
          {urgency !== 'none' && (
            <p className={TIMER[urgency]} data-testid="timer">
              {ageMinutes < 1 ? 'เพิ่งสั่ง' : `รอมา ${ageMinutes} นาที`}
            </p>
          )}
        </div>
      </header>

      <ul className="my-3 flex flex-col gap-1">
        {order.items.map((item) => (
          <li key={item.order_item_id} className="flex gap-2">
            <span className="min-w-8 font-bold text-brand-700 dark:text-brand-300">{item.quantity}×</span>
            <span>{item.item_name}</span>
          </li>
        ))}
      </ul>

      {order.special_request && (
        <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-900/30 dark:text-amber-100">📝 {order.special_request}</p>
      )}

      <div className="mb-3 flex items-center justify-between border-t border-dashed border-stone-300 pt-2 dark:border-stone-700">
        <span className="text-stone-500 dark:text-stone-400">รวม</span>
        <strong className="text-lg">{formatBaht(order.total_price)}</strong>
      </div>

      <div className="flex gap-2">
        {next && (
          <Button size="lg" className="flex-1" disabled={busy} onClick={() => onAdvance(order, next.status)}>
            {next.label} →
          </Button>
        )}
        {CANCELLABLE.includes(order.status) && (
          <Button variant="danger" size="lg" disabled={busy} onClick={() => onCancel(order)} aria-label={`ยกเลิกออเดอร์ #${order.order_id}`}>
            ยกเลิก
          </Button>
        )}
      </div>
    </article>
  );
}
