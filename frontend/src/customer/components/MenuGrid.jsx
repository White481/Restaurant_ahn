import { useLang } from '../../i18n/LanguageContext.jsx';
import { OTHER_CATEGORY } from './CategoryTabs.jsx';
import MenuCard from './MenuCard.jsx';

// groups: [{ category, items: [menu...] }]  แสดงแบบเมนูกระดาษ: หัวหมวดตัว serif + รายการคั่นเส้นประ (จอใหญ่ 2 คอลัมน์)
export default function MenuGrid({ groups, qtyOf, onAdd, onChange }) {
  const { t } = useLang();
  return (
    <div className="flex flex-col gap-10">
      {groups.map(({ category, items }, index) => {
        const label = category === OTHER_CATEGORY ? t('cat.other') : category;
        return (
          <section key={category} aria-label={label} className="rise-in" style={{ animationDelay: `${Math.min(index, 5) * 60}ms` }}>
            <header className="mb-1 flex items-baseline gap-3 border-b-2 border-stone-900 pb-2">
              <span className="font-display text-sm font-bold italic tabular-nums text-brand-600">{String(index + 1).padStart(2, '0')}</span>
              <h2 className="font-display text-[1.65rem] font-bold leading-none text-stone-950">{label}</h2>
              <span className="eyebrow ml-auto">{items.length}</span>
            </header>
            <ul className="grid md:grid-cols-2 md:gap-x-10">
              {items.map((menu) => (
                <MenuCard
                  key={menu.menu_item_id}
                  menu={menu}
                  quantity={qtyOf(menu.menu_item_id)}
                  onAdd={() => onAdd(menu)}
                  onChange={(qty) => onChange(menu.menu_item_id, qty)}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
