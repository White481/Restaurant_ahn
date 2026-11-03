import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import Button from '../ui/Button.jsx';
import Icon from '../ui/Icon.jsx';
import Skeleton from '../ui/Skeleton.jsx';
import { useToast } from '../ui/Toast.jsx';
import { TABLE_TONE, canTableTransition } from '../components/status.js';
import { usePolling } from '../hooks/usePolling.js';
import { useLang } from '../i18n/LanguageContext.jsx';
import { useAuth } from './AuthContext.jsx';
import StaffLayout from './components/StaffLayout.jsx';

const REFRESH_MS = 10000;

// หน้าโต๊ะ (admin / waiter): เปิดโต๊ะเมื่อลูกค้านั่งแล้ว ลูกค้าจึงสแกน QR สั่งอาหารได้
//   เปิดโต๊ะ = available -> occupied, ปิดโต๊ะ = occupied -> available (ต้องไม่มีออเดอร์ค้าง)
//   admin ปิด/เปิดใช้งานโต๊ะได้ (inactive) · ชำระเงินครบแล้ว trigger trg_orders_au_status ปิดโต๊ะให้เอง
export default function TablesPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useLang();
  const [tables, setTables] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const handleError = useCallback(
    (e) => {
      if (e.status === 401) {
        logout();
        navigate('/staff/login', { replace: true });
        return;
      }
      toast.error(e.message);
    },
    [logout, navigate, toast]
  );

  const refresh = useCallback(async () => {
    try {
      setTables(await api.getTables());
    } catch (e) {
      if (e.status === 401) handleError(e);
      else setTables((prev) => prev ?? []);
    }
  }, [handleError]);

  usePolling(refresh, REFRESH_MS);

  async function change(table, status) {
    setBusyId(table.table_id);
    try {
      await api.updateTableStatus(table.table_id, status);
      toast.success(t(`tables.done.${status}`, { table: table.table_number }));
      await refresh();
    } catch (e) {
      handleError(e);
    } finally {
      setBusyId(null);
    }
  }

  const qrLink = (table) => `${window.location.origin}/?table=${table.table_id}`;

  return (
    <StaffLayout title={t('staff.title.tables')}>
      <p className="mb-5 max-w-2xl text-sm text-stone-600 dark:text-stone-300">{t('tables.lead')}</p>

      {tables === null ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tables.map((table) => {
            const busy = busyId === table.table_id;
            const can = (to) => canTableTransition(user.role, table.status, to);
            return (
              <li
                key={table.table_id}
                className="flex flex-col gap-3 rounded-xl border border-stone-300 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-900"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-display text-3xl font-extrabold leading-none">{table.table_number}</p>
                    <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">{t('tables.seats', { n: table.capacity })}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${TABLE_TONE[table.status]}`}>
                    {t(`tables.status.${table.status}`)}
                  </span>
                </div>

                {table.active_orders > 0 && (
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-turmeric-700 dark:text-turmeric-300">
                    <Icon name="receipt" className="size-4" />
                    {t('tables.active', { n: table.active_orders })}
                  </p>
                )}

                <a
                  href={qrLink(table)}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate text-xs text-stone-500 underline-offset-2 hover:underline dark:text-stone-400"
                >
                  {t('tables.qr')}: /?table={table.table_id}
                </a>

                <div className="mt-auto flex flex-wrap gap-2">
                  {can('occupied') && (
                    <Button size="sm" disabled={busy} onClick={() => change(table, 'occupied')}>
                      {t('tables.open')}
                    </Button>
                  )}
                  {can('available') && table.status === 'occupied' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={busy || table.active_orders > 0}
                      title={table.active_orders > 0 ? t('tables.unpaid') : undefined}
                      onClick={() => change(table, 'available')}
                    >
                      {t('tables.close')}
                    </Button>
                  )}
                  {can('inactive') && (
                    <Button size="sm" variant="ghost" disabled={busy} onClick={() => change(table, 'inactive')}>
                      {t('tables.disable')}
                    </Button>
                  )}
                  {can('available') && table.status === 'inactive' && (
                    <Button size="sm" variant="secondary" disabled={busy} onClick={() => change(table, 'available')}>
                      {t('tables.enable')}
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </StaffLayout>
  );
}
