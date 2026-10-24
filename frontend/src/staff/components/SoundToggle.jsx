import Icon from '../../ui/Icon.jsx';
import { useLang } from '../../i18n/LanguageContext.jsx';

export default function SoundToggle({ enabled, onToggle }) {
  const { t } = useLang();
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={enabled}
      className={`flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold transition ${
        enabled
          ? 'bg-sage-100 text-sage-700 dark:bg-sage-900 dark:text-sage-300'
          : 'border border-dashed border-stone-400 text-stone-600 hover:border-brand-500 hover:text-brand-700 dark:border-stone-600 dark:text-stone-300'
      }`}
    >
      <Icon name={enabled ? 'bell' : 'bellOff'} className="size-4" />
      {enabled ? t('sound.on') : t('sound.off')}
    </button>
  );
}
