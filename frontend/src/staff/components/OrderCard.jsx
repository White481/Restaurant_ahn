import Button from '../../ui/Button.jsx';
import Icon from '../../ui/Icon.jsx';
import {
  CANCELLABLE,
  LATE_MINUTES,
  NEXT_STEP,
  ORDER_TYPE_ICON,
  TIMED_STATUSES,
  WARN_MINUTES,
  formatBaht
} from '../../components/status.js';
import { formatTime, localizedName } from '../../i18n/index.js';
import { useLang } from '../../i18n/LanguageContext.jsx';

// แถบสีด้านซ้ายของใบ: บอกความเร่งด่วน (ปกติ / รอนาน / เลยเวลา)
const EDGE = {
  ok: 'before:bg-stone-300 dark:before:bg-stone-700',
  none: 'before:bg-stone-300 dark:before:bg-stone-700',
  warn: 'before:bg-turmeric-500',
  late: 'before:bg-chili-500'
};

const TIMER = {
  ok: 'text-stone-500 dark:text-stone-400',
  none: 'text-stone-500 dark:text-stone-400',
  warn: 'bg-turmeric-100 text-turmeric-700 dark:bg-turmeric-900 dark:text-turmeric-300',
  late: 'bg-chili-100 text-chili-700 dark:bg-chili-900 dark:text-chili-300'
};

// ใบออเดอร์ 1 ใบ (หน้าตาแบบใบสั่งในครัว): เลขออเดอร์ตัวใหญ่, ตัวจับเวลาที่รอมา (เหลือง >10 นาที, แดง >20 นาที),
// รายการอาหาร, โน้ต, ปุ่มขั้นถัดไปปุ่มใหญ่ปุ่มเดียว
// canPay: ผู้ใช้ role นี้รับชำระเงินได้ไหม (ถ้าไม่ได้ จะไม่แสดงปุ่ม "ชำระเงิน" ในคอลัมน์ "เสิร์ฟแล้ว")
export default function OrderCard({ order, now, fresh, busy, canPay, onAdvance, onCancel }) {
  const { lang, t } = useLang();
  const orderedAt = new Date(order.order_date);
  const ageMinutes = Math.max(0, Math.floor((now - orderedAt.getTime()) / 60000));
  const urgency = TIMED_STATUSES.includes(order.status) ? (ageMinutes >= LATE_MINUTES ? 'late' : ageMinutes >= WARN_MINUTES ? 'warn' : 'ok') : 'none';
  const nextStatus = NEXT_STEP[order.status];
  const showNext = nextStatus && (nextStatus !== 'completed' || canPay);

  return (
    <article
      data-testid={`order-${order.order_id}`}
      data-urgency={urgency}
      className={`relative overflow-hidden rounded-xl border border-stone-300 bg-stone-50 py-4 pl-5 pr-4 shadow-[0_1px_0_rgb(42_33_27/0.05)] before:absolute before:inset-y-0 before:left-0 before:w-1 dark:border-stone-800 dark:bg-stone-900 ${EDGE[urgency]} ${fresh ? 'flash-new' : ''} ${busy ? 'opacity-60' : ''}`}
    >
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold leading-none tabular-nums">#{order.order_id}</span>
            <span className="rounded border border-stone-900 px-1.5 text-xs font-bold dark:border-stone-300">
              {t('top.table', { n: order.table_id })}
            </span>
          </h3>
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
            <Icon name={ORDER_TYPE_ICON[order.order_type]} className="size-3.5" />
            {t(`orderType.${order.order_type}`)}
            {order.payment_method ? ` · ${t(`payment.${order.payment_method}`)}` : ''}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 text-right text-xs">
          <span className="tabular-nums text-stone-500 dark:text-stone-400">{formatTime(orderedAt, lang)}</span>
          {urgency !== 'none' && (
            <span className={`flex items-center gap-1 rounded px-1.5 py-0.5 font-bold ${TIMER[urgency]}`} data-testid="timer">
              <Icon name="clock" className="size-3" strokeWidth={2.25} />
              {ageMinutes < 1 ? t('orders.justNow') : t('orders.waiting', { n: ageMinutes })}
            </span>
          )}
        </div>
      </header>

      <ul className="my-3 flex flex-col gap-1.5 border-t border-dashed border-stone-300 pt-3 dark:border-stone-700">
        {order.items.map((item) => (
          <li key={item.order_item_id} className="flex items-baseline gap-2.5">
            <span className="min-w-7 font-display text-lg font-bold leading-none tabular-nums text-brand-600 dark:text-brand-400">
              {item.quantity}×
            </span>
            <span className="text-[15px] leading-snug">{localizedName(item, lang)}</span>
          </li>
        ))}
      </ul>

      {order.special_request && (
        <p className="mb-3 flex gap-2 rounded-lg bg-turmeric-100 px-3 py-2 text-sm text-turmeric-700 dark:bg-turmeric-900 dark:text-turmeric-300">
          <Icon name="note" className="mt-0.5 size-4" />
          <span>{order.special_request}</span>
        </p>
      )}

      <div className="mb-3 flex items-baseline justify-between border-t border-dashed border-stone-300 pt-2.5 dark:border-stone-700">
        <span className="eyebrow">{t('orders.total')}</span>
        <strong className="font-display text-xl tabular-nums">{formatBaht(order.total_price)}</strong>
      </div>

      <div className="flex gap-2">
        {showNext && (
          <Button
            size="lg"
            variant={nextStatus === 'completed' ? 'dark' : 'primary'}
            className="flex-1"
            disabled={busy}
            onClick={() => onAdvance(order, nextStatus)}
          >
            {t(`next.${order.status}`)}
            <Icon name="arrow" className="size-4" />
          </Button>
        )}
        {CANCELLABLE.includes(order.status) && (
          <Button variant="danger" size="lg" disabled={busy} onClick={() => onCancel(order)} aria-label={t('orders.cancelAria', { id: order.order_id })}>
            {t('orders.cancelBtn')}
          </Button>
        )}
      </div>
    </article>
  );
}
