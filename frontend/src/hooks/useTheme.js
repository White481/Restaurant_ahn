import { useCallback, useEffect, useState } from 'react';

const KEY = 'oms_theme';

// ธีมฝั่งพนักงาน: 'system' (ตามเครื่อง) | 'light' | 'dark'
// ใส่/ถอด class "dark" บน <html> ตอนอยู่ในหน้าพนักงาน พอออกไปหน้าลูกค้า class จะถูกถอดคืน (ลูกค้าเห็นโหมดสว่างเสมอ)
export function useTheme() {
  const [choice, setChoiceState] = useState(() => localStorage.getItem(KEY) || 'system');

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = choice === 'dark' || (choice === 'system' && media.matches);
      document.documentElement.classList.toggle('dark', dark);
    };
    apply();
    media.addEventListener('change', apply);
    return () => {
      media.removeEventListener('change', apply);
      document.documentElement.classList.remove('dark');
    };
  }, [choice]);

  const setChoice = useCallback((next) => {
    localStorage.setItem(KEY, next);
    setChoiceState(next);
  }, []);

  return { choice, setChoice };
}
