import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import Button from '../ui/Button.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import Skeleton from '../ui/Skeleton.jsx';
import { useToast } from '../ui/Toast.jsx';
import { FINISHED_STATUSES, PAYMENT_ROLES } from '../components/status.js';
import { useAlertSound } from '../hooks/useAlertSound.js';
import { useLang } from '../i18n/LanguageContext.jsx';
import { useNow } from '../hooks/useNow.js';
import { usePolling } from '../hooks/usePolling.js';
import { useAuth } from './AuthContext.jsx';
import StaffLayout from './components/StaffLayout.jsx';
import OrderBoard from './components/OrderBoard.jsx';
import HistoryList from './components/HistoryList.jsx';
import CancelModal from './components/CancelModal.jsx';
import PaymentDialog from './components/PaymentDialog.jsx';
import ReceiptDialog from './components/ReceiptDialog.jsx';
import LiveIndicator from './components/LiveIndicator.jsx';
import SoundToggle from './components/SoundToggle.jsx';

const REFRESH_MS = 5000;
const FRESH_MS = 6000; // ไฮไลต์ออเดอร์ใหม่นานแค่ไหน

export default function OrdersPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useLang();
  const toast = useToast();
  const sound = useAlertSound();
  const now = useNow(15000); // ตัวจับเวลาบนการ์ดคลาดเคลื่อนได้ไม่เกินช่วงนี้

  const [orders, setOrders] = useState(null); // null = ยังไม่เคยโหลดสำเร็จ
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [view, setView] = useState('board');
  const [pending, setPending] = useState({}); // { orderId: สถานะที่กำลังเปลี่ยนไป } (optimistic update)
  const [freshIds, setFreshIds] = useState(() => new Set());
  const [cancelTarget, setCancelTarget] = useState(null);
  const [payTarget, setPayTarget] = useState(null); // ออเดอร์ที่กำลังรับชำระเงิน
  const [receiptOrder, setReceiptOrder] = useState(null); // ออเดอร์ที่เปิดดู/พิมพ์ใบเสร็จ
  const canPay = PAYMENT_ROLES.includes(user.role);

  const knownIds = useRef(null); // ออเดอร์ที่เคยเห็นแล้ว ใช้ตรวจว่ามี "ออเดอร์ใหม่" เข้ามาไหม
  const freshTimers = useRef([]);

  useEffect(() => {
    const timers = freshTimers.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  // token หมดอายุ/ไม่ถูกต้อง (401) -> ออกจากระบบแล้วกลับไปหน้า login
  const handleUnauthorized = useCallback(() => {
    logout();
    navigate('/staff/login', { replace: true });
  }, [logout, navigate]);

  const playSound = sound.play;
  const refresh = useCallback(async () => {
    try {
      const data = await api.getOrders();

      if (knownIds.current) {
        const added = data.filter((o) => o.status === 'placed' && !knownIds.current.has(o.order_id));
        if (added.length > 0) {
          const ids = added.map((o) => o.order_id);
          setFreshIds((prev) => new Set([...prev, ...ids]));
          freshTimers.current.push(
            setTimeout(() => setFreshIds((prev) => new Set([...prev].filter((id) => !ids.includes(id)))), FRESH_MS)
          );
          playSound();
        }
      }
      knownIds.current = new Set(data.map((o) => o.order_id));

      setOrders(data);
      setLastUpdated(Date.now());
      setError('');
    } catch (e) {
      if (e.status === 401) return handleUnauthorized();
      setError(e.message);
    }
  }, [handleUnauthorized, playSound]);

  // ดึงออเดอร์ตอนเปิดหน้า แล้วดึงซ้ำทุก 5 วินาที (หยุดเมื่อแท็บถูกซ่อน)
  usePolling(refresh, REFRESH_MS);

  // Optimistic update: การ์ดย้ายคอลัมน์ทันทีที่กด ไม่ต้องรอ server
  // ถ้า API ล้มเหลวจะย้อนกลับและแจ้งเตือน (pending ครอบข้อมูลจาก polling ไว้ระหว่างรอ จึงไม่กระพริบกลับไปสถานะเก่า)
  async function changeStatus(order, status) {
    const id = order.order_id;
    setPending((p) => ({ ...p, [id]: status }));
    try {
      await api.updateOrderStatus(id, status);
      await refresh();
    } catch (e) {
      if (e.status === 401) return handleUnauthorized();
      toast.error(t('orders.changeFail', { id, msg: e.message }));
    } finally {
      setPending((p) => {
        const { [id]: _removed, ...rest } = p;
        return rest;
      });
    }
  }

  // ปุ่มหลักบนการ์ด: "ปิดออเดอร์" (completed) ต้องผ่านหน้ารับชำระเงินเสมอ ขั้นอื่นเปลี่ยนสถานะได้เลย
  function handleAdvance(order, status) {
    if (status === 'completed') setPayTarget(order);
    else changeStatus(order, status);
  }

  // รับชำระเงิน: สำเร็จแล้วเปิดใบเสร็จทันที (เก็บข้อมูลที่เพิ่งบันทึกไว้ในตัวแปร ไม่ต้องรอ refresh)
  // ถ้าล้มเหลว โยน error ต่อให้หน้าต่างชำระเงินแสดงข้อความ
  async function confirmPayment(payload) {
    try {
      const result = await api.payOrder(payTarget.order_id, payload);
      const paid = {
        ...payTarget,
        status: 'completed',
        payment_method: payload.payment_method,
        amount_received: result.amount_received,
        paid_at: new Date().toISOString(),
        cashier_name: user.employee_name
      };
      setPayTarget(null);
      setReceiptOrder(paid);
      refresh();
    } catch (e) {
      if (e.status === 401) {
        handleUnauthorized();
        return;
      }
      throw e;
    }
  }

  async function confirmCancel(order) {
    setCancelTarget(null);
    await changeStatus(order, 'cancelled');
  }

  const shown = useMemo(
    () => (orders || []).map((o) => (pending[o.order_id] ? { ...o, status: pending[o.order_id] } : o)),
    [orders, pending]
  );
  const pendingIds = useMemo(() => new Set(Object.keys(pending).map(Number)), [pending]);
  const active = useMemo(() => shown.filter((o) => !FINISHED_STATUSES.includes(o.status)), [shown]);
  const finished = useMemo(() => shown.filter((o) => FINISHED_STATUSES.includes(o.status)), [shown]);

  const tabClass = (selected) =>
    `min-h-10 rounded-lg px-4 text-sm font-semibold ${
      selected ? 'bg-brand-600 text-white' : 'text-stone-600 hover:bg-stone-200 dark:text-stone-300 dark:hover:bg-stone-800'
    }`;

  return (
    <StaffLayout
      title={t('staff.title.orders')}
      headerRight={
        <>
          <LiveIndicator lastUpdated={lastUpdated} error={error} />
          <SoundToggle enabled={sound.enabled} onToggle={sound.toggle} />
        </>
      }
    >
      <div role="tablist" aria-label={t('orders.viewAria')} className="mb-4 inline-flex gap-1 rounded-xl bg-white p-1 dark:bg-stone-900">
        <button type="button" role="tab" aria-selected={view === 'board'} onClick={() => setView('board')} className={tabClass(view === 'board')}>
          {t('orders.tabBoard', { n: active.length })}
        </button>
        <button type="button" role="tab" aria-selected={view === 'history'} onClick={() => setView('history')} className={tabClass(view === 'history')}>
          {t('orders.tabHistory', { n: finished.length })}
        </button>
      </div>

      {orders === null && !error && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label={t('orders.loadingAria')}>
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      )}

      {orders === null && error && (
        <EmptyState icon="⚠️" title={t('orders.loadFail')} hint={error}>
          <Button onClick={refresh}>{t('common.retry')}</Button>
        </EmptyState>
      )}

      {orders !== null && view === 'board' && (
        <OrderBoard orders={active} now={now} freshIds={freshIds} pendingIds={pendingIds} canPay={canPay} onAdvance={handleAdvance} onCancel={setCancelTarget} />
      )}
      {orders !== null && view === 'history' && <HistoryList orders={finished} onReceipt={setReceiptOrder} />}

      <CancelModal order={cancelTarget} onClose={() => setCancelTarget(null)} onConfirm={confirmCancel} />
      {payTarget && <PaymentDialog key={payTarget.order_id} order={payTarget} onClose={() => setPayTarget(null)} onConfirm={confirmPayment} />}
      {receiptOrder && <ReceiptDialog key={receiptOrder.order_id} order={receiptOrder} onClose={() => setReceiptOrder(null)} />}
    </StaffLayout>
  );
}
