import Icon from '../../ui/Icon.jsx';
import { useLang } from '../../i18n/LanguageContext.jsx';

// ปุ่ม − จำนวน + (วงกลมขอบส้มตาม mockup) quantity = 0 จะแสดงปุ่ม + ปุ่มเดียว
export default function QtyStepper({ name, quantity, onChange, size = 'md' }) {
  const { t } = useLang();
  const box = size === 'sm' ? 'size-8' : 'size-9';
  const circle = `grid ${box} place-items-center rounded-full border transition active:scale-95`;

  if (quantity === 0) {
    return (
      <button
        type="button"
        aria-label={t('menu.add', { name })}
        onClick={() => onChange(1)}
        className={`${circle} border-brand-600 bg-brand-600 text-white hover:border-brand-700 hover:bg-brand-700`}
      >
        <Icon name="plus" className="size-4" strokeWidth={2.25} />
      </button>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <button
        type="button"
        aria-label={t('menu.remove', { name })}
        onClick={() => onChange(quantity - 1)}
        className={`${circle} border-brand-600/60 bg-transparent text-brand-700 hover:bg-brand-50`}
      >
        <Icon name="minus" className="size-4" strokeWidth={2.25} />
      </button>
      <span className="min-w-6 text-center font-display text-lg font-bold tabular-nums text-stone-950" data-testid="qty">
        {quantity}
      </span>
      <button
        type="button"
        aria-label={t('menu.add', { name })}
        onClick={() => onChange(quantity + 1)}
        className={`${circle} border-brand-600 bg-brand-600 text-white hover:bg-brand-700`}
      >
        <Icon name="plus" className="size-4" strokeWidth={2.25} />
      </button>
    </div>
  );
}
