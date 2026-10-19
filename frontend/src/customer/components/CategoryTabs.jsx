import { useLang } from '../../i18n/LanguageContext.jsx';

export const OTHER_CATEGORY = '__other__'; // เมนูที่ไม่มีหมวด (เก็บเป็นค่าภายใน แสดงผลตามภาษา)

// แท็บหมวดอาหาร เลื่อนแนวนอนได้บนมือถือ (กดเลือกหมวดเพื่อกรองเมนู)
export default function CategoryTabs({ categories, active, onChange }) {
  const { t } = useLang();
  const tabs = [
    { value: 'all', label: t('cat.all') },
    ...categories.map((c) => ({ value: c, label: c === OTHER_CATEGORY ? t('cat.other') : c }))
  ];
  return (
    <div role="tablist" aria-label={t('cat.aria')} className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-3">
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
