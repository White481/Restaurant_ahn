import { useLang } from '../i18n/LanguageContext.jsx';

// สวิตช์ภาษา ไทย | EN (จำค่าไว้ในเครื่อง): ตัวหนังสือล้วนคั่นด้วยเส้น แบบหัวกระดาษเมนู
export default function LangSwitch() {
  const { lang, setLang, t } = useLang();

  const item = (value) => (
    <button
      key={value}
      type="button"
      lang={value === 'th' ? 'th' : 'en'}
      aria-pressed={lang === value}
      onClick={() => setLang(value)}
      className={`min-h-8 px-1.5 text-xs font-bold tracking-wider transition ${
        lang === value
          ? 'text-brand-600 underline decoration-2 underline-offset-[6px] dark:text-brand-400'
          : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-50'
      }`}
    >
      {t(`lang.${value}`)}
    </button>
  );

  return (
    <div role="group" aria-label={t('lang.aria')} className="inline-flex shrink-0 items-center gap-1">
      {item('th')}
      <span aria-hidden="true" className="h-3 w-px bg-stone-300 dark:bg-stone-700" />
      {item('en')}
    </div>
  );
}
