import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api.js';
import { formatBaht } from '../components/status.js';
import Button from '../ui/Button.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import Icon from '../ui/Icon.jsx';
import Skeleton from '../ui/Skeleton.jsx';
import { inputClass } from '../ui/fields.js';
import { useLang } from '../i18n/LanguageContext.jsx';
import { useCart } from './CartContext.jsx';
import TopBar from './components/TopBar.jsx';
import CategoryTabs, { OTHER_CATEGORY } from './components/CategoryTabs.jsx';
import MenuGrid from './components/MenuGrid.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import CartButton from './components/CartButton.jsx';

export default function MenuPage() {
  const [params] = useSearchParams();
  const { t } = useLang();
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

  const categories = useMemo(() => [...new Set(menus.map((m) => m.category || OTHER_CATEGORY))], [menus]);

  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const byCategory = new Map();
    for (const menu of menus) {
      const cat = menu.category || OTHER_CATEGORY;
      if (category !== 'all' && cat !== category) continue;
      if (needle && !`${menu.item_name} ${menu.item_name_en || ''}`.toLowerCase().includes(needle)) continue;
      if (!byCategory.has(cat)) byCategory.set(cat, []);
      byCategory.get(cat).push(menu);
    }
    return [...byCategory].map(([cat, list]) => ({ category: cat, items: list }));
  }, [menus, query, category]);

  const qtyOf = (id) => items.find((i) => i.menu_item_id === id)?.quantity || 0;

  return (
    <div className="min-h-screen bg-paper pb-32 text-stone-950">
      <header className="sticky top-0 z-30 bg-paper/95 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl">
          <TopBar tableId={tableId} />
          <div className="flex items-center gap-2 px-4 pb-3">
            <div className="relative min-w-0 flex-1">
              <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('menu.searchPlaceholder')}
                aria-label={t('menu.search')}
                className={`${inputClass} w-full pl-9`}
              />
            </div>
            <CartButton count={totalQty} onClick={() => setCartOpen(true)} />
          </div>
          {categories.length > 0 && <CategoryTabs categories={categories} active={category} onChange={setCategory} />}
        </div>
        <div className="mx-auto max-w-5xl px-4">
          <div className="rule-diamond" />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {loading && (
          <div className="grid gap-x-10 gap-y-4 md:grid-cols-2" aria-label={t('menu.loadingAria')}>
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="flex gap-4 py-2">
                <Skeleton className="size-24 shrink-0" />
                <div className="flex flex-1 flex-col gap-2 pt-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <EmptyState icon="alert" title={t('menu.loadFail')} hint={error}>
            <Button onClick={() => setReloadKey((k) => k + 1)}>{t('common.retry')}</Button>
          </EmptyState>
        )}

        {!loading && !error && menus.length === 0 && <EmptyState icon="list" title={t('menu.none')} hint={t('menu.noneHint')} />}

        {!loading && !error && menus.length > 0 && groups.length === 0 && (
          <EmptyState icon="search" title={t('menu.noResults')} hint={t('menu.noResultsHint')} />
        )}

        {!loading && !error && groups.length > 0 && <MenuGrid groups={groups} qtyOf={qtyOf} onAdd={addItem} onChange={setQuantity} />}
      </main>

      {totalQty > 0 && !cartOpen && (
        <div className="fixed inset-x-0 bottom-0 z-40 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="rise-in mx-auto flex min-h-14 w-full max-w-xl items-center justify-between gap-3 rounded-xl bg-espresso px-5 text-stone-50 shadow-[0_16px_40px_-16px_rgb(42_33_27/0.7)] transition hover:bg-stone-900"
          >
            <span className="flex items-center gap-3 font-semibold">
              <span className="grid size-7 place-items-center rounded-full bg-brand-600 text-xs font-bold tabular-nums">{totalQty}</span>
              {t('cart.viewBar', { n: totalQty })}
            </span>
            <strong className="font-display text-xl tabular-nums text-brand-300">{formatBaht(totalPrice)}</strong>
          </button>
        </div>
      )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
