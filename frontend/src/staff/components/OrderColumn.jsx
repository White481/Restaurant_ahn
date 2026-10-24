import { STATUS_DOT } from '../../components/status.js';
import { useLang } from '../../i18n/LanguageContext.jsx';
import OrderCard from './OrderCard.jsx';

// 1 คอลัมน์ของกระดาน (ออเดอร์ที่อยู่ในสถานะเดียวกัน) เก่าสุดอยู่บน เพราะคือใบที่ต้องรีบทำก่อน
export default function OrderColumn({ status, orders, now, freshIds, pendingIds, canPay, onAdvance, onCancel }) {
  const { t } = useLang();
  return (
    <section aria-labelledby={`col-${status}`} data-testid={`column-${status}`} className="flex flex-col gap-3">
      <h2
        id={`col-${status}`}
        className="flex items-center gap-2 border-b-2 border-stone-900 pb-2 text-[13px] font-bold uppercase tracking-[0.08em] dark:border-stone-300"
      >
        <span aria-hidden="true" className={`size-2.5 rounded-full ${STATUS_DOT[status]}`} />
        {t(`col.${status}`)}
        <span className="ml-auto font-display text-lg normal-case tracking-normal tabular-nums" data-testid="count">
          {orders.length}
        </span>
      </h2>

      {orders.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-400 px-3 py-10 text-center text-sm text-stone-500 dark:border-stone-700 dark:text-stone-500">
          {t('orders.columnEmpty')}
        </p>
      ) : (
        orders.map((order) => (
          <OrderCard
            key={order.order_id}
            order={order}
            now={now}
            fresh={freshIds.has(order.order_id)}
            busy={pendingIds.has(order.order_id)}
            canPay={canPay}
            onAdvance={onAdvance}
            onCancel={onCancel}
          />
        ))
      )}
    </section>
  );
}
