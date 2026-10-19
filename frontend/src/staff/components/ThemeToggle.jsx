import { useLang } from '../../i18n/LanguageContext.jsx';

const NEXT = { system: 'light', light: 'dark', dark: 'system' };

// กดวนไปเรื่อยๆ: ตามเครื่อง -> สว่าง -> มืด
export default function ThemeToggle({ choice, onChange }) {
  const { t } = useLang();
  const label = t(`theme.${choice}`);
  return (
    <button
      type="button"
      onClick={() => onChange(NEXT[choice])}
      aria-label={t('theme.aria', { label })}
      data-theme-choice={choice}
      className="min-h-9 rounded-lg px-3 text-sm font-medium text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
    >
      {label}
    </button>
  );
}
