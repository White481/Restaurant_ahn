import { useLang } from '../../i18n/LanguageContext.jsx';
import OrderCard from './OrderCard.jsx';

const DOT = {
  placed: 'bg-amber-400',
  preparing: 'bg-orange-500',
  ready: 'bg-sky-500',
  served: 'bg-violet-500'
};

// 1 คอลัมน์ของกระดาน (ออเดอร์ที่อยู่ในสถานะเดียวกัน) เก่าสุดอยู่บน เพราะคือใบที่ต้องรีบทำก่อน
export default function OrderColumn({ status, orders, now, freshIds, pendingIds, canPay, onAdvance, onCancel }) {
  const { t } = useLang();
  return (
    <section
      aria-labelledby={`col-${status}`}
      data-testid={`column-${status}`}
      className="flex flex-col gap-3 rounded-2xl bg-stone-200/60 p-3 dark:bg-stone-900/60"
    >
      <h2 id={`col-${status}`} className="flex items-center gap-2 px-1 font-bold">
        <span aria-hidden="true" className={`size-3 rounded-full ${DOT[status]}`} />
        {t(`col.${status}`)}
        <span className="ml-auto rounded-full bg-white px-2.5 py-0.5 text-sm tabular-nums dark:bg-stone-800" data-testid="count">
          {orders.length}
        </span>
      </h2>

      {orders.length === 0 ? (
        <p className="rounded-xl border-2 border-dashed border-stone-300 px-3 py-8 text-center text-sm text-stone-400 dark:border-stone-700">{t('orders.columnEmpty')}</p>
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
