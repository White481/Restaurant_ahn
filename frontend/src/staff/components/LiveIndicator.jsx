import { useNow } from '../../hooks/useNow.js';
import { useLang } from '../../i18n/LanguageContext.jsx';

// บอกว่าข้อมูลสดแค่ไหน: จุดเขียวกะพริบ + "อัปเดตเมื่อ n วินาทีที่แล้ว" / จุดแดงเมื่อเชื่อมต่อไม่ได้
export default function LiveIndicator({ lastUpdated, error }) {
  const now = useNow(1000);
  const { t } = useLang();
  const seconds = lastUpdated ? Math.max(0, Math.round((now - lastUpdated) / 1000)) : null;
  const offline = Boolean(error);

  return (
    <span
      className={`flex items-center gap-2 text-xs font-semibold tabular-nums ${
        offline ? 'text-chili-700 dark:text-chili-300' : 'text-stone-500 dark:text-stone-400'
      }`}
      role="status"
    >
      <span aria-hidden="true" className={`size-2 rounded-full ${offline ? 'bg-chili-500' : 'pulse-dot bg-sage-500'}`} />
      {offline ? t('live.offline') : seconds === null ? t('common.loading') : t('live.ago', { n: seconds })}
    </span>
  );
}
