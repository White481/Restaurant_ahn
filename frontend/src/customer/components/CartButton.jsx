import Icon from '../../ui/Icon.jsx';
import { useLang } from '../../i18n/LanguageContext.jsx';

// ปุ่มตะกร้าพร้อมตัวเลขจำนวนรายการ (กดเพื่อเปิด CartDrawer)
export default function CartButton({ count, onClick }) {
  const { t } = useLang();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t('cart.open', { n: count })}
      className="relative grid size-11 shrink-0 place-items-center rounded-lg border border-stone-300 bg-stone-50 text-stone-800 transition hover:border-stone-400 hover:bg-white"
    >
      <Icon name="bag" />
      {count > 0 && (
        <span
          className="absolute -right-1.5 -top-1.5 grid min-w-5 place-items-center rounded-full bg-brand-600 px-1 text-[11px] font-bold leading-5 text-white ring-2 ring-paper"
          data-testid="cart-count"
        >
          {count}
        </span>
      )}
    </button>
  );
}
