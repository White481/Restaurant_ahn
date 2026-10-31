import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import {
  RESERVATION_DELETE_ROLES,
  RESERVATION_NEXT,
  RESERVATION_SLOTS,
  RESERVATION_TONE,
  addDays,
  shopNow
} from '../components/status.js';
import Button from '../ui/Button.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import Icon from '../ui/Icon.jsx';
import Modal from '../ui/Modal.jsx';
import Skeleton from '../ui/Skeleton.jsx';
import { inputClass, labelClass } from '../ui/fields.js';
import { useToast } from '../ui/Toast.jsx';
import { useLang } from '../i18n/LanguageContext.jsx';
import { usePolling } from '../hooks/usePolling.js';
import { useAuth } from './AuthContext.jsx';
import StaffLayout from './components/StaffLayout.jsx';
import LiveIndicator from './components/LiveIndicator.jsx';

const REFRESH_MS = 30000;

// ปุ่มของแต่ละสถานะถัดไป
const ACTION = {
  confirmed: { key: 'resvAdmin.confirm', variant: 'primary' },
  completed: { key: 'resvAdmin.checkin', variant: 'dark' },
  cancelled: { key: 'resvAdmin.cancel', variant: 'danger' }
};

function formatLongDay(isoDate, lang) {
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${isoDate}T00:00:00Z`)
  );
}

// การจองโต๊ะ (admin, waiter): ดูตามวัน, ยืนยัน, ลูกค้ามาถึง, ยกเลิก, ย้ายโต๊ะ/เวลา, ลบ (admin)
export default function ReservationsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { lang, t } = useLang();
  const [date, setDate] = useState(() => shopNow().date);
  const [list, setList] = useState(null);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [tables, setTables] = useState([]);
  const [editing, setEditing] = useState(null); // { reservation_id, table_id, date, time, party_size }
  const [deleteTarget, setDeleteTarget] = useState(null);
  const canDelete = RESERVATION_DELETE_ROLES.includes(user.role);

  const handleError = useCallback(
    (e) => {
      if (e.status === 401) {
        logout();
        navigate('/staff/login', { replace: true });
        return true;
      }
      return false;
    },
    [logout, navigate]
  );

  const refresh = useCallback(async () => {
    try {
      setList(await api.getReservations(date));
      setLastUpdated(Date.now());
      setError('');
    } catch (e) {
      if (!handleError(e)) setError(e.message);
    }
  }, [date, handleError]);

  usePolling(refresh, REFRESH_MS, true, date);

  // เปลี่ยนวันแล้วล้างรายการเก่าทันที ไม่ให้เห็นข้อมูลของวันก่อนระหว่างโหลด
  useEffect(() => {
    setList(null);
  }, [date]);

  useEffect(() => {
    api.getReservationTables().then(setTables).catch(handleError);
  }, [handleError]);

  async function run(id, action, successKey) {
    setBusyId(id);
    try {
      await action();
      toast.success(t(successKey));
      await refresh();
    } catch (e) {
      if (!handleError(e)) toast.error(e.message);
    } finally {
      setBusyId(null);
    }
  }

  const changeStatus = (r, status) => run(r.reservation_id, () => api.updateReservationStatus(r.reservation_id, status), 'resvAdmin.changed');

  async function saveEdit(event) {
    event.preventDefault();
    const e = editing;
    setEditing(null);
    await run(
      e.reservation_id,
      () => api.updateReservation(e.reservation_id, { table_id: Number(e.table_id), date: e.date, time: e.time, party_size: Number(e.party_size) }),
      'resvAdmin.saved'
    );
  }

  async function confirmDelete() {
    const r = deleteTarget;
    setDeleteTarget(null);
    await run(r.reservation_id, () => api.deleteReservation(r.reservation_id), 'resvAdmin.deleted');
  }

  const today = shopNow().date;
  const active = (list || []).filter((r) => r.status !== 'cancelled');
  const stats = [
    { label: t('resvAdmin.total'), value: (list || []).length },
    { label: t('resvAdmin.pending'), value: (list || []).filter((r) => r.status === 'pending').length },
    { label: t('resvAdmin.confirmedN'), value: (list || []).filter((r) => r.status === 'confirmed').length },
    { label: t('resvAdmin.guests'), value: active.reduce((sum, r) => sum + (r.party_size || 0), 0) }
  ];

  const dayButton = 'grid size-10 place-items-center rounded-lg border border-stone-300 bg-stone-50 text-stone-700 hover:bg-white dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200';

  return (
    <StaffLayout title={t('staff.title.reservations')} headerRight={<LiveIndicator lastUpdated={lastUpdated} error={error} />}>
      {/* เลือกวัน */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <button type="button" className={dayButton} onClick={() => setDate(addDays(date, -1))} aria-label={t('resvAdmin.prevDay')}>
          <Icon name="chevronLeft" className="size-4" />
        </button>
        <input
          type="date"
          value={date}
          onChange={(e) => e.target.value && setDate(e.target.value)}
          className="min-h-10 rounded-lg border border-stone-300 bg-stone-50 px-3 text-sm font-medium dark:border-stone-700 dark:bg-stone-900"
          aria-label={t('resv.date')}
        />
        <button type="button" className={dayButton} onClick={() => setDate(addDays(date, 1))} aria-label={t('resvAdmin.nextDay')}>
          <Icon name="chevronRight" className="size-4" />
        </button>
        {date !== today && (
          <Button variant="secondary" size="sm" className="min-h-10" onClick={() => setDate(today)}>
            {t('resvAdmin.today')}
          </Button>
        )}
        <h2 className="ml-1 font-display text-xl font-bold">{formatLongDay(date, lang)}</h2>
      </div>

      {/* สรุปของวัน */}
      <div className="mb-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-stone-300 bg-stone-300 sm:grid-cols-4 dark:border-stone-800 dark:bg-stone-800">
        {stats.map((s) => (
          <div key={s.label} className="bg-stone-50 px-4 py-3 dark:bg-stone-900">
            <p className="text-[11px] font-bold uppercase tracking-[0.09em] text-brand-600 dark:text-brand-400">{s.label}</p>
            <p className="font-display text-3xl font-bold tabular-nums">{list ? s.value : '—'}</p>
          </div>
        ))}
      </div>

      {list === null && !error && <Skeleton className="h-48" />}
      {list === null && error && (
        <EmptyState icon="alert" title={t('resvAdmin.loadFail')} hint={error}>
          <Button onClick={refresh}>{t('common.retry')}</Button>
        </EmptyState>
      )}
      {list && list.length === 0 && <EmptyState icon="calendar" title={t('resvAdmin.empty')} />}

      {list && list.length > 0 && (
        <ul className="overflow-hidden rounded-xl border border-stone-300 bg-stone-50 dark:border-stone-800 dark:bg-stone-900">
          {list.map((r) => {
            const busy = busyId === r.reservation_id;
            const next = RESERVATION_NEXT[r.status] || [];
            const open = r.status === 'pending' || r.status === 'confirmed';
            return (
              <li
                key={r.reservation_id}
                className={`flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-stone-200 px-5 py-4 last:border-b-0 even:bg-stone-100 dark:border-stone-800 dark:even:bg-stone-900/60 ${
                  r.status === 'cancelled' ? 'opacity-55' : ''
                }`}
              >
                <div className="w-16 shrink-0">
                  <p className="font-display text-2xl font-bold leading-none tabular-nums">{r.reservation_time}</p>
                  <p className="eyebrow mt-1">#{r.reservation_id}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-semibold">
                    {r.customer_name}
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${RESERVATION_TONE[r.status]}`}>{t(`resv.status.${r.status}`)}</span>
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-500 dark:text-stone-400">
                    <span className="inline-flex items-center gap-1">
                      <Icon name="phone" className="size-3.5" />
                      {r.phone}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Icon name="users" className="size-3.5" />
                      {t('resv.people', { n: r.party_size })}
                    </span>
                  </p>
                </div>
                <span className="rounded border border-stone-900 px-2 py-0.5 text-sm font-bold dark:border-stone-300">{r.table_number}</span>
                <div className="flex flex-wrap gap-1.5">
                  {next.map((status) => (
                    <Button key={status} size="sm" variant={ACTION[status].variant} disabled={busy} onClick={() => changeStatus(r, status)}>
                      {t(ACTION[status].key)}
                    </Button>
                  ))}
                  {open && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() =>
                        setEditing({ reservation_id: r.reservation_id, table_id: r.table_id, date: r.reservation_date, time: r.reservation_time, party_size: r.party_size })
                      }
                    >
                      {t('resvAdmin.edit')}
                    </Button>
                  )}
                  {canDelete && (
                    <Button size="sm" variant="ghost" disabled={busy} onClick={() => setDeleteTarget(r)} aria-label={`${t('resvAdmin.delete')} #${r.reservation_id}`}>
                      <Icon name="x" className="size-3.5" />
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-4 flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
        <Icon name="table" className="size-3.5" />
        {t('resvAdmin.triggerHint')}
      </p>

      {/* แก้ไข / ย้ายโต๊ะ */}
      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing ? t('resvAdmin.editTitle', { id: editing.reservation_id }) : ''}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" form="edit-reservation">
              {t('resvAdmin.save')}
            </Button>
          </>
        }
      >
        {editing && (
          <form id="edit-reservation" onSubmit={saveEdit} className="flex flex-col gap-3">
            <label className={labelClass}>
              {t('resvAdmin.table')}
              <select value={editing.table_id} onChange={(e) => setEditing({ ...editing, table_id: e.target.value })} className={inputClass}>
                {tables.map((tb) => (
                  <option key={tb.table_id} value={tb.table_id}>
                    {t('resvAdmin.tableOpt', { table: tb.table_number, n: tb.capacity })}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className={labelClass}>
                {t('resv.date')}
                <input type="date" value={editing.date} min={today} onChange={(e) => setEditing({ ...editing, date: e.target.value })} required className={inputClass} />
              </label>
              <label className={labelClass}>
                {t('resv.time')}
                <select value={editing.time} onChange={(e) => setEditing({ ...editing, time: e.target.value })} className={inputClass}>
                  {RESERVATION_SLOTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className={labelClass}>
              {t('resv.party')}
              <input
                type="number"
                min="1"
                max="20"
                value={editing.party_size}
                onChange={(e) => setEditing({ ...editing, party_size: e.target.value })}
                required
                className={inputClass}
              />
            </label>
          </form>
        )}
      </Modal>

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title={deleteTarget ? t('resvAdmin.deleteTitle', { id: deleteTarget.reservation_id }) : ''}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)} autoFocus>
              {t('common.cancel')}
            </Button>
            <Button variant="dangerSolid" onClick={confirmDelete}>
              {t('resvAdmin.delete')}
            </Button>
          </>
        }
      >
        <p>{t('resvAdmin.deleteBody')}</p>
      </Modal>
    </StaffLayout>
  );
}
