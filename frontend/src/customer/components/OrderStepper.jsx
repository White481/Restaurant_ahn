import { STATUS_FLOW } from '../../components/status.js';
import { useLang } from '../../i18n/LanguageContext.jsx';

// ขั้นตอนสถานะออเดอร์ (ที่ผ่านแล้ว = เขียว ✓, ตอนนี้ = ส้ม, ที่ยังไม่ถึง = เทา)
export default function OrderStepper({ status }) {
  const { t } = useLang();
  const currentIndex = STATUS_FLOW.indexOf(status);
  return (
    <ol className="my-6 flex flex-col gap-4">
      {STATUS_FLOW.map((step, index) => {
        const state = index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'todo';
        const dot =
          state === 'done'
            ? 'border-green-600 bg-green-600 text-white'
            : state === 'current'
              ? 'border-brand-600 bg-brand-50 text-brand-700'
              : 'border-stone-300 text-stone-400';
        const text = state === 'current' ? 'font-bold text-stone-900' : state === 'done' ? 'text-green-700' : 'text-stone-400';
        return (
          <li key={step} data-state={state} aria-current={state === 'current' ? 'step' : undefined} className="flex items-center gap-3">
            <span className={`grid size-9 shrink-0 place-items-center rounded-full border-2 font-bold ${dot}`}>{state === 'done' ? '✓' : index + 1}</span>
            <span className={text}>{t(`status.${step}`)}</span>
          </li>
        );
      })}
    </ol>
  );
}
