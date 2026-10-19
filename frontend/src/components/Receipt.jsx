import { SHOP } from '../config/shop.js';
import { formatDateTime, localizedName, translate } from '../i18n/index.js';
import { money, vatBreakdown } from '../utils/receipt.js';

// ใบเสร็จกระดาษ 80 มม. (ขาวดำ ใช้พิมพ์ได้ทั้งบนจอและเครื่องพิมพ์ความร้อน)
// lang = ภาษาของใบเสร็จ (พนักงานเลือกเอง ไม่ผูกกับภาษาของหน้าเว็บ)
// order ต้องมี: order_id, table_id, order_type, items[], total_price, payment_method และถ้ามี: amount_received, cashier_name, paid_at
export default function Receipt({ order, lang }) {
  const t = (key, params) => translate(lang, key, params);
  const { net, vat } = vatBreakdown(order.total_price, SHOP.vatRate);
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const cash = order.payment_method === 'cash' && order.amount_received != null;
  const change = cash ? Math.round(order.amount_received * 100 - order.total_price * 100) / 100 : null;
  const rate = Math.round(SHOP.vatRate * 100);
  const sub = t('rc.sub');

  const row = 'flex justify-between';
  const rule = <div className="border-t border-dashed border-stone-400" />;

  return (
    <div
      lang={lang}
      data-testid="receipt"
      className="receipt-paper flex w-full max-w-[320px] flex-col gap-3.5 bg-[#fffefb] p-6 text-[13px] leading-normal text-stone-900 shadow-md"
    >
      <header className="text-center">
        <div className="text-xl font-bold tracking-wide">{SHOP.name}</div>
        <div className="mt-1 text-[11px] text-stone-500">
          {SHOP.address[lang]} · {t('rc.tel')} {SHOP.phone}
          <br />
          {t('rc.taxId')} {SHOP.taxId}
        </div>
      </header>

      {rule}

      <div className="text-center">
        <div className="text-base font-bold">{t('rc.title')}</div>
        {sub && <div className="text-[10px] tracking-[0.3em] text-stone-500">{sub}</div>}
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs">
        <dt className="text-stone-600">{t('rc.orderNo')}</dt>
        <dd className="text-right font-medium">#{order.order_id}</dd>
        <dt className="text-stone-600">{t('rc.table')}</dt>
        <dd className="text-right font-medium">{order.table_id}</dd>
        <dt className="text-stone-600">{t('rc.type')}</dt>
        <dd className="text-right font-medium">{translate(lang, `orderType.${order.order_type}`)}</dd>
        <dt className="text-stone-600">{t('rc.dateTime')}</dt>
        <dd className="text-right font-medium">{formatDateTime(order.paid_at || order.order_date, lang)}</dd>
        {order.cashier_name && (
          <>
            <dt className="text-stone-600">{t('rc.cashier')}</dt>
            <dd className="text-right font-medium">{order.cashier_name}</dd>
          </>
        )}
      </dl>

      {rule}

      <div className="grid grid-cols-[1fr_34px_66px] gap-x-1.5 gap-y-2.5 tabular-nums">
        <span className="text-[11px] text-stone-600">{t('rc.item')}</span>
        <span className="text-center text-[11px] text-stone-600">{t('rc.qty')}</span>
        <span className="text-right text-[11px] text-stone-600">{t('rc.baht')}</span>
        {order.items.map((item) => (
          <div key={item.order_item_id} className="contents">
            <div>
              {localizedName(item, lang)}
              <div className="text-[11px] text-stone-500">@{money(item.subtotal / item.quantity)}</div>
            </div>
            <span className="text-center">{item.quantity}</span>
            <span className="text-right">{money(item.subtotal)}</span>
          </div>
        ))}
      </div>

      {rule}

      <div className="flex flex-col gap-0.5 text-xs tabular-nums">
        <div className={row}>
          <span>{t('rc.subtotal', { n: itemCount })}</span>
          <span>{money(order.total_price)}</span>
        </div>
        <div className={`${row} text-stone-600`}>
          <span>{t('rc.beforeVat')}</span>
          <span>{money(net)}</span>
        </div>
        <div className={`${row} text-stone-600`}>
          <span>{t('rc.vat', { rate })}</span>
          <span>{money(vat)}</span>
        </div>
      </div>

      <div className="flex items-baseline justify-between border-t-2 border-stone-900 pt-2 tabular-nums">
        <span className="text-base font-bold">{t('rc.net')}</span>
        <span className="text-[22px] font-bold">฿{money(order.total_price)}</span>
      </div>
      <div className="-mt-2 text-[10px] text-stone-500">{t('rc.vatIncluded')}</div>

      <div className="flex flex-col gap-0.5 text-xs tabular-nums">
        <div className={row}>
          <span className="text-stone-600">{t('rc.paidBy')}</span>
          <span>{order.payment_method ? translate(lang, `payment.${order.payment_method}`) : '—'}</span>
        </div>
        {cash && (
          <>
            <div className={row}>
              <span className="text-stone-600">{t('rc.received')}</span>
              <span>{money(order.amount_received)}</span>
            </div>
            <div className={`${row} font-bold`}>
              <span>{t('rc.change')}</span>
              <span>{money(change)}</span>
            </div>
          </>
        )}
      </div>

      {rule}

      <footer className="text-center">
        <div className="text-sm font-bold">{t('rc.thanks')}</div>
        <div className="mt-0.5 text-[10px] text-stone-500">{t('rc.issued', { id: order.order_id })}</div>
      </footer>
    </div>
  );
}
