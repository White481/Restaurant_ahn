import { useCallback, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api.js';
import { buttonClasses } from '../ui/Button.jsx';
import { usePolling } from '../hooks/usePolling.js';
import OrderStepper from './components/OrderStepper.jsx';

const FINAL = ['completed', 'cancelled'];

export default function OrderStatusPage() {
  const { id } = useParams();
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

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <div className="mx-auto max-w-md px-4 py-8">
        <h1 className="text-2xl font-bold">ออเดอร์ #{id}</h1>

        {error && (
          <p role="alert" className="mt-4 text-red-700">
            {error}
          </p>
        )}
        {!status && !error && <p className="mt-4 text-stone-500">กำลังโหลดสถานะ...</p>}

        {status === 'cancelled' && (
          <p className="mt-6 rounded-2xl bg-red-100 px-4 py-3 font-semibold text-red-800">ออเดอร์นี้ถูกยกเลิก กรุณาติดต่อพนักงาน</p>
        )}

        {status && status !== 'cancelled' && <OrderStepper status={status} />}

        {status && !FINAL.includes(status) && <p className="mb-4 text-sm text-stone-500">หน้านี้อัปเดตสถานะให้อัตโนมัติ</p>}

        {status === 'completed' && (
          <p className="mb-4 rounded-2xl bg-green-100 px-4 py-3 font-semibold text-green-800">ขอบคุณที่ใช้บริการ 🙏</p>
        )}

        <Link className={`${buttonClasses('primary', 'lg')} mt-2 w-full`} to="/">
          สั่งเพิ่ม
        </Link>
      </div>
    </div>
  );
}
