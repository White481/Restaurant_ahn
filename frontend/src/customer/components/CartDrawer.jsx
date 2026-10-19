import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../../ui/EmptyState.jsx';
import { buttonClasses } from '../../ui/Button.jsx';
import { formatBaht } from '../../components/status.js';
import { localizedName } from '../../i18n/index.js';
import { useLang } from '../../i18n/LanguageContext.jsx';
import { useCart } from '../CartContext.jsx';

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
      className="fixed inset-0 z-50 bg-black/50"
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
        className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-2xl bg-white shadow-xl outline-none md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-96 md:rounded-none"
      >
        <header className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
          <h2 className="text-lg font-bold">{t('cart.titleCount', { n: totalQty })}</h2>
          <button type="button" onClick={onClose} aria-label={t('cart.close')} className="grid size-10 place-items-center rounded-full text-xl text-stone-500 hover:bg-stone-100">
            ✕
          </button>
        </header>

        {items.length === 0 ? (
          <EmptyState icon="🛒" title={t('cart.empty')} hint={t('cart.emptyHint')} />
        ) : (
          <>
            <ul className="flex-1 divide-y divide-stone-100 overflow-y-auto px-4">
              {items.map((item) => {
                const name = localizedName(item, lang);
                return (
                <li key={item.menu_item_id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{name}</p>
                    <p className="text-sm text-stone-500">{formatBaht(item.price * item.quantity)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 rounded-full bg-brand-50 p-1">
                    <button
                      type="button"
                      aria-label={t('cart.dec', { name })}
                      onClick={() => setQuantity(item.menu_item_id, item.quantity - 1)}
                      className="grid size-9 place-items-center rounded-full bg-white text-xl leading-none text-brand-700"
                    >
                      −
                    </button>
                    <span className="min-w-6 text-center font-bold text-brand-800">{item.quantity}</span>
                    <button
                      type="button"
                      aria-label={t('cart.inc', { name })}
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

            <footer className="border-t border-stone-200 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="mb-3 flex items-center justify-between text-lg">
                <span>{t('common.totalAll')}</span>
                <strong className="text-brand-700">{formatBaht(totalPrice)}</strong>
              </div>
              <Link to="/cart" className={`${buttonClasses('primary', 'lg')} w-full`}>
                {t('cart.checkout')}
              </Link>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
