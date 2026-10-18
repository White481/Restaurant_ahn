import { Link } from 'react-router-dom';

export default function TopBar({ tableId, cartCount, onCartClick }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <Link to="/" className="truncate text-lg font-bold text-brand-700">
          🍜 Restaurant OMS
        </Link>
        {tableId ? (
          <span className="shrink-0 rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-800">โต๊ะ {tableId}</span>
        ) : (
          <span className="shrink-0 rounded-full border border-red-300 px-3 py-1 text-sm font-semibold text-red-700">ยังไม่ระบุโต๊ะ</span>
        )}
      </div>
      <button
        type="button"
        onClick={onCartClick}
        aria-label={`เปิดตะกร้า (${cartCount} รายการ)`}
        className="relative grid size-11 shrink-0 place-items-center rounded-full border border-stone-200 bg-white text-xl hover:bg-stone-50"
      >
        <span aria-hidden="true">🛒</span>
        {cartCount > 0 && (
          <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-brand-600 px-1 text-xs font-bold text-white" data-testid="cart-count">
            {cartCount}
          </span>
        )}
      </button>
    </div>
  );
}
