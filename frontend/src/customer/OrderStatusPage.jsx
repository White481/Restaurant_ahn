import { useCallback, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api.js';
import { buttonClasses } from '../ui/Button.jsx';
import Icon from '../ui/Icon.jsx';
import { usePolling } from '../hooks/usePolling.js';
import { useLang } from '../i18n/LanguageContext.jsx';
import OrderStepper from './components/OrderStepper.jsx';
import CustomerShell from './components/CustomerShell.jsx';

const FINAL = ['completed', 'cancelled'];

export default function OrderStatusPage() {
  const { id } = useParams();
  const { t } = useLang();
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.getOrderStatus(id);
      setStatus(data.status);
      setError('');
    } catch (e) {
      setError(e.message);
      if (e.status === 404) setNotFound(true);
    }
  }, [id]);

  // ถามสถานะซ้ำทุก 4 วินาทีจนกว่าออเดอร์จะจบ (หรือไม่พบออเดอร์)
  // วิธีที่ง่ายที่สุดสำหรับ "live tracking"; ระบบที่ต้องการทันใจกว่านี้จะใช้ WebSocket/SSE
  usePolling(load, 4000, !notFound && !FINAL.includes(status));

  const cancelled = status === 'cancelled';

  return (
    <CustomerShell width="max-w-md">
      <section className="rounded-2xl border border-stone-300 bg-stone-50 px-5 pb-6 pt-8 text-center">
        <div
          className={`mx-auto mb-3 grid size-14 place-items-center rounded-full ${
            cancelled ? 'bg-chili-100 text-chili-700' : status === 'completed' ? 'bg-sage-100 text-sage-700' : 'bg-brand-100 text-brand-700'
          }`}
        >
          <Icon name={cancelled ? 'x' : status === 'completed' ? 'check' : 'clock'} className="size-7" strokeWidth={2} />
        </div>
        <p className="eyebrow">{status ? t(`status.${status}`) : t('track.loading')}</p>
        <h1 className="mt-1 font-display text-3xl font-bold">{t('track.title', { id })}</h1>

        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-chili-100 px-3 py-2 text-sm font-medium text-chili-700">
            {error}
          </p>
        )}

        {cancelled && <p className="mt-5 rounded-lg bg-chili-100 px-4 py-3 text-sm font-semibold text-chili-700">{t('track.cancelled')}</p>}

        {status && !cancelled && <OrderStepper status={status} />}

        {status && !FINAL.includes(status) && (
          <p className="flex items-center justify-center gap-2 text-xs text-stone-500">
            <span aria-hidden="true" className="pulse-dot size-1.5 rounded-full bg-sage-500" />
            {t('track.auto')}
          </p>
        )}

        {status === 'completed' && <p className="font-display text-lg italic text-sage-700">{t('track.thanks')}</p>}
      </section>

      <Link className={`${buttonClasses('dark', 'lg')} mt-4 w-full`} to="/">
        {t('track.orderMore')}
        <Icon name="arrow" className="size-4" />
      </Link>
    </CustomerShell>
  );
}
