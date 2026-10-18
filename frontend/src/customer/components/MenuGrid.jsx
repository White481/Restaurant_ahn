import MenuCard from './MenuCard.jsx';

// groups: [{ category, items: [menu...] }]  แสดงเป็นตาราง 2 คอลัมน์บนมือถือ ขยายเป็น 3-4 บนแท็บเล็ต/จอใหญ่
export default function MenuGrid({ groups, qtyOf, onAdd, onChange }) {
  return (
    <div className="flex flex-col gap-6">
      {groups.map(({ category, items }) => (
        <section key={category} aria-label={category}>
          <h2 className="mb-3 text-lg font-bold text-brand-800">{category}</h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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
      ))}
    </div>
  );
}
