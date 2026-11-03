import { SHOP } from '../config/shop.js';
import { formatBaht } from './status.js';
import { useLang } from '../i18n/LanguageContext.jsx';

// QR พร้อมเพย์ของร้าน + ยอดที่ต้องโอน (ใช้ทั้งหน้าตะกร้าลูกค้าและหน้ารับชำระเงินของพนักงาน)
export default function PromptPayQr({ amount }) {
  const { t } = useLang();
  return (
    <figure className="mx-auto flex w-full max-w-60 flex-col items-center gap-2 text-center">
      <img
        src={SHOP.promptPayQr}
        alt={t('qr.alt')}
        className="w-full rounded-lg border border-stone-300 shadow-sm dark:border-stone-700"
      />
      <figcaption className="text-sm text-stone-600 dark:text-stone-300">
        {t('qr.scan')} <strong className="tabular-nums text-brand-600 dark:text-brand-400">{formatBaht(amount)}</strong>
      </figcaption>
    </figure>
  );
}
