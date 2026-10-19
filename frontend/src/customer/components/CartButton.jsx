import { useLang } from '../../i18n/LanguageContext.jsx';

// ปุ่มตะกร้ากลมพร้อมตัวเลขจำนวนรายการ (กดเพื่อเปิด CartDrawer)
export default function CartButton({ count, onClick }) {
  const { t } = useLang();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t('cart.open', { n: count })}
      className="relative grid size-11 shrink-0 place-items-center rounded-full border border-stone-200 bg-white text-xl hover:bg-stone-50"
    >
      <span aria-hidden="true">🛒</span>
      {count > 0 && (
        <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-brand-600 px-1 text-xs font-bold text-white" data-testid="cart-count">
          {count}
        </span>
      )}
    </button>
  );
}
