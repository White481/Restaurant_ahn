import LangSwitch from '../../components/LangSwitch.jsx';
import ModeSwitch from '../../components/ModeSwitch.jsx';
import Wordmark from '../../ui/Wordmark.jsx';
import { useLang } from '../../i18n/LanguageContext.jsx';

// แถบหัวฝั่งลูกค้า: ชื่อร้าน + คำโปรย (ซ้าย), ภาษา + ลูกค้า|พนักงาน (ขวาบน), ป้ายหมายเลขโต๊ะ
// tableId: ตัวเลข = แสดงโต๊ะ, null = เตือนว่ายังไม่ระบุโต๊ะ, undefined = ไม่แสดง (เช่น หน้าติดตามออเดอร์)
export default function TopBar({ tableId }) {
  const { t } = useLang();
  return (
    <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-4">
      <div className="min-w-0">
        <Wordmark />
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span className="eyebrow">{t('top.tagline')}</span>
          {tableId === null && (
            <span className="rounded border border-chili-500/50 px-1.5 py-px text-[11px] font-bold text-chili-700">{t('top.noTable')}</span>
          )}
          {typeof tableId === 'number' && (
            <span className="rounded border border-stone-900 px-1.5 py-px text-[11px] font-bold tracking-wide text-stone-900">
              {t('top.table', { n: tableId })}
            </span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-4">
        <ModeSwitch />
        <LangSwitch />
      </div>
    </div>
  );
}
