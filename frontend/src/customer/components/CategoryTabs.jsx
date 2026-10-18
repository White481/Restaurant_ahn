// แท็บหมวดอาหาร เลื่อนแนวนอนได้บนมือถือ (กดเลือกหมวดเพื่อกรองเมนู)
export default function CategoryTabs({ categories, active, onChange }) {
  const tabs = [{ value: 'all', label: 'ทั้งหมด' }, ...categories.map((c) => ({ value: c, label: c }))];
  return (
    <div role="tablist" aria-label="หมวดอาหาร" className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3">
      {tabs.map((tab) => {
        const selected = tab.value === active;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.value)}
            className={`min-h-10 shrink-0 rounded-full px-4 text-sm font-semibold transition ${
              selected ? 'bg-brand-600 text-white' : 'border border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
