import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import Button from '../ui/Button.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import Skeleton from '../ui/Skeleton.jsx';
import { useToast } from '../ui/Toast.jsx';
import { formatBaht } from '../components/status.js';
import { localizedName, formatDateTime } from '../i18n/index.js';
import { useLang } from '../i18n/LanguageContext.jsx';
import { usePolling } from '../hooks/usePolling.js';
import { useAuth } from './AuthContext.jsx';
import StaffLayout from './components/StaffLayout.jsx';
import LiveIndicator from './components/LiveIndicator.jsx';

const REFRESH_MS = 30000; // รีเฟรชทุก 30 วินาที

// สีของแต่ละสถานะโต๊ะ
const TABLE_STATUS_COLORS = {
  available: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  occupied: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  reserved: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
  inactive: 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'
};

// สีของแต่ละสถานะออเดอร์
const ORDER_STATUS_COLORS = {
  placed: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  preparing: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  ready: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  served: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
};

export default function DashboardPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const data = await api.getDashboardStats();
      setStats(data);
      setLastUpdated(Date.now());
      setError('');
    } catch (e) {
      if (e.status === 401) {
        logout();
        navigate('/staff/login', { replace: true });
        return;
      }
      setError(e.message);
    }
  }, [logout, navigate]);

  usePolling(refresh, REFRESH_MS);

  // แปลงตัวเลขเป็นรูปแบบสกุลเงิน
  const fmtMoney = (v) => formatBaht(v);

  // KPI cards data
  const kpiCards = stats ? [
    { icon: '💰', label: t('dash.revenue'), value: fmtMoney(stats.today_revenue), color: 'text-green-600 dark:text-green-400' },
    { icon: '📦', label: t('dash.ordersToday'), value: stats.today_order_count, color: 'text-blue-600 dark:text-blue-400' },
    { icon: '🧾', label: t('dash.avgOrder'), value: fmtMoney(stats.avg_order_value), color: 'text-purple-600 dark:text-purple-400' },
    { icon: '🪑', label: t('dash.activeTables'), value: (stats.table_stats.occupied || 0), color: 'text-red-600 dark:text-red-400' }
  ] : [];

  // สถานะออเดอร์ทั้งหมดที่จะแสดงในแถวสถานะ
  const ALL_STATUSES = ['placed', 'preparing', 'ready', 'served', 'completed', 'cancelled'];

  return (
    <StaffLayout
      title={t('dash.title')}
      headerRight={<LiveIndicator lastUpdated={lastUpdated} error={error} />}
    >
      {/* Loading state */}
      {stats === null && !error && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label={t('common.loading')}>
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      )}

      {/* Error state */}
      {stats === null && error && (
        <EmptyState icon="⚠️" title={t('dash.loadFail')} hint={error}>
          <Button onClick={refresh}>{t('common.retry')}</Button>
        </EmptyState>
      )}

      {stats && (
        <div className="flex flex-col gap-6">
          {/* KPI cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpiCards.map((kpi) => (
              <div
                key={kpi.label}
                className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm dark:bg-stone-900"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-2xl dark:bg-stone-800">
                  {kpi.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-stone-500 dark:text-stone-400">{kpi.label}</p>
                  <p className={`text-2xl font-bold tabular-nums ${kpi.color}`}>{kpi.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Orders by status + summary counts */}
          <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
            {/* Orders by status */}
            <section className="rounded-2xl bg-white p-4 dark:bg-stone-900">
              <h2 className="mb-3 text-lg font-bold">{t('dash.ordersByStatus')}</h2>
              <div className="flex flex-wrap gap-2">
                {ALL_STATUSES.map((status) => {
                  const count = stats.orders_by_status[status] || 0;
                  return (
                    <div
                      key={status}
                      className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${ORDER_STATUS_COLORS[status]}`}
                    >
                      <span>{t(`status.${status}`)}</span>
                      <span className="tabular-nums">{count}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Summary counts */}
            <section className="rounded-2xl bg-white p-4 dark:bg-stone-900">
              <h2 className="mb-3 text-lg font-bold">{t('dash.summary')}</h2>
              <ul className="flex flex-col gap-2">
                <li className="flex items-center justify-between">
                  <span className="text-sm text-stone-500 dark:text-stone-400">👥 {t('dash.totalCustomers')}</span>
                  <strong className="tabular-nums">{stats.total_customers}</strong>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-sm text-stone-500 dark:text-stone-400">👷 {t('dash.totalEmployees')}</span>
                  <strong className="tabular-nums">{stats.total_employees}</strong>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-sm text-stone-500 dark:text-stone-400">🪑 {t('dash.totalTables')}</span>
                  <strong className="tabular-nums">
                    {Object.values(stats.table_stats).reduce((s, n) => s + n, 0)}
                  </strong>
                </li>
              </ul>
            </section>
          </div>

          {/* Top selling items + Table status */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Top selling items */}
            <section className="rounded-2xl bg-white p-4 dark:bg-stone-900">
              <h2 className="mb-3 text-lg font-bold">🔥 {t('dash.topItems')}</h2>
              {stats.top_items.length === 0 ? (
                <p className="py-4 text-center text-sm text-stone-500 dark:text-stone-400">{t('dash.noTopItems')}</p>
              ) : (
                <ol className="flex flex-col gap-2">
                  {stats.top_items.map((item, idx) => (
                    <li key={item.menu_item_id} className="flex items-center gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{localizedName(item, lang)}</p>
                        <p className="text-sm text-stone-500 dark:text-stone-400">{item.total_qty} {t('dash.sold')}</p>
                      </div>
                      <strong className="tabular-nums">{fmtMoney(item.total_revenue)}</strong>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            {/* Table status grid */}
            <section className="rounded-2xl bg-white p-4 dark:bg-stone-900">
              <h2 className="mb-3 text-lg font-bold">🪑 {t('dash.tableStatus')}</h2>
              <div className="flex flex-wrap gap-2">
                {Object.entries(TABLE_STATUS_COLORS).map(([status, colorClass]) => {
                  const count = stats.table_stats[status] || 0;
                  return (
                    <div
                      key={status}
                      className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${colorClass}`}
                    >
                      <span>{t(`dash.table_${status}`)}</span>
                      <span className="text-lg tabular-nums">{count}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Recent orders */}
          <section className="rounded-2xl bg-white p-4 dark:bg-stone-900">
            <h2 className="mb-3 text-lg font-bold">🕒 {t('dash.recentOrders')}</h2>
            {stats.recent_orders.length === 0 ? (
              <p className="py-4 text-center text-sm text-stone-500 dark:text-stone-400">{t('dash.noRecentOrders')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 text-left text-stone-500 dark:border-stone-800 dark:text-stone-400">
                      <th className="py-2 pr-4 font-semibold">#</th>
                      <th className="py-2 pr-4 font-semibold">{t('dash.tableCol')}</th>
                      <th className="py-2 pr-4 font-semibold">{t('dash.typeCol')}</th>
                      <th className="py-2 pr-4 font-semibold">{t('dash.statusCol')}</th>
                      <th className="py-2 pr-4 font-semibold">{t('dash.totalCol')}</th>
                      <th className="py-2 pr-4 font-semibold">{t('dash.dateCol')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recent_orders.map((order) => (
                      <tr key={order.order_id} className="border-b border-stone-100 dark:border-stone-800">
                        <td className="py-2 pr-4 font-semibold tabular-nums">{order.order_id}</td>
                        <td className="py-2 pr-4">{order.table_number || '-'}</td>
                        <td className="py-2 pr-4">{t(`orderType.${order.order_type}`)}</td>
                        <td className="py-2 pr-4">
                          <span className={`inline-block rounded-lg px-2 py-0.5 text-xs font-semibold ${ORDER_STATUS_COLORS[order.status]}`}>
                            {t(`status.${order.status}`)}
                          </span>
                        </td>
                        <td className="py-2 pr-4 font-semibold tabular-nums">{fmtMoney(order.total_price)}</td>
                        <td className="py-2 pr-4 text-stone-500 dark:text-stone-400">{formatDateTime(order.order_date, lang)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </StaffLayout>
  );
}
