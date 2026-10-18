import { useEffect, useState } from 'react';

// คืนเวลาปัจจุบันที่อัปเดตทุก intervalMs (ใช้ทำนาฬิกา/ตัวจับเวลา โดยใช้ timer ตัวเดียวร่วมกันทั้งกระดาน)
export function useNow(intervalMs = 30000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}
