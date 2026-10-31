import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { RESERVATION_SLOTS, addDays, shopNow } from '../components/status.js';
import Button, { buttonClasses } from '../ui/Button.jsx';
import Icon from '../ui/Icon.jsx';
import { inputClass, labelClass } from '../ui/fields.js';
import { useLang } from '../i18n/LanguageContext.jsx';
import CustomerShell from './components/CustomerShell.jsx';

const MAX_PARTY = 20;
const MAX_DAYS_AHEAD = 60;

// วันที่แบบอ่านง่ายตามภาษา เช่น "ส. 1 พ.ย. 2569" / "Sat, 1 Nov 2026"
function formatDay(isoDate, lang) {
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'th-TH', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${isoDate}T00:00:00Z`)
  );
}

// หน้าจองโต๊ะของลูกค้า (ไม่ต้อง login): กรอกชื่อ เบอร์ วัน เวลา จำนวนคน -> ระบบหาโต๊ะให้
export default function ReservePage() {
  const { lang, t } = useLang();
  const now = shopNow();
  const [form, setForm] = useState({ name: '', phone: '', date: now.date, time: '', party: 2 });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null); // ผลการจองที่สำเร็จ

  // วันนี้: เหลือเฉพาะรอบที่ยังไม่ถึงเวลา
  const slots = useMemo(
    () => (form.date === now.date ? RESERVATION_SLOTS.filter((s) => s > now.time) : RESERVATION_SLOTS),
    [form.date, now.date, now.time]
  );
  const time = slots.includes(form.time) ? form.time : slots[0] || '';
  const update = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  const setParty = (n) => setForm((prev) => ({ ...prev, party: Math.min(MAX_PARTY, Math.max(1, n)) }));

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const result = await api.createReservation({
        name: form.name.trim(),
        phone: form.phone.trim(),
        date: form.date,
        time,
        party_size: form.party
      });
      setDone(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <CustomerShell width="max-w-md">
        <section className="rise-in rounded-2xl border border-stone-300 bg-stone-50 px-5 pb-6 pt-8 text-center">
          <div className="mx-auto mb-3 grid size-14 place-items-center rounded-full bg-sage-100 text-sage-700">
            <Icon name="check" className="size-7" strokeWidth={2} />
          </div>
          <p className="eyebrow">{t('resv.doneTitle')}</p>
          <h1 className="mt-1 font-display text-3xl font-bold">{t('resv.doneNo', { id: done.reservation_id })}</h1>
          <dl className="mx-auto mt-6 grid max-w-xs grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-left text-sm">
            <dt className="text-stone-500">{t('resv.doneTable')}</dt>
            <dd className="text-right font-display text-lg font-bold">{done.table_number}</dd>
            <dt className="text-stone-500">{t('resv.doneWhen')}</dt>
            <dd className="text-right font-semibold">
              {formatDay(done.date, lang)} · {done.time}
            </dd>
            <dt className="text-stone-500">{t('resv.doneParty')}</dt>
            <dd className="text-right font-semibold">{t('resv.people', { n: done.party_size })}</dd>
          </dl>
          <p className="mt-5 rounded-lg bg-peach-100 px-3 py-2 text-xs font-medium text-peach-700">{t('resv.doneNote')}</p>
        </section>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            size="lg"
            onClick={() => {
              setDone(null);
              setForm((prev) => ({ ...prev, time: '' }));
            }}
          >
            {t('resv.again')}
          </Button>
          <Link to="/" className={buttonClasses('dark', 'lg')}>
            {t('resv.toMenu')}
            <Icon name="arrow" className="size-4" />
          </Link>
        </div>
      </CustomerShell>
    );
  }

  return (
    <CustomerShell width="max-w-md">
      <div className="mb-5 flex items-end justify-between gap-3">
        <h1 className="font-display text-3xl font-bold leading-none">{t('resv.title')}</h1>
        <Link to="/" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-900">
          <Icon name="back" className="size-4" />
          {t('resv.toMenu')}
        </Link>
      </div>
      <p className="mb-5 text-sm text-stone-600">{t('resv.lead')}</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-stone-300 bg-stone-50 p-5">
        <label className={labelClass}>
          {t('resv.name')}
          <input value={form.name} onChange={update('name')} maxLength={100} required autoComplete="name" placeholder={t('resv.namePh')} className={inputClass} />
        </label>
        <label className={labelClass}>
          {t('resv.phone')}
          <input
            type="tel"
            value={form.phone}
            onChange={update('phone')}
            required
            pattern="[0-9+\-\s]{9,15}"
            inputMode="tel"
            autoComplete="tel"
            placeholder="08x-xxx-xxxx"
            className={inputClass}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className={labelClass}>
            {t('resv.date')}
            <input
              type="date"
              value={form.date}
              min={now.date}
              max={addDays(now.date, MAX_DAYS_AHEAD)}
              onChange={(e) => e.target.value && setForm((prev) => ({ ...prev, date: e.target.value }))}
              required
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            {t('resv.time')}
            <select value={time} onChange={update('time')} required disabled={slots.length === 0} className={inputClass}>
              {slots.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>
        {slots.length === 0 && <p className="-mt-2 text-xs font-medium text-chili-700">{t('resv.noSlots')}</p>}

        <div className={labelClass}>
          {t('resv.party')}
          <div className="flex items-center justify-between rounded-lg border border-stone-300 bg-white px-2 py-1.5">
            <button
              type="button"
              onClick={() => setParty(form.party - 1)}
              disabled={form.party <= 1}
              aria-label="-1"
              className="grid size-9 place-items-center rounded-full border border-brand-600/60 text-brand-700 hover:bg-brand-50 disabled:opacity-40"
            >
              <Icon name="minus" className="size-4" strokeWidth={2.25} />
            </button>
            <span className="flex items-center gap-2 font-display text-xl font-bold normal-case tracking-normal text-stone-950">
              <Icon name="users" className="size-5 text-stone-400" />
              {t('resv.people', { n: form.party })}
            </span>
            <button
              type="button"
              onClick={() => setParty(form.party + 1)}
              disabled={form.party >= MAX_PARTY}
              aria-label="+1"
              className="grid size-9 place-items-center rounded-full bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40"
            >
              <Icon name="plus" className="size-4" strokeWidth={2.25} />
            </button>
          </div>
        </div>

        <p className="flex items-start gap-2 text-xs text-stone-500">
          <Icon name="clock" className="mt-0.5 size-3.5" />
          {t('resv.hours')}
        </p>

        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-lg bg-chili-100 px-3 py-2.5 text-sm font-medium text-chili-700">
            <Icon name="alert" className="mt-0.5 size-4" />
            {error}
          </p>
        )}

        <Button type="submit" size="lg" disabled={submitting || !time} className="w-full uppercase tracking-[0.06em]">
          <Icon name="calendar" className="size-4" />
          {submitting ? t('resv.submitting') : t('resv.submit')}
        </Button>
      </form>
    </CustomerShell>
  );
}
