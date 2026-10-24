import { useState } from 'react';

// ตัวอักษรที่ใช้บนภาพแทน: พยัญชนะ/ตัวอักษรตัวแรก (ข้ามสระหน้าอย่าง เ แ โ ใ ไ เช่น "ไก่ทอด" -> "ก")
const initialOf = (name) => (name || '').match(/[ก-ฮA-Za-z0-9]/)?.[0] || '?';

// รูปเมนู: มี image_url ใช้รูปจริง ไม่มี/โหลดไม่ขึ้น -> ภาพแทนลายเส้นทแยง + ตัวอักษรแรกของชื่อ (serif)
export default function MenuThumb({ src, name, className = 'size-24' }) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  return (
    <div className={`relative shrink-0 overflow-hidden rounded-lg ring-1 ring-stone-300/70 ${className}`}>
      {showImage ? (
        <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-cover" />
      ) : (
        <div className="hatch grid h-full w-full place-items-center" aria-hidden="true">
          <span className="font-display text-4xl font-bold text-brand-600/70">{initialOf(name)}</span>
        </div>
      )}
    </div>
  );
}
