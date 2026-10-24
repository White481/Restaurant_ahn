import { useEffect, useRef } from 'react';
import Icon from './Icon.jsx';
import { useLang } from '../i18n/LanguageContext.jsx';

// กล่องยืนยัน: กด Esc หรือคลิกพื้นหลังเพื่อปิด, ล็อกการเลื่อนหน้าด้านหลัง, ย้าย focus เข้ากล่อง
export default function Modal({ open, onClose, title, children, footer }) {
  const { t } = useLang();
  const panelRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose; // เก็บ onClose ล่าสุดไว้ใน ref เพื่อไม่ให้ effect เริ่มใหม่ (และแย่ง focus) ทุกครั้งที่หน้าถูก render ซ้ำ

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') closeRef.current();
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-espresso/55 p-3 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="rise-in max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl border border-stone-300 bg-stone-50 text-stone-950 shadow-[0_24px_60px_-20px_rgb(42_33_27/0.45)] outline-none dark:border-stone-800 dark:bg-stone-900 dark:text-stone-50"
      >
        <header className="flex items-start justify-between gap-3 border-b border-stone-200 px-5 pb-3 pt-4 dark:border-stone-800">
          <h2 className="font-display text-xl font-bold leading-tight">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="-mr-2 -mt-1 grid size-9 place-items-center rounded-full text-stone-500 hover:bg-stone-200 hover:text-stone-900 dark:hover:bg-stone-800 dark:hover:text-stone-50"
          >
            <Icon name="x" className="size-4" />
          </button>
        </header>
        <div className="px-5 py-4 text-stone-700 dark:text-stone-300">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-stone-200 px-5 py-3 dark:border-stone-800">{footer}</div>}
      </div>
    </div>
  );
}
