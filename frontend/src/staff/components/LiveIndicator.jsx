import { useNow } from '../../hooks/useNow.js';
import { useLang } from '../../i18n/LanguageContext.jsx';

// บอกว่าข้อมูลสดแค่ไหน: จุดเขียว + "อัปเดตเมื่อ n วินาทีที่แล้ว" / จุดแดงเมื่อเชื่อมต่อไม่ได้
export default function LiveIndicator({ lastUpdated, error }) {
  const now = useNow(1000);
  const { t } = useLang();
  const seconds = lastUpdated ? Math.max(0, Math.round((now - lastUpdated) / 1000)) : null;
  const offline = Boolean(error);

  return (
    <span className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-300" role="status">
      <span aria-hidden="true" className={`size-2.5 rounded-full ${offline ? 'bg-red-500' : 'bg-green-500'}`} />
      {offline ? t('live.offline') : seconds === null ? t('common.loading') : t('live.ago', { n: seconds })}
    </span>
  );
}
