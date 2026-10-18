import { useState } from 'react';
import { formatBaht } from '../../components/status.js';
import { visualFor } from './categoryVisual.js';

export default function MenuCard({ menu, quantity, onAdd, onChange }) {
  const visual = visualFor(menu.category);
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(menu.image_url) && !imageFailed; // รูปโหลดไม่ขึ้น -> กลับไปใช้ภาพแทน

  return (
    <li className="flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className={`relative aspect-[4/3] bg-linear-to-br ${visual.bg}`}>
        {showImage ? (
          <img
            src={menu.image_url}
            alt={menu.item_name}
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="grid h-full place-items-center text-5xl" aria-hidden="true">
            {visual.emoji}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 min-h-10 font-semibold leading-snug text-stone-900">{menu.item_name}</h3>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="text-lg font-bold text-brand-700">{formatBaht(menu.price)}</span>

          {quantity === 0 ? (
            <button
              type="button"
              aria-label={`เพิ่ม ${menu.item_name}`}
              onClick={onAdd}
              className="grid size-11 place-items-center rounded-full bg-brand-600 text-2xl leading-none text-white hover:bg-brand-700 active:scale-95"
            >
              +
            </button>
          ) : (
            <div className="flex items-center gap-1 rounded-full bg-brand-50 p-1">
              <button
                type="button"
                aria-label={`ลด ${menu.item_name}`}
                onClick={() => onChange(quantity - 1)}
                className="grid size-9 place-items-center rounded-full bg-white text-xl leading-none text-brand-700 hover:bg-brand-100"
              >
                −
              </button>
              <span className="min-w-6 text-center font-bold text-brand-800" data-testid="qty">
                {quantity}
              </span>
              <button
                type="button"
                aria-label={`เพิ่ม ${menu.item_name}`}
                onClick={() => onChange(quantity + 1)}
                className="grid size-9 place-items-center rounded-full bg-brand-600 text-xl leading-none text-white hover:bg-brand-700"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
