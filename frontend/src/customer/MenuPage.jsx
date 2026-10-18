import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../services/api.js';
import { formatBaht } from '../components/status.js';
import Button from '../ui/Button.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import Skeleton from '../ui/Skeleton.jsx';
import { inputClass } from '../ui/fields.js';
import { useCart } from './CartContext.jsx';
import TopBar from './components/TopBar.jsx';
import CategoryTabs from './components/CategoryTabs.jsx';
import MenuGrid from './components/MenuGrid.jsx';
import CartDrawer from './components/CartDrawer.jsx';

const NO_CATEGORY = 'อื่นๆ';

export default function MenuPage() {
  const [params] = useSearchParams();
  const { items, tableId, setTableId, addItem, setQuantity, totalQty, totalPrice } = useCart();
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [cartOpen, setCartOpen] = useState(false);

  // QR code ที่โต๊ะ = ลิงก์ /?table=3  -> เก็บหมายเลขโต๊ะไว้ใช้ตอนสั่ง
  useEffect(() => {
    const t = Number.parseInt(params.get('table'), 10);
    if (Number.isInteger(t) && t > 0) setTableId(t);
  }, [params, setTableId]);

  useEffect(() => {
    let active = true; // กัน setState หลัง component ถูกปิดไปแล้ว
    setLoading(true);
    setError('');
    api
      .getMenus()
      .then((data) => active && setMenus(data))
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const categories = useMemo(() => [...new Set(menus.map((m) => m.category || NO_CATEGORY))], [menus]);

  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const byCategory = new Map();
    for (const menu of menus) {
      const cat = menu.category || NO_CATEGORY;
      if (category !== 'all' && cat !== category) continue;
      if (needle && !menu.item_name.toLowerCase().includes(needle)) continue;
      if (!byCategory.has(cat)) byCategory.set(cat, []);
      byCategory.get(cat).push(menu);
    }
    return [...byCategory].map(([cat, list]) => ({ category: cat, items: list }));
  }, [menus, query, category]);

  const qtyOf = (id) => items.find((i) => i.menu_item_id === id)?.quantity || 0;

  return (
    <div className="min-h-screen bg-stone-50 pb-28 text-stone-900">
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl">
          <TopBar tableId={tableId} cartCount={totalQty} onCartClick={() => setCartOpen(true)} />
          <div className="px-4 pb-3">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="🔍 ค้นหาเมนู"
              aria-label="ค้นหาเมนู"
              className={`${inputClass} w-full`}
            />
          </div>
          {categories.length > 0 && <CategoryTabs categories={categories} active={category} onChange={setCategory} />}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-5">
        {loading && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" aria-label="กำลังโหลดเมนู">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-52" />
            ))}
          </div>
        )}

        {!loading && error && (
          <EmptyState icon="⚠️" title="โหลดเมนูไม่สำเร็จ" hint={error}>
            <Button onClick={() => setReloadKey((k) => k + 1)}>ลองใหม่</Button>
          </EmptyState>
        )}

        {!loading && !error && menus.length === 0 && <EmptyState title="ยังไม่มีเมนู" hint="กรุณาติดต่อพนักงาน" />}

        {!loading && !error && menus.length > 0 && groups.length === 0 && (
          <EmptyState icon="🔍" title="ไม่พบเมนูที่ค้นหา" hint="ลองเปลี่ยนคำค้นหรือเลือกหมวดอื่น" />
        )}

        {!loading && !error && groups.length > 0 && <MenuGrid groups={groups} qtyOf={qtyOf} onAdd={addItem} onChange={setQuantity} />}

        <p className="mt-10 text-center text-sm">
          <Link to="/staff/login" className="text-stone-500 underline">
            สำหรับพนักงาน
          </Link>
        </p>
      </main>

      {totalQty > 0 && !cartOpen && (
        <div className="fixed inset-x-0 bottom-0 z-40 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="mx-auto flex min-h-14 w-full max-w-xl items-center justify-between rounded-2xl bg-brand-600 px-5 text-white shadow-lg hover:bg-brand-700"
          >
            <span className="font-semibold">ดูตะกร้า ({totalQty} รายการ)</span>
            <strong>{formatBaht(totalPrice)}</strong>
          </button>
        </div>
      )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
