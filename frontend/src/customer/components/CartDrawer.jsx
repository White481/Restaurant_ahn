import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../../ui/EmptyState.jsx';
import Icon from '../../ui/Icon.jsx';
import { buttonClasses } from '../../ui/Button.jsx';
import { formatBaht } from '../../components/status.js';
import { localizedName } from '../../i18n/index.js';
import { useLang } from '../../i18n/LanguageContext.jsx';
import { useCart } from '../CartContext.jsx';
import QtyStepper from './QtyStepper.jsx';

// ตะกร้าที่เลื่อนขึ้นจากด้านล่าง (มือถือ) หรือเลื่อนจากด้านขวา (แท็บเล็ต/จอใหญ่) ดู/แก้จำนวนได้โดยไม่ต้องเปลี่ยนหน้า
export default function CartDrawer({ open, onClose }) {
  const { items, setQuantity, totalPrice, totalQty } = useCart();
  const { lang, t } = useLang();
  const panelRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') closeRef.current();
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-espresso/55 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('cart.dialog')}
        tabIndex={-1}
        className="rise-in absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-2xl bg-stone-50 text-stone-950 shadow-xl outline-none md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[26rem] md:rounded-none"
      >
        <header className="flex items-center justify-between px-5 pb-3 pt-5">
          <div>
            <p className="eyebrow">{t('cart.dialog')}</p>
            <h2 className="font-display text-2xl font-bold">{t('cart.titleCount', { n: totalQty })}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('cart.close')}
            className="grid size-10 place-items-center rounded-full text-stone-500 hover:bg-stone-200 hover:text-stone-900"
          >
            <Icon name="x" className="size-5" />
          </button>
        </header>
        <div className="rule-diamond mx-5" />

        {items.length === 0 ? (
          <EmptyState icon="bag" title={t('cart.empty')} hint={t('cart.emptyHint')} />
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto px-5">
              {items.map((item) => {
                const name = localizedName(item, lang);
                return (
                  <li key={item.menu_item_id} className="flex items-center justify-between gap-3 border-b border-dashed border-stone-300 py-4">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{name}</p>
                      <p className="text-sm tabular-nums text-stone-500">
                        {formatBaht(item.price)} × {item.quantity}
                      </p>
                    </div>
                    <QtyStepper name={name} quantity={item.quantity} onChange={(qty) => setQuantity(item.menu_item_id, qty)} size="sm" />
                  </li>
                );
              })}
            </ul>

            <footer className="border-t border-stone-300 bg-stone-100 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              <div className="mb-4 flex items-baseline justify-between">
                <span className="eyebrow">{t('common.totalAll')}</span>
                <strong className="font-display text-3xl tabular-nums text-brand-600">{formatBaht(totalPrice)}</strong>
              </div>
              <Link to="/cart" className={`${buttonClasses('primary', 'lg')} w-full`}>
                {t('cart.checkout')}
                <Icon name="arrow" className="size-4" />
              </Link>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
