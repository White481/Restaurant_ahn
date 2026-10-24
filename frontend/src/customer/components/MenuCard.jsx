import { formatBaht } from '../../components/status.js';
import { localizedName } from '../../i18n/index.js';
import { useLang } from '../../i18n/LanguageContext.jsx';
import MenuThumb from './MenuThumb.jsx';
import QtyStepper from './QtyStepper.jsx';

// เมนู 1 รายการ แบบบรรทัดในเมนูกระดาษ: รูป | ชื่อ ..... ราคา | ชื่ออีกภาษาเป็นบรรทัดรอง
export default function MenuCard({ menu, quantity, onAdd, onChange }) {
  const { lang } = useLang();
  const name = localizedName(menu, lang);
  // ชื่อในอีกภาษา (ถ้ามี) แสดงเป็นบรรทัดรอง ให้ดูเป็นเมนูสองภาษา
  const altName = lang === 'en' ? (menu.item_name_en ? menu.item_name : null) : menu.item_name_en;

  return (
    <li className="flex gap-4 border-b border-dashed border-stone-300 py-4">
      <MenuThumb src={menu.image_url} name={name} />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-baseline gap-2">
          <h3 className="min-w-0 text-[16px] font-semibold leading-snug text-stone-950">{name}</h3>
          <span className="leader" aria-hidden="true" />
          <span className="shrink-0 font-display text-xl font-bold tabular-nums text-brand-600">{formatBaht(menu.price)}</span>
        </div>
        {altName && (
          <p className="mt-0.5 truncate font-display text-sm italic text-stone-500" lang={lang === 'en' ? 'th' : 'en'}>
            {altName}
          </p>
        )}

        <div className="mt-auto flex items-center justify-end pt-2">
          <QtyStepper name={name} quantity={quantity} onChange={(qty) => (quantity === 0 ? onAdd() : onChange(qty))} />
        </div>
      </div>
    </li>
  );
}
