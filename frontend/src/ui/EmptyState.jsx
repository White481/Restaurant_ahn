import Icon from './Icon.jsx';

// สถานะว่าง/ผิดพลาด: icon = ชื่อไอคอนใน ui/Icon.jsx
export default function EmptyState({ icon = 'receipt', title, hint, children }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
      <div className="mb-1 grid size-14 place-items-center rounded-full border border-dashed border-stone-400 text-stone-500 dark:border-stone-600 dark:text-stone-400">
        <Icon name={icon} className="size-6" />
      </div>
      <p className="font-display text-lg font-bold text-stone-800 dark:text-stone-100">{title}</p>
      {hint && <p className="max-w-xs text-sm text-stone-500 dark:text-stone-400">{hint}</p>}
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}
