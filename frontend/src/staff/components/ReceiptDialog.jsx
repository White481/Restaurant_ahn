import { useState } from 'react';
import { createPortal } from 'react-dom';
import Button from '../../ui/Button.jsx';
import Modal from '../../ui/Modal.jsx';
import Receipt from '../../components/Receipt.jsx';
import { useLang } from '../../i18n/LanguageContext.jsx';

const KEY = 'oms_receipt_lang';
const OPTIONS = [
  { value: 'th', label: 'ไทย' },
  { value: 'en', label: 'English' }
];

// พรีวิวใบเสร็จ + พนักงาน "เลือกภาษาของใบเสร็จ" (ไทย/English) ก่อนกดพิมพ์
// ภาษาที่เลือกครั้งล่าสุดจะถูกจำไว้ ถ้ายังไม่เคยเลือกใช้ตามภาษาของหน้าเว็บ
// การพิมพ์: วางสำเนาใบเสร็จไว้นอก #root ด้วย portal แล้ว print.css จะซ่อนทุกอย่างยกเว้นสำเนานี้ตอนพิมพ์ (ขนาดกระดาษ 80 มม.)
export default function ReceiptDialog({ order, onClose }) {
  const { lang: uiLang, t } = useLang();
  const [lang, setLang] = useState(() => {
    const stored = localStorage.getItem(KEY);
    return stored === 'th' || stored === 'en' ? stored : uiLang;
  });

  const choose = (value) => {
    localStorage.setItem(KEY, value);
    setLang(value);
  };

  return (
    <>
      <Modal
        open
        onClose={onClose}
        title={t('receiptDlg.title', { id: order.order_id })}
        footer={
          <>
            <Button variant="secondary" onClick={onClose}>
              {t('common.close')}
            </Button>
            <Button onClick={() => window.print()}>🖨️ {t('receiptDlg.print')}</Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm">{t('receiptDlg.lang')}</span>
            <div role="group" aria-label={t('receiptDlg.lang')} className="inline-flex rounded-full bg-stone-200 p-1 dark:bg-stone-800">
              {OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  lang={option.value}
                  aria-pressed={lang === option.value}
                  onClick={() => choose(option.value)}
                  className={`min-h-9 rounded-full px-4 text-sm font-semibold ${
                    lang === option.value ? 'bg-white text-stone-900 shadow-sm dark:bg-stone-100' : 'text-stone-600 dark:text-stone-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs">{t('receiptDlg.hint')}</p>
          <div className="flex justify-center rounded-xl bg-stone-200 p-4 dark:bg-stone-800">
            <Receipt order={order} lang={lang} />
          </div>
        </div>
      </Modal>
      {createPortal(
        <div className="receipt-print-root">
          <Receipt order={order} lang={lang} />
        </div>,
        document.body
      )}
    </>
  );
}
