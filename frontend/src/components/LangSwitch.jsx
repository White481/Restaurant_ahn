import { useLang } from '../i18n/LanguageContext.jsx';

// สวิตช์ภาษา ไทย | EN (จำค่าไว้ในเครื่อง) อยู่ข้างสวิตช์ ลูกค้า|พนักงาน มุมขวาบน
export default function LangSwitch() {
  const { lang, setLang, t } = useLang();

  const item = (value) => (
    <button
      key={value}
      type="button"
      lang={value === 'th' ? 'th' : 'en'}
      aria-pressed={lang === value}
      onClick={() => setLang(value)}
      className={`min-h-8 rounded-full px-3 text-xs font-bold transition ${
        lang === value
          ? 'bg-white text-stone-900 shadow-sm dark:bg-stone-100 dark:text-stone-900'
          : 'text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white'
      }`}
    >
      {t(`lang.${value}`)}
    </button>
  );

  return (
    <div role="group" aria-label={t('lang.aria')} className="inline-flex shrink-0 rounded-full bg-stone-200 p-0.5 dark:bg-stone-800">
      {item('th')}
      {item('en')}
    </div>
  );
}
