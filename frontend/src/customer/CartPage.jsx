import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { formatBaht } from '../components/status.js';
import Button, { buttonClasses } from '../ui/Button.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import Icon from '../ui/Icon.jsx';
import { inputClass, labelClass } from '../ui/fields.js';
import { localizedName } from '../i18n/index.js';
import { useLang } from '../i18n/LanguageContext.jsx';
import { useCart } from './CartContext.jsx';
import CustomerShell from './components/CustomerShell.jsx';
import QtyStepper from './components/QtyStepper.jsx';

const PAY_OPTIONS = ['', 'cash', 'card', 'qr']; // '' = จ่ายทีหลัง

// ปุ่มเลือกแบบ segmented (แทน radio/select) ตาม mockup
function Segmented({ legend, name, value, options, onChange }) {
  return (
    <fieldset>
      <legend className={`${labelClass} mb-1.5`}>{legend}</legend>
      <div className="flex overflow-hidden rounded-lg border border-stone-300">
        {options.map((option, index) => (
          <label
            key={option.value}
            className={`flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 px-2 text-center text-[13px] font-bold transition has-focus-visible:outline-2 has-focus-visible:-outline-offset-2 has-focus-visible:outline-brand-500 ${
              index > 0 ? 'border-l border-stone-300' : ''
            } ${value === option.value ? 'bg-brand-600 text-white' : 'bg-stone-200/60 text-stone-700 hover:bg-stone-200'}`}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.icon && <Icon name={option.icon} className="size-4" />}
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

// หน้ายืนยันการสั่งอาหาร (checkout)
export default function CartPage() {
  const navigate = useNavigate();
  const { lang, t } = useLang();
  const { items, tableId, setTableId, setQuantity, clear, totalPrice, totalQty } = useCart();
  const [orderType, setOrderType] = useState('dine_in');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [note, setNote] = useState('');
  const [tableInput, setTableInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (items.length === 0) {
    return (
      <CustomerShell tableId={tableId}>
        <h1 className="font-display text-3xl font-bold">{t('checkout.title')}</h1>
        <EmptyState icon="bag" title={t('checkout.empty')}>
          <Link className={buttonClasses('primary', 'md')} to="/">
            {t('checkout.backToMenu')}
          </Link>
        </EmptyState>
      </CustomerShell>
    );
  }

  const effectiveTable = tableId || Number.parseInt(tableInput, 10) || null;

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    if (!effectiveTable) {
      setError(t('checkout.needTable'));
      return;
    }

    const payload = {
      table_id: effectiveTable,
      order_type: orderType,
      items: items.map(({ menu_item_id, quantity }) => ({ menu_item_id, quantity }))
    };
    if (paymentMethod) payload.payment_method = paymentMethod;
    if (note.trim()) payload.special_request = note.trim();

    setSubmitting(true); // กันกดซ้ำจนได้ออเดอร์สองใบ
    try {
      const result = await api.createOrder(payload);
      if (!tableId) setTableId(effectiveTable);
      clear();
      navigate(`/order/${result.order_id}`, { replace: true });
    } catch (e) {
      setError(e.message);
      setSubmitting(false);
    }
  }

  return (
    <CustomerShell tableId={tableId}>
      <div className="mb-5 flex items-end justify-between gap-3">
        <h1 className="font-display text-3xl font-bold leading-none">{t('checkout.title')}</h1>
        <Link to="/" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-900">
          <Icon name="back" className="size-4" />
          {t('checkout.backLink')}
        </Link>
      </div>

      {/* รายการที่สั่ง: การ์ดหน้าตาแบบใบสั่งอาหาร ขอบล่างหยัก */}
      <section className="torn-bottom mb-6 bg-stone-50 px-4 pt-3 shadow-[0_1px_0_rgb(0_0_0/0.04)]">
        <p className="eyebrow border-b border-stone-300 pb-2">{t('cart.titleCount', { n: totalQty })}</p>
        <ul>
          {items.map((item) => {
            const name = localizedName(item, lang);
            return (
              <li key={item.menu_item_id} className="flex items-center justify-between gap-3 border-b border-dashed border-stone-300 py-3 last:border-b-0">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{name}</p>
                  <p className="text-sm tabular-nums text-stone-500">
                    {formatBaht(item.price)} × {item.quantity} = <span className="text-stone-800">{formatBaht(item.price * item.quantity)}</span>
                  </p>
                </div>
                <QtyStepper name={name} quantity={item.quantity} onChange={(qty) => setQuantity(item.menu_item_id, qty)} size="sm" />
              </li>
            );
          })}
        </ul>
      </section>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Segmented
          legend={t('checkout.orderType')}
          name="orderType"
          value={orderType}
          onChange={setOrderType}
          options={[
            { value: 'dine_in', label: t('orderType.dine_in'), icon: 'table' },
            { value: 'take_away', label: t('orderType.take_away'), icon: 'takeaway' }
          ]}
        />

        {tableId ? (
          <p className="flex items-center justify-between rounded-lg border border-stone-300 bg-stone-50 px-3 py-2.5 text-sm">
            <span className="text-stone-600">{t('checkout.orderingFor')}</span>
            <strong className="font-display text-lg">{t('top.table', { n: tableId })}</strong>
          </p>
        ) : (
          <label className={labelClass}>
            {t('checkout.tableNo')}
            <input
              type="number"
              min="1"
              inputMode="numeric"
              value={tableInput}
              onChange={(e) => setTableInput(e.target.value)}
              placeholder={t('checkout.tablePh')}
              className={inputClass}
            />
          </label>
        )}

        <Segmented
          legend={t('checkout.payMethod')}
          name="payment"
          value={paymentMethod}
          onChange={setPaymentMethod}
          options={PAY_OPTIONS.map((value) => ({ value, label: value ? t(`payment.${value}`) : t('checkout.payLater') }))}
        />

        <label className={labelClass}>
          {t('checkout.note')}
          <textarea
            rows="3"
            maxLength={1000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('checkout.notePh')}
            className={inputClass}
          />
        </label>

        <div className="rounded-xl border border-stone-300 bg-stone-50 px-4 py-4 text-center">
          <p className="eyebrow">{t('common.totalAll')}</p>
          <p className="font-display text-4xl font-extrabold tabular-nums text-brand-600">{formatBaht(totalPrice)}</p>
        </div>

        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-lg bg-chili-100 px-3 py-2.5 text-sm font-medium text-chili-700">
            <Icon name="alert" className="mt-0.5 size-4" />
            {error}
          </p>
        )}

        <Button type="submit" size="lg" disabled={submitting} className="w-full uppercase tracking-[0.06em]">
          {submitting ? t('checkout.submitting') : t('checkout.submit')}
        </Button>
      </form>
    </CustomerShell>
  );
}
