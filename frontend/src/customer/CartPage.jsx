import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { formatBaht } from '../components/status.js';
import Button, { buttonClasses } from '../ui/Button.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import { inputClass, labelClass } from '../ui/fields.js';
import { localizedName } from '../i18n/index.js';
import { useLang } from '../i18n/LanguageContext.jsx';
import { useCart } from './CartContext.jsx';
import TopBar from './components/TopBar.jsx';

// หน้ายืนยันการสั่งอาหาร (checkout)
export default function CartPage() {
  const navigate = useNavigate();
  const { lang, t } = useLang();
  const { items, tableId, setTableId, setQuantity, clear, totalPrice } = useCart();
  const [orderType, setOrderType] = useState('dine_in');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [note, setNote] = useState('');
  const [tableInput, setTableInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-stone-50 text-stone-900">
        <header className="border-b border-stone-200 bg-white">
          <div className="mx-auto max-w-xl">
            <TopBar tableId={tableId} />
          </div>
        </header>
        <div className="mx-auto max-w-xl px-4 py-10">
          <h1 className="mb-4 text-2xl font-bold">{t('checkout.title')}</h1>
          <EmptyState icon="🛒" title={t('checkout.empty')}>
            <Link className={buttonClasses('primary', 'md')} to="/">
              {t('checkout.backToMenu')}
            </Link>
          </EmptyState>
        </div>
      </div>
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

  const radioClass = (selected) =>
    `flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 font-semibold ${
      selected ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-stone-300 bg-white text-stone-700'
    }`;

  return (
    <div className="min-h-screen bg-stone-50 pb-10 text-stone-900">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-xl">
          <TopBar tableId={tableId} />
        </div>
      </header>
      <div className="mx-auto max-w-xl px-4 py-5">
        <header className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t('checkout.title')}</h1>
          <Link to="/" className="text-sm font-semibold text-brand-700 underline">
            {t('checkout.backLink')}
          </Link>
        </header>

        <ul className="mb-5 flex flex-col gap-2">
          {items.map((item) => {
            const name = localizedName(item, lang);
            return (
            <li key={item.menu_item_id} className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">{name}</p>
                <p className="text-sm text-stone-500">
                  {formatBaht(item.price)} × {item.quantity} = {formatBaht(item.price * item.quantity)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1 rounded-full bg-brand-50 p-1">
                <button
                  type="button"
                  aria-label={t('menu.remove', { name })}
                  onClick={() => setQuantity(item.menu_item_id, item.quantity - 1)}
                  className="grid size-9 place-items-center rounded-full bg-white text-xl leading-none text-brand-700"
                >
                  −
                </button>
                <span className="min-w-6 text-center font-bold text-brand-800">{item.quantity}</span>
                <button
                  type="button"
                  aria-label={t('menu.add', { name })}
                  onClick={() => setQuantity(item.menu_item_id, item.quantity + 1)}
                  className="grid size-9 place-items-center rounded-full bg-brand-600 text-xl leading-none text-white"
                >
                  +
                </button>
              </div>
            </li>
            );
          })}
        </ul>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-4">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium text-stone-600">{t('checkout.orderType')}</legend>
            <div className="flex gap-2">
              <label className={radioClass(orderType === 'dine_in')}>
                <input type="radio" name="orderType" value="dine_in" checked={orderType === 'dine_in'} onChange={() => setOrderType('dine_in')} className="sr-only" />
                🍽️ {t('orderType.dine_in')}
              </label>
              <label className={radioClass(orderType === 'take_away')}>
                <input type="radio" name="orderType" value="take_away" checked={orderType === 'take_away'} onChange={() => setOrderType('take_away')} className="sr-only" />
                🥡 {t('orderType.take_away')}
              </label>
            </div>
          </fieldset>

          {tableId ? (
            <p className="text-stone-600">
              {t('checkout.orderingFor')} <strong>{t('top.table', { n: tableId })}</strong>
            </p>
          ) : (
            <label className={labelClass}>
              {t('checkout.tableNo')}
              <input type="number" min="1" inputMode="numeric" value={tableInput} onChange={(e) => setTableInput(e.target.value)} placeholder={t('checkout.tablePh')} className={inputClass} />
            </label>
          )}

          <label className={labelClass}>
            {t('checkout.payMethod')}
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={inputClass}>
              <option value="">{t('checkout.payLater')}</option>
              <option value="cash">{t('payment.cash')}</option>
              <option value="card">{t('payment.card')}</option>
              <option value="qr">{t('payment.qr')}</option>
            </select>
          </label>

          <label className={labelClass}>
            {t('checkout.note')}
            <textarea rows="3" maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('checkout.notePh')} className={inputClass} />
          </label>

          <div className="flex items-center justify-between border-t border-dashed border-stone-300 pt-3 text-lg">
            <span>{t('common.totalAll')}</span>
            <strong className="text-brand-700">{formatBaht(totalPrice)}</strong>
          </div>

          {error && (
            <p role="alert" className="text-red-700">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" disabled={submitting} className="w-full">
            {submitting ? t('checkout.submitting') : t('checkout.submit')}
          </Button>
        </form>
      </div>
    </div>
  );
}
