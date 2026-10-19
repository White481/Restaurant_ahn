import { useLang } from '../../i18n/LanguageContext.jsx';

export default function SoundToggle({ enabled, onToggle }) {
  const { t } = useLang();
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={enabled}
      className={`min-h-9 rounded-lg px-3 text-sm font-medium ${
        enabled
          ? 'bg-brand-100 text-brand-800 dark:bg-brand-900/50 dark:text-brand-200'
          : 'text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800'
      }`}
    >
      {enabled ? t('sound.on') : t('sound.off')}
    </button>
  );
}
