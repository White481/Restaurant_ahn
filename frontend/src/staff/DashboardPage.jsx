import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import StatusBadge from '../components/StatusBadge.jsx';
import {
  ACTIVE_STATUSES,
  CANCELLABLE,
  NEXT_STEP,
  ORDER_TYPE_LABEL,
  PAYMENT_LABEL,
  STATUS_LABEL,
  formatBaht
} from '../components/status.js';
import { useAuth } from './AuthContext.jsx';
import MenuManager from './MenuManager.jsx';

const REFRESH_MS = 5000;

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('active');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  // token หมดอายุ/ไม่ถูกต้อง (401) -> ออกจากระบบแล้วกลับไปหน้า login
  const handleUnauthorized = useCallback(() => {
    logout();
    navigate('/staff/login', { replace: true });
  }, [logout, navigate]);

  const refresh = useCallback(async () => {
    try {
      const data = await api.getOrders();
      setOrders(data);
      setError('');
    } catch (e) {
      if (e.status === 401) return handleUnauthorized();
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [handleUnauthorized]);

  // ดึงออเดอร์ตอนเปิดหน้า แล้วดึงซ้ำทุก 5 วินาที เพื่อให้เห็นออเดอร์ใหม่ที่ลูกค้าสั่งเข้ามา
  useEffect(() => {
    if (tab !== 'orders') return undefined;
    refresh();
    const timer = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(timer);
  }, [tab, refresh]);

  async function changeStatus(order, status) {
    if (status === 'cancelled' && !window.confirm(`ยกเลิกออเดอร์ #${order.order_id} ใช่หรือไม่?`)) return;
    setBusyId(order.order_id);
    try {
      await api.updateOrderStatus(order.order_id, status);
      await refresh();
    } catch (e) {
      if (e.status === 401) return handleUnauthorized();
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  const visible = useMemo(() => {
    if (filter === 'all') return orders;
    if (filter === 'active') return orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
    return orders.filter((o) => o.status === filter);
  }, [orders, filter]);

  const countOf = (status) => orders.filter((o) => o.status === status).length;

  return (
    <div className="page wide">
      <header className="topbar">
        <h1>แดชบอร์ดพนักงาน</h1>
        <div className="topbar-right">
          <span className="chip">
            {user.username} · {user.role}
          </span>
          <button className="btn btn-ghost" onClick={handleUnauthorized}>
            ออกจากระบบ
          </button>
        </div>
      </header>

      <nav className="tabs">
        <button className={tab === 'orders' ? 'tab tab-active' : 'tab'} onClick={() => setTab('orders')}>
          ออเดอร์
        </button>
        {user.role === 'admin' && (
          <button className={tab === 'menu' ? 'tab tab-active' : 'tab'} onClick={() => setTab('menu')}>
            จัดการเมนู
          </button>
        )}
        <Link to="/" className="tab">
          หน้าลูกค้า
        </Link>
      </nav>

      {tab === 'menu' && <MenuManager onUnauthorized={handleUnauthorized} />}

      {tab === 'orders' && (
        <>
          <div className="filters">
            <button className={filter === 'active' ? 'chip chip-active' : 'chip'} onClick={() => setFilter('active')}>
              ที่ต้องดำเนินการ ({orders.filter((o) => ACTIVE_STATUSES.includes(o.status)).length})
            </button>
            {Object.keys(STATUS_LABEL).map((s) => (
              <button key={s} className={filter === s ? 'chip chip-active' : 'chip'} onClick={() => setFilter(s)}>
                {STATUS_LABEL[s]} ({countOf(s)})
              </button>
            ))}
            <button className={filter === 'all' ? 'chip chip-active' : 'chip'} onClick={() => setFilter('all')}>
              ทั้งหมด ({orders.length})
            </button>
          </div>

          {error && <p className="error">{error}</p>}
          {loading && <p className="muted">กำลังโหลดออเดอร์...</p>}
          {!loading && visible.length === 0 && <p className="muted">ไม่มีออเดอร์ในหมวดนี้</p>}

          <div className="order-grid">
            {visible.map((order) => {
              const next = NEXT_STEP[order.status];
              const busy = busyId === order.order_id;
              return (
                <article key={order.order_id} className="card order-card">
                  <header className="order-head">
                    <strong>
                      #{order.order_id} · โต๊ะ {order.table_id}
                    </strong>
                    <StatusBadge status={order.status} />
                  </header>
                  <div className="muted small">
                    {ORDER_TYPE_LABEL[order.order_type] || order.order_type} ·{' '}
                    {new Date(order.order_date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                    {order.payment_method ? ` · ${PAYMENT_LABEL[order.payment_method] || order.payment_method}` : ''}
                  </div>

                  <ul className="order-items">
                    {order.items.map((item) => (
                      <li key={item.order_item_id}>
                        <span>
                          {item.item_name} × {item.quantity}
                        </span>
                        <span>{formatBaht(item.subtotal)}</span>
                      </li>
                    ))}
                  </ul>

                  {order.special_request && <p className="note">📝 {order.special_request}</p>}

                  <div className="total-row">
                    <span>รวม</span>
                    <strong>{formatBaht(order.total_price)}</strong>
                  </div>

                  <div className="actions">
                    {next && (
                      <button className="btn btn-primary" disabled={busy} onClick={() => changeStatus(order, next.status)}>
                        {next.label}
                      </button>
                    )}
                    {CANCELLABLE.includes(order.status) && (
                      <button className="btn btn-danger" disabled={busy} onClick={() => changeStatus(order, 'cancelled')}>
                        ยกเลิก
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
