import Button from '../../ui/Button.jsx';
import EmptyState from '../../ui/EmptyState.jsx';
import Icon from '../../ui/Icon.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { formatBaht } from '../../components/status.js';
import { formatDateTime, localizedName } from '../../i18n/index.js';
import { useLang } from '../../i18n/LanguageContext.jsx';

const LIMIT = 100;

// ประวัติออเดอร์ที่จบแล้ว (เสร็จสิ้น / ยกเลิก) ใหม่สุดอยู่บน พิมพ์ใบเสร็จซ้ำได้จากออเดอร์ที่ชำระแล้ว
export default function HistoryList({ orders, onReceipt }) {
  const { lang, t } = useLang();
  if (orders.length === 0) return <EmptyState icon="receipt" title={t('history.empty')} />;

  const shown = [...orders].sort((a, b) => new Date(b.order_date) - new Date(a.order_date)).slice(0, LIMIT);

  return (
    <div>
      <ul className="overflow-hidden rounded-xl border border-stone-300 bg-stone-50 dark:border-stone-800 dark:bg-stone-900">
        {shown.map((order) => (
          <li
            key={order.order_id}
            className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 px-4 py-3 last:border-b-0 even:bg-stone-100 dark:border-stone-800 dark:even:bg-stone-900/60"
          >
            <div className="flex min-w-0 items-baseline gap-3">
              <span className="font-display text-lg font-bold tabular-nums">#{order.order_id}</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  {t('top.table', { n: order.table_id })}
                  <span className="font-normal text-stone-500 dark:text-stone-400">
                    {' '}
                    · {t(`orderType.${order.order_type}`)} · {formatDateTime(order.order_date, lang)}
                  </span>
                </p>
                <p className="truncate text-sm text-stone-500 dark:text-stone-400">
                  {order.items.map((i) => `${localizedName(i, lang)} ×${i.quantity}`).join(', ')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <strong className="font-display text-lg tabular-nums">{formatBaht(order.total_price)}</strong>
              <StatusBadge status={order.status} />
              {order.status === 'completed' && (
                <Button variant="secondary" size="sm" onClick={() => onReceipt(order)} aria-label={t('history.receiptAria', { id: order.order_id })}>
                  <Icon name="receipt" className="size-4" />
                  {t('history.receipt')}
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
