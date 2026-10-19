import { useState } from 'react';
import Button from '../../ui/Button.jsx';
import Modal from '../../ui/Modal.jsx';
import { inputClass } from '../../ui/fields.js';
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
    `min-h-11 flex-1 rounded-xl border px-2 text-sm ${
      selected ? 'border-2 border-brand-600 bg-brand-50 font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-200' : 'border-stone-300 dark:border-stone-600'
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
        <p className="text-sm">{t('pay.sub', { id: order.order_id, table: order.table_id, type: t(`orderType.${order.order_type}`) })}</p>

        <div className="rounded-xl bg-brand-50 px-4 py-3 dark:bg-brand-900/30">
          <p className="text-sm">{t('pay.due')}</p>
          <p className="text-4xl font-bold leading-tight text-brand-700 tabular-nums dark:text-brand-200" data-testid="amount-due">
            ฿{money(total)}
          </p>
          <p className="text-xs">{t('pay.dueSub', { n: itemCount, rate: Math.round(SHOP.vatRate * 100) })}</p>
        </div>

        <div role="group" aria-label={t('pay.method')} className="flex gap-2">
          {METHODS.map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={method === m}
              onClick={() => setMethod(m)}
              className={`min-h-11 flex-1 rounded-xl border-2 text-[15px] ${
                method === m
                  ? 'border-brand-700 bg-brand-700 font-bold text-white'
                  : 'border-stone-300 font-medium text-stone-800 dark:border-stone-600 dark:text-stone-100'
              }`}
            >
              {t(`payment.${m}`)}
            </button>
          ))}
        </div>

        {isCash ? (
          <>
            <label className="flex flex-col gap-1.5 text-sm">
              {t('pay.received')}
              <input
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={received}
                onChange={(e) => setReceived(e.target.value)}
                className={`${inputClass} text-right text-xl`}
              />
            </label>

            <div className="flex gap-2">
              {cashSuggestions(total).map((amount) => (
                <button key={amount} type="button" aria-pressed={toCents(received) === toCents(amount)} onClick={() => setReceived(String(amount))} className={chip(toCents(received) === toCents(amount))}>
                  {amount === total ? t('pay.exact', { amount: `฿${money(amount)}` }) : `฿${money(amount)}`}
                </button>
              ))}
            </div>

            <div className="flex items-baseline justify-between border-t border-dashed border-stone-400 pt-3">
              <span>{t('pay.change')}</span>
              {change === null ? (
                <span className="text-sm font-semibold text-red-700 dark:text-red-300">{t('pay.short')}</span>
              ) : (
                <strong className="text-3xl tabular-nums" data-testid="change">
                  ฿{money(change)}
                </strong>
              )}
            </div>
          </>
        ) : (
          <p className="text-sm">{t('pay.nonCash')}</p>
        )}

        {error && (
          <p role="alert" className="text-sm text-red-700 dark:text-red-300">
            {error}
          </p>
        )}
        <p className="text-xs">{t('pay.note')}</p>
      </div>
    </Modal>
  );
}
