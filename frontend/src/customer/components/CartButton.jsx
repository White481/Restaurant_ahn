// ปุ่มตะกร้ากลมพร้อมตัวเลขจำนวนรายการ (กดเพื่อเปิด CartDrawer)
export default function CartButton({ count, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`เปิดตะกร้า (${count} รายการ)`}
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
