import Icon from '../../ui/Icon.jsx';
import { useLang } from '../../i18n/LanguageContext.jsx';

const NEXT = { system: 'light', light: 'dark', dark: 'system' };
const ICON = { system: 'monitor', light: 'sun', dark: 'moon' };

// กดวนไปเรื่อยๆ: ตามเครื่อง -> สว่าง -> มืด
export default function ThemeToggle({ choice, onChange }) {
  const { t } = useLang();
  const label = t(`theme.${choice}`);
  return (
    <button
      type="button"
      onClick={() => onChange(NEXT[choice])}
      aria-label={t('theme.aria', { label })}
      title={label}
      data-theme-choice={choice}
      className="flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-stone-600 transition hover:bg-stone-300/60 hover:text-stone-950 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-stone-50"
    >
      <Icon name={ICON[choice]} className="size-4" />
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
}
