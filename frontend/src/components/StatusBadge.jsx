import { useLang } from '../i18n/LanguageContext.jsx';
import { STATUS_DOT, STATUS_TONE } from './status.js';

// ป้ายสถานะ: จุดสี + ข้อความ (สีล็อกไว้ชุดเดียวทั้งแอปใน status.js)
export default function StatusBadge({ status }) {
  const { t } = useLang();
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_TONE[status] || 'bg-stone-200 text-stone-700'}`}
    >
      <span aria-hidden="true" className={`size-1.5 rounded-full ${STATUS_DOT[status] || 'bg-stone-500'}`} />
      {t(`status.${status}`)}
    </span>
  );
}
