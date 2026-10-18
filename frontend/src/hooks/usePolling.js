import { useEffect, useRef } from 'react';

// เรียก callback ซ้ำเป็นช่วงๆ (polling) ใช้ร่วมกันทั้งหน้ากระดานพนักงานและหน้าติดตามของลูกค้า
// - เรียกทันทีหนึ่งครั้งตอนเริ่ม แล้วรอ intervalMs หลัง "เสร็จ" แต่ละรอบ (ไม่ยิงซ้อนถ้า request ช้า)
// - หยุดถามเมื่อแท็บถูกซ่อน (ลดภาระ server) และถามทันทีที่กลับมาเปิดแท็บ
// - enabled=false จะหยุดทั้งหมด (เช่น ออเดอร์จบแล้ว)
export function usePolling(callback, intervalMs, enabled = true) {
  const saved = useRef(callback);
  useEffect(() => {
    saved.current = callback; // ใช้ callback ล่าสุดเสมอ โดยไม่ต้องเริ่ม timer ใหม่
  }, [callback]);

  useEffect(() => {
    if (!enabled) return undefined;
    let active = true;
    let inFlight = false;
    let timer;

    const tick = async () => {
      if (!active || inFlight) return;
      inFlight = true;
      try {
        if (!document.hidden) await saved.current();
      } catch {
        // callback จัดการ error ของตัวเองแล้ว
      } finally {
        inFlight = false;
      }
      if (active) timer = setTimeout(tick, intervalMs);
    };

    const onVisibilityChange = () => {
      if (!document.hidden) {
        clearTimeout(timer);
        tick();
      }
    };

    tick();
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      active = false;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [intervalMs, enabled]);
}
