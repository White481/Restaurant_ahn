import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

// ข้อความแจ้งเตือนลอยชั่วคราว (แทนข้อความแดงในหน้า): toast.error('...') / toast.success('...')
const ToastContext = createContext(null);

const STYLE = {
  success: 'bg-green-700 text-white',
  error: 'bg-red-700 text-white'
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const remove = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const push = useCallback(
    (type, message) => {
      const id = ++nextId.current;
      setToasts((list) => [...list.slice(-3), { id, type, message }]);
      setTimeout(() => remove(id), 4500);
    },
    [remove]
  );

  const api = useMemo(() => ({ success: (m) => push('success', m), error: (m) => push('error', m) }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6"
      >
        {toasts.map((t) => (
          <div key={t.id} role="status" className={`pointer-events-auto max-w-md rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${STYLE[t.type]}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
