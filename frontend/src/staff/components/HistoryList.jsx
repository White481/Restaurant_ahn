import Button from '../../ui/Button.jsx';
import EmptyState from '../../ui/EmptyState.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { formatBaht } from '../../components/status.js';
import { formatDateTime, localizedName } from '../../i18n/index.js';
import { useLang } from '../../i18n/LanguageContext.jsx';

const LIMIT = 100;

// ประวัติออเดอร์ที่จบแล้ว (เสร็จสิ้น / ยกเลิก) ใหม่สุดอยู่บน พิมพ์ใบเสร็จซ้ำได้จากออเดอร์ที่ชำระแล้ว
export default function HistoryList({ orders, onReceipt }) {
  const { lang, t } = useLang();
  if (orders.length === 0) return <EmptyState icon="🗂️" title={t('history.empty')} />;

  const shown = [...orders].sort((a, b) => new Date(b.order_date) - new Date(a.order_date)).slice(0, LIMIT);

  return (
    <div>
      <ul className="flex flex-col gap-2">
        {shown.map((order) => (
          <li key={order.order_id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900">
            <div className="min-w-0">
              <p className="font-semibold">
                {t('orders.cardTitle', { id: order.order_id, table: order.table_id })}{' '}
                <span className="font-normal text-stone-500 dark:text-stone-400">
                  · {t(`orderType.${order.order_type}`)} · {formatDateTime(order.order_date, lang)}
                </span>
              </p>
              <p className="truncate text-sm text-stone-500 dark:text-stone-400">{order.items.map((i) => `${localizedName(i, lang)} ×${i.quantity}`).join(', ')}</p>
            </div>
            <div className="flex items-center gap-3">
              <strong>{formatBaht(order.total_price)}</strong>
              <StatusBadge status={order.status} />
              {order.status === 'completed' && (
                <Button variant="secondary" size="sm" onClick={() => onReceipt(order)} aria-label={t('history.receiptAria', { id: order.order_id })}>
                  🧾 {t('history.receipt')}
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {orders.length > LIMIT && <p className="mt-3 text-center text-sm text-stone-500">{t('history.more', { limit: LIMIT, total: orders.length })}</p>}
    </div>
  );
}
