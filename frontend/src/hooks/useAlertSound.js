import { useCallback, useEffect, useRef, useState } from 'react';

const KEY = 'oms_sound';

// เสียงแจ้งเตือนออเดอร์ใหม่ (สร้างเสียงเองด้วย Web Audio ไม่ต้องมีไฟล์เสียง)
// เบราว์เซอร์ไม่อนุญาตให้เล่นเสียงจนกว่าผู้ใช้จะแตะ/คลิกหน้าเว็บอย่างน้อยหนึ่งครั้ง
// จึงให้พนักงานกดปุ่ม "เปิดเสียง" เอง และสร้าง AudioContext ตอนกดนั้น
export function useAlertSound() {
  const [enabled, setEnabled] = useState(() => localStorage.getItem(KEY) === '1');
  const enabledRef = useRef(enabled);
  const ctxRef = useRef(null);

  const ensureContext = useCallback(() => {
    if (!ctxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      ctxRef.current = new AudioCtx();
    }
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  const beep = useCallback(() => {
    const ctx = ensureContext();
    if (!ctx) return;
    [880, 1175].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + i * 0.18;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.17);
    });
  }, [ensureContext]);

  // เปิดเสียงค้างไว้จากครั้งก่อน แต่เพิ่งโหลดหน้าใหม่: รอให้ผู้ใช้แตะหน้าจอครั้งแรกเพื่อปลดล็อกเสียง
  useEffect(() => {
    if (!enabled) return undefined;
    const unlock = () => ensureContext();
    window.addEventListener('pointerdown', unlock, { once: true });
    return () => window.removeEventListener('pointerdown', unlock);
  }, [enabled, ensureContext]);

  const toggle = useCallback(() => {
    const next = !enabledRef.current;
    enabledRef.current = next;
    setEnabled(next);
    localStorage.setItem(KEY, next ? '1' : '0');
    if (next) beep(); // เล่นเสียงตัวอย่างให้รู้ว่าเปิดแล้ว (และปลดล็อกเสียงด้วยการกดครั้งนี้)
  }, [beep]);

  // play(): เรียกจากโค้ดอื่นตอนมีออเดอร์ใหม่ เล่นเฉพาะเมื่อเปิดเสียงไว้
  const play = useCallback(() => {
    if (enabledRef.current) beep();
  }, [beep]);

  return { enabled, toggle, play };
}
