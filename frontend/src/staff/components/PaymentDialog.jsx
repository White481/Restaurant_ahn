import { useState } from 'react';
import Button from '../../ui/Button.jsx';
import Modal from '../../ui/Modal.jsx';
import { inputClass, labelClass } from '../../ui/fields.js';
import { SHOP } from '../../config/shop.js';
import { useLang } from '../../i18n/LanguageContext.jsx';
import { cashSuggestions, changeFor, money, toCents } from '../../utils/receipt.js';

const METHODS = ['cash', 'card', 'qr'];

// หน้าต่างรับชำระเงิน: เลือกวิธีจ่าย, เงินสดกรอกจำนวนที่รับ -> คำนวณเงินทอนให้
// (mount เฉพาะตอนมีออเดอร์ที่จะจ่าย: ใช้ key={order_id} เพื่อให้ state เริ่มใหม่ทุกออเดอร์)
export default function PaymentDialog({ order, onClose, onConfirm }) {
  const { t } = useLang();
  const total = Number(order.total_price);
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  const [method, setMethod] = useState(METHODS.includes(order.payment_method) ? order.payment_method : 'cash');
  const [received, setReceived] = useState(String(total));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isCash = method === 'cash';
  const change = isCash ? changeFor(received, total) : null;
  const canConfirm = !submitting && (!isCash || change !== null);

  async function confirm() {
    setError('');
    setSubmitting(true);
    try {
      await onConfirm(isCash ? { payment_method: 'cash', amount_received: Number(received) } : { payment_method: method });
    } catch (e) {
      setError(e.message);
      setSubmitting(false);
    }
    // สำเร็จ: ผู้เรียกจะปิดหน้าต่างนี้ (unmount) เอง
  }

  const chip = (selected) =>
    `min-h-10 flex-1 rounded-lg border px-2 text-sm tabular-nums transition ${
      selected
        ? 'border-brand-600 bg-brand-50 font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300'
        : 'border-stone-300 hover:border-stone-400 dark:border-stone-700'
    }`;

  return (
    <Modal
      open
      onClose={onClose}
      title={t('pay.title')}
      footer={
        <>
          <Button variant="secondary" size="lg" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button size="lg" className="flex-1" disabled={!canConfirm} onClick={confirm}>
            {submitting ? t('pay.saving') : t('pay.confirm')}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-stone-500 dark:text-stone-400">
          {t('pay.sub', { id: order.order_id, table: order.table_id, type: t(`orderType.${order.order_type}`) })}
        </p>

        <div className="rounded-xl border border-stone-300 bg-stone-100 px-4 py-4 text-center dark:border-stone-700 dark:bg-stone-950">
          <p className="eyebrow">{t('pay.due')}</p>
          <p className="font-display text-5xl font-extrabold leading-tight tabular-nums text-brand-600 dark:text-brand-400" data-testid="amount-due">
            ฿{money(total)}
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-400">{t('pay.dueSub', { n: itemCount, rate: Math.round(SHOP.vatRate * 100) })}</p>
        </div>

        <div role="group" aria-label={t('pay.method')} className="flex overflow-hidden rounded-lg border border-stone-300 dark:border-stone-700">
          {METHODS.map((m, index) => (
            <button
              key={m}
              type="button"
              aria-pressed={method === m}
              onClick={() => setMethod(m)}
              className={`min-h-11 flex-1 text-sm font-bold transition ${index > 0 ? 'border-l border-stone-300 dark:border-stone-700' : ''} ${
                method === m
                  ? 'bg-espresso text-stone-50 dark:bg-stone-100 dark:text-stone-950'
                  : 'bg-stone-50 text-stone-700 hover:bg-stone-200 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800'
              }`}
            >
              {t(`payment.${m}`)}
            </button>
          ))}
        </div>

        {isCash ? (
          <>
            <label className={labelClass}>
              {t('pay.received')}
              <input
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={received}
                onChange={(e) => setReceived(e.target.value)}
                className={`${inputClass} text-right font-display text-2xl! tabular-nums`}
              />
            </label>

            <div className="flex gap-2">
              {cashSuggestions(total).map((amount) => (
                <button
                  key={amount}
                  type="button"
                  aria-pressed={toCents(received) === toCents(amount)}
                  onClick={() => setReceived(String(amount))}
                  className={chip(toCents(received) === toCents(amount))}
                >
                  {amount === total ? t('pay.exact', { amount: `฿${money(amount)}` }) : `฿${money(amount)}`}
                </button>
              ))}
            </div>

            <div className="flex items-baseline justify-between border-t border-dashed border-stone-400 pt-3 dark:border-stone-600">
              <span className="eyebrow">{t('pay.change')}</span>
              {change === null ? (
                <span className="text-sm font-semibold text-chili-700 dark:text-chili-300">{t('pay.short')}</span>
              ) : (
                <strong className="font-display text-4xl tabular-nums text-sage-700 dark:text-sage-300" data-testid="change">
                  ฿{money(change)}
                </strong>
              )}
            </div>
          </>
        ) : (
          <p className="rounded-lg bg-tea-100 px-3 py-2.5 text-sm text-tea-700 dark:bg-tea-900 dark:text-tea-300">{t('pay.nonCash')}</p>
        )}

        {error && (
          <p role="alert" className="rounded-lg bg-chili-100 px-3 py-2 text-sm font-medium text-chili-700 dark:bg-chili-900 dark:text-chili-300">
            {error}
          </p>
        )}
        <p className="text-xs text-stone-500 dark:text-stone-400">{t('pay.note')}</p>
      </div>
    </Modal>
  );
}
