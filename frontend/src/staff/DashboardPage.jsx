import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import Button from '../ui/Button.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import Skeleton from '../ui/Skeleton.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { STATUS_DOT, formatBaht } from '../components/status.js';
import { localizedName, formatDateTime } from '../i18n/index.js';
import { useLang } from '../i18n/LanguageContext.jsx';
import { usePolling } from '../hooks/usePolling.js';
import { useAuth } from './AuthContext.jsx';
import StaffLayout from './components/StaffLayout.jsx';
import LiveIndicator from './components/LiveIndicator.jsx';

const REFRESH_MS = 30000; // รีเฟรชทุก 30 วินาที

// สถานะออเดอร์ทั้งหมดที่จะแสดงในแถวสถานะ (ลำดับตาม flow)
const ALL_STATUSES = ['placed', 'preparing', 'ready', 'served', 'completed', 'cancelled'];

// สถานะโต๊ะ: สีจากชุดเดียวกับสถานะออเดอร์ แสดงคู่ข้อความเสมอ
const TABLE_STATUSES = [
  { key: 'available', dot: 'bg-sage-500' },
  { key: 'occupied', dot: 'bg-brand-500' },
  { key: 'inactive', dot: 'bg-stone-400' }
];

const panel = 'rounded-xl border border-stone-300 bg-stone-50 dark:border-stone-800 dark:bg-stone-900';
const titleText = 'text-[13px] font-bold uppercase tracking-[0.08em]';
const panelTitle = `mb-4 ${titleText}`;

// วัตถุดิบที่ถือว่า "ใกล้หมด" (หน่วยกรัม/มล. < 1000, หน่วยชิ้น < 20)
const isLowStock = (ing) => ing.quantity_in_stock < (['g', 'ml'].includes(ing.unit) ? 1000 : 20);
const todayIso = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date());

export default function DashboardPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [date, setDate] = useState(todayIso); // วันที่ของรายงาน (ส่งเป็นพารามิเตอร์ให้ stored procedure)

  const refresh = useCallback(async () => {
    try {
      const data = await api.getDashboardStats(date);
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
  }, [logout, navigate, date]);

  usePolling(refresh, REFRESH_MS, true, date);

  const tableTotal = stats ? Object.values(stats.table_stats).reduce((s, n) => s + n, 0) : 0;
  const statusTotal = stats ? ALL_STATUSES.reduce((s, k) => s + (stats.orders_by_status[k] || 0), 0) : 0;
  const topMax = stats && stats.top_items.length > 0 ? Math.max(...stats.top_items.map((i) => Number(i.total_qty))) : 0;

  const kpis = stats
    ? [
        { label: t('dash.revenue'), value: formatBaht(stats.sales.revenue), sub: t('dash.paidOrders', { n: stats.sales.paid_orders }), accent: true },
        { label: t('dash.ordersToday'), value: stats.sales.total_orders, sub: t('dash.cancelledN', { n: stats.sales.cancelled }) },
        { label: t('dash.avgOrder'), value: formatBaht(stats.sales.avg_order), sub: t('dash.itemsSold', { n: stats.sales.items_sold }) },
        { label: t('dash.activeTables'), value: stats.table_stats.occupied || 0, sub: `/ ${tableTotal}` }
      ]
    : [];

  return (
    <StaffLayout title={t('dash.title')} headerRight={<LiveIndicator lastUpdated={lastUpdated} error={error} />}>
      {stats === null && !error && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label={t('common.loading')}>
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      )}

      {stats === null && error && (
        <EmptyState icon="alert" title={t('dash.loadFail')} hint={error}>
          <Button onClick={refresh}>{t('common.retry')}</Button>
        </EmptyState>
      )}

      {/* เลือกวันที่ของรายงาน: เปลี่ยนแล้วเรียก stored procedure ใหม่ด้วยวันที่นั้น */}
      <div className="mb-5 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5 text-[11px] font-bold uppercase tracking-[0.09em] text-stone-500 dark:text-stone-400">
          {t('dash.date')}
          <input
            type="date"
            value={date}
            max={todayIso()}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            className="min-h-10 rounded-lg border border-stone-300 bg-stone-50 px-3 text-sm font-medium normal-case tracking-normal text-stone-950 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-50"
          />
        </label>
        {date !== todayIso() && (
          <Button variant="secondary" size="sm" className="min-h-10" onClick={() => setDate(todayIso())}>
            {t('dash.today')}
          </Button>
        )}
        {stats && (
          <p className="ml-auto flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
            <span className={`size-1.5 rounded-full ${stats.sales.source === 'procedure' ? 'bg-sage-500' : 'bg-turmeric-500'}`} aria-hidden="true" />
            {stats.sales.source === 'procedure' ? t('dash.viaProc') : t('dash.viaQuery')}
          </p>
        )}
      </div>

      {stats && (
        <div className="flex flex-col gap-6">
          {/* KPI: ตัวเลขใหญ่ serif + ป้ายเล็ก (ไม่ใช่กราฟ ตัวเลขเดียวอ่านง่ายที่สุด) */}
          <div className="grid gap-px overflow-hidden rounded-xl border border-stone-300 bg-stone-300 sm:grid-cols-2 xl:grid-cols-4 dark:border-stone-800 dark:bg-stone-800">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="bg-stone-50 px-5 py-4 dark:bg-stone-900">
                <p className="text-[11px] font-bold uppercase tracking-[0.09em] text-brand-600 dark:text-brand-400">{kpi.label}</p>
                <p className="mt-1 flex items-baseline gap-1.5">
                  <span className={`font-display text-4xl font-bold tabular-nums ${kpi.accent ? 'text-brand-600 dark:text-brand-400' : ''}`}>{kpi.value}</span>
                  {kpi.sub && <span className="text-sm text-stone-500 dark:text-stone-400">{kpi.sub}</span>}
                </p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            {/* เมนูขายดี: แถบแนวนอนสีเดียว (ค่าเดียวต่อเมนู) + ตัวเลขกำกับทุกแถว */}
            <section className={`${panel} p-5`}>
              <h2 className={panelTitle}>{t('dash.topItems')}</h2>
              {stats.top_items.length === 0 ? (
                <p className="py-6 text-center text-sm text-stone-500 dark:text-stone-400">{t('dash.noTopItems')}</p>
              ) : (
                <ol className="flex flex-col gap-4">
                  {stats.top_items.map((item, idx) => (
                    <li
                      key={item.menu_item_id}
                      title={`${localizedName(item, lang)} · ${item.total_qty} ${t('dash.sold')} · ${formatBaht(item.total_revenue)}`}
                    >
                      <div className="flex items-baseline gap-3">
                        <span className="w-5 font-display text-base font-bold italic text-stone-400">{idx + 1}</span>
                        <span className="min-w-0 flex-1 truncate font-semibold">{localizedName(item, lang)}</span>
                        <span className="text-sm tabular-nums text-stone-500 dark:text-stone-400">
                          {item.total_qty} {t('dash.sold')}
                        </span>
                        <strong className="w-20 text-right font-display tabular-nums">{formatBaht(item.total_revenue)}</strong>
                      </div>
                      <div className="ml-8 mt-1.5 h-1.5 rounded-full bg-stone-200 dark:bg-stone-800">
                        <div
                          className="h-full rounded-full bg-brand-500"
                          style={{ width: `${topMax ? (Number(item.total_qty) / topMax) * 100 : 0}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <div className="flex flex-col gap-6">
              {/* ออเดอร์วันนี้ตามสถานะ: แท่งสัดส่วนเดียว + รายการสถานะพร้อมจำนวน (ไม่ใช้สีอย่างเดียว) */}
              <section className={`${panel} p-5`}>
                <h2 className={panelTitle}>{t('dash.ordersByStatus')}</h2>
                {statusTotal > 0 && (
                  <div className="mb-4 flex h-2.5 gap-0.5 overflow-hidden rounded-full" aria-hidden="true">
                    {ALL_STATUSES.filter((s) => stats.orders_by_status[s]).map((s) => (
                      <span key={s} className={STATUS_DOT[s]} style={{ flexGrow: stats.orders_by_status[s] }} />
                    ))}
                  </div>
                )}
                <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {ALL_STATUSES.map((status) => (
                    <li key={status} className="flex items-center gap-2 text-sm">
                      <span aria-hidden="true" className={`size-2 rounded-full ${STATUS_DOT[status]}`} />
                      <span className="text-stone-600 dark:text-stone-300">{t(`status.${status}`)}</span>
                      <strong className="ml-auto font-display tabular-nums">{stats.orders_by_status[status] || 0}</strong>
                    </li>
                  ))}
                </ul>
              </section>

              <section className={`${panel} p-5`}>
                <h2 className={panelTitle}>{t('dash.tableStatus')}</h2>
                <ul className="grid grid-cols-2 gap-2">
                  {TABLE_STATUSES.map(({ key, dot }) => (
                    <li key={key} className="flex items-center gap-2 rounded-lg bg-stone-100 px-3 py-2 dark:bg-stone-950">
                      <span aria-hidden="true" className={`size-2 rounded-full ${dot}`} />
                      <span className="text-sm text-stone-600 dark:text-stone-300">{t(`dash.table_${key}`)}</span>
                      <strong className="ml-auto font-display text-lg tabular-nums">{stats.table_stats[key] || 0}</strong>
                    </li>
                  ))}
                </ul>
                <dl className="mt-4 flex flex-col gap-1.5 border-t border-dashed border-stone-300 pt-3 text-sm dark:border-stone-700">
                  {[
                    [t('dash.totalEmployees'), stats.total_employees],
                    [t('dash.totalTables'), tableTotal]
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between">
                      <dt className="text-stone-500 dark:text-stone-400">{label}</dt>
                      <dd className="font-semibold tabular-nums">{value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            </div>
          </div>

          {/* สต็อกวัตถุดิบ: trigger ตัดสต็อกตอนสั่ง และคืนตอนยกเลิก (เห็นตัวเลขเปลี่ยนทันทีหลังสั่งอาหาร) */}
          <section className={`${panel} p-5`}>
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className={titleText}>{t('dash.stock')}</h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">{t('dash.stockHint')}</p>
            </div>
            {stats.ingredients.length === 0 ? (
              <p className="py-4 text-center text-sm text-stone-500 dark:text-stone-400">{t('dash.noStock')}</p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {stats.ingredients.map((ing) => {
                  const low = isLowStock(ing);
                  return (
                    <li
                      key={ing.ingredient_id}
                      className={`flex items-baseline justify-between gap-2 rounded-lg px-3 py-2 ${
                        low ? 'bg-chili-100 text-chili-700 dark:bg-chili-900 dark:text-chili-300' : 'bg-stone-100 dark:bg-stone-950'
                      }`}
                    >
                      <span className="truncate text-sm">
                        {ing.ingredient_name}
                        {low && <span className="ml-1.5 text-[11px] font-bold uppercase">{t('dash.lowStock')}</span>}
                      </span>
                      <strong className="shrink-0 font-display tabular-nums">
                        {Number(ing.quantity_in_stock).toLocaleString()} <span className="font-sans text-xs font-normal">{ing.unit}</span>
                      </strong>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* ออเดอร์ล่าสุด: ตารางหัวส้ม + แถวสลับสี ตาม mockup */}
          <section className={`${panel} overflow-hidden`}>
            <h2 className={`${titleText} px-5 py-4`}>{t('dash.recentOrders')}</h2>
            {stats.recent_orders.length === 0 ? (
              <p className="px-5 pb-6 text-center text-sm text-stone-500 dark:text-stone-400">{t('dash.noRecentOrders')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="bg-brand-600 text-left text-xs font-bold uppercase tracking-wider text-white">
                      <th className="px-5 py-2.5">#</th>
                      <th className="px-3 py-2.5">{t('dash.tableCol')}</th>
                      <th className="px-3 py-2.5">{t('dash.typeCol')}</th>
                      <th className="px-3 py-2.5">{t('dash.statusCol')}</th>
                      <th className="px-3 py-2.5 text-right">{t('dash.totalCol')}</th>
                      <th className="px-5 py-2.5 text-right">{t('dash.dateCol')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recent_orders.map((order) => (
                      <tr key={order.order_id} className="even:bg-stone-100 dark:even:bg-stone-950/60">
                        <td className="px-5 py-2.5 font-display font-bold tabular-nums">{order.order_id}</td>
                        <td className="px-3 py-2.5">{order.table_number || '—'}</td>
                        <td className="px-3 py-2.5 text-stone-600 dark:text-stone-300">{t(`orderType.${order.order_type}`)}</td>
                        <td className="px-3 py-2.5">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{formatBaht(order.total_price)}</td>
                        <td className="px-5 py-2.5 text-right tabular-nums text-stone-500 dark:text-stone-400">{formatDateTime(order.order_date, lang)}</td>
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
