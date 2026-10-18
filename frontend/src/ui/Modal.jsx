import { useEffect, useRef } from 'react';

// กล่องยืนยัน: กด Esc หรือคลิกพื้นหลังเพื่อปิด, ล็อกการเลื่อนหน้าด้านหลัง, ย้าย focus เข้ากล่อง
export default function Modal({ open, onClose, title, children, footer }) {
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
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
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
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl outline-none dark:bg-stone-900 dark:text-stone-100"
      >
        <h2 className="text-lg font-bold">{title}</h2>
        <div className="mt-2 text-stone-600 dark:text-stone-300">{children}</div>
        {footer && <div className="mt-5 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
