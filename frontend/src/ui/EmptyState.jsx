export default function EmptyState({ icon = '🍽️', title, hint, children }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
      <div className="text-4xl" aria-hidden="true">
        {icon}
      </div>
      <p className="font-semibold text-stone-700 dark:text-stone-200">{title}</p>
      {hint && <p className="text-sm text-stone-500 dark:text-stone-400">{hint}</p>}
      {children}
    </div>
  );
}
