import { useLang } from '../i18n/LanguageContext.jsx';

// สีสถานะล็อกไว้ชุดเดียวทั้งแอป เพื่อให้จำสีได้โดยไม่ต้องอ่านข้อความ
const STYLE = {
  placed: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  preparing: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200',
  ready: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
  served: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'
};

export default function StatusBadge({ status }) {
  const { t } = useLang();
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold ${STYLE[status] || 'bg-stone-100 text-stone-700'}`}>
      {t(`status.${status}`)}
    </span>
  );
}
