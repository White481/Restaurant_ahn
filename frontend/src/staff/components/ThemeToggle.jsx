const NEXT = { system: 'light', light: 'dark', dark: 'system' };
const LABEL = { system: '💻 ตามเครื่อง', light: '☀️ สว่าง', dark: '🌙 มืด' };

// กดวนไปเรื่อยๆ: ตามเครื่อง -> สว่าง -> มืด
export default function ThemeToggle({ choice, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(NEXT[choice])}
      aria-label={`ธีม: ${LABEL[choice]} (กดเพื่อเปลี่ยน)`}
      data-theme-choice={choice}
      className="min-h-9 rounded-lg px-3 text-sm font-medium text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
    >
      {LABEL[choice]}
    </button>
  );
}
