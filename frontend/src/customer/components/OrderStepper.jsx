import { STATUS_FLOW } from '../../components/status.js';
import Icon from '../../ui/Icon.jsx';
import { useLang } from '../../i18n/LanguageContext.jsx';

// เส้นทางสถานะออเดอร์แนวนอน: ผ่านแล้ว = เขียว ✓, ตอนนี้ = ส้ม (กะพริบเบาๆ), ยังไม่ถึง = เทา
export default function OrderStepper({ status }) {
  const { t } = useLang();
  const currentIndex = STATUS_FLOW.indexOf(status);
  return (
    <ol className="my-8 grid grid-cols-5">
      {STATUS_FLOW.map((step, index) => {
        const state = index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'todo';
        const dot =
          state === 'done'
            ? 'border-sage-500 bg-sage-500 text-white'
            : state === 'current'
              ? 'border-brand-600 bg-brand-600 text-white'
              : 'border-stone-300 bg-stone-50 text-stone-400';
        const text = state === 'current' ? 'font-bold text-stone-950' : state === 'done' ? 'text-sage-700' : 'text-stone-400';
        return (
          <li
            key={step}
            data-state={state}
            aria-current={state === 'current' ? 'step' : undefined}
            className="relative flex flex-col items-center gap-2 text-center"
          >
            {index > 0 && (
              <span
                aria-hidden="true"
                className={`absolute right-1/2 top-4 h-0.5 w-full -translate-y-1/2 ${index <= currentIndex ? 'bg-sage-500' : 'bg-stone-300'}`}
              />
            )}
            <span className={`relative grid size-8 place-items-center rounded-full border-2 text-sm font-bold ${dot}`}>
              {state === 'done' ? <Icon name="check" className="size-4" strokeWidth={2.5} /> : index + 1}
              {state === 'current' && <span aria-hidden="true" className="pulse-dot absolute -inset-1.5 rounded-full border-2 border-brand-600/40" />}
            </span>
            <span className={`px-0.5 text-[11px] leading-tight sm:text-xs ${text}`}>{t(`status.${step}`)}</span>
          </li>
        );
      })}
    </ol>
  );
}
