import EmptyState from '../../ui/EmptyState.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { ORDER_TYPE_LABEL, formatBaht } from '../../components/status.js';

const LIMIT = 100;

// ประวัติออเดอร์ที่จบแล้ว (เสร็จสิ้น / ยกเลิก) ใหม่สุดอยู่บน
export default function HistoryList({ orders }) {
  if (orders.length === 0) return <EmptyState icon="🗂️" title="ยังไม่มีประวัติออเดอร์" />;

  const shown = [...orders].sort((a, b) => new Date(b.order_date) - new Date(a.order_date)).slice(0, LIMIT);

  return (
    <div>
      <ul className="flex flex-col gap-2">
        {shown.map((order) => (
          <li key={order.order_id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900">
            <div className="min-w-0">
              <p className="font-semibold">
                #{order.order_id} · โต๊ะ {order.table_id}{' '}
                <span className="font-normal text-stone-500 dark:text-stone-400">
                  · {ORDER_TYPE_LABEL[order.order_type] || order.order_type} ·{' '}
                  {new Date(order.order_date).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </p>
              <p className="truncate text-sm text-stone-500 dark:text-stone-400">{order.items.map((i) => `${i.item_name} ×${i.quantity}`).join(', ')}</p>
            </div>
            <div className="flex items-center gap-3">
              <strong>{formatBaht(order.total_price)}</strong>
              <StatusBadge status={order.status} />
            </div>
          </li>
        ))}
      </ul>
      {orders.length > LIMIT && <p className="mt-3 text-center text-sm text-stone-500">แสดง {LIMIT} รายการล่าสุดจากทั้งหมด {orders.length}</p>}
    </div>
  );
}
