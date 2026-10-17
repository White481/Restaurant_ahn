import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api.js';
import { STATUS_FLOW, STATUS_LABEL } from '../components/status.js';

const FINAL = ['completed', 'cancelled'];

export default function OrderStatusPage() {
  const { id } = useParams();
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');

  // polling: ถามสถานะซ้ำทุก 4 วินาทีจนกว่าออเดอร์จะจบ
  // (วิธีที่ง่ายที่สุดสำหรับ "live tracking"; ระบบจริงที่ต้องการทันใจกว่านี้จะใช้ WebSocket)
  useEffect(() => {
    let active = true;
    let timer;

    async function load() {
      try {
        const data = await api.getOrderStatus(id);
        if (!active) return;
        setStatus(data.status);
        setError('');
        if (!FINAL.includes(data.status)) timer = setTimeout(load, 4000);
      } catch (e) {
        if (!active) return;
        setError(e.message);
        if (e.status !== 404) timer = setTimeout(load, 8000); // เน็ตหลุดชั่วคราว: ลองใหม่เรื่อยๆ
      }
    }

    load();
    return () => {
      active = false; // ล้าง timer ตอนออกจากหน้า ไม่ให้ยิง request ค้าง
      clearTimeout(timer);
    };
  }, [id]);

  const currentIndex = STATUS_FLOW.indexOf(status);

  return (
    <div className="page customer">
      <header className="topbar">
        <h1>ออเดอร์ #{id}</h1>
      </header>

      {error && <p className="error">{error}</p>}
      {!status && !error && <p className="muted">กำลังโหลดสถานะ...</p>}

      {status === 'cancelled' && <p className="banner banner-cancel">ออเดอร์นี้ถูกยกเลิก กรุณาติดต่อพนักงาน</p>}

      {status && status !== 'cancelled' && (
        <ol className="steps">
          {STATUS_FLOW.map((step, index) => {
            const state = index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'todo';
            return (
              <li key={step} className={`step step-${state}`} aria-current={state === 'current' ? 'step' : undefined}>
                <span className="dot">{state === 'done' ? '✓' : index + 1}</span>
                <span>{STATUS_LABEL[step]}</span>
              </li>
            );
          })}
        </ol>
      )}

      {status === 'completed' && <p className="banner banner-ok">ขอบคุณที่ใช้บริการ</p>}

      <Link className="btn btn-primary" to="/">
        สั่งเพิ่ม
      </Link>
    </div>
  );
}
