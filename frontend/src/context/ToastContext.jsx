import { createContext, useCallback, useContext, useRef, useState } from 'react';

const ToastContext = createContext(null);
let idSeq = 0;

const TYPE_CLS = {
  success: 'bg-gradient-to-br from-green-600 to-green-700',
  error: 'bg-gradient-to-br from-red-600 to-red-700',
  info: 'bg-gradient-to-br from-sky-600 to-sky-700',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const toast = useCallback(
    (message, type = 'success', duration = 3200) => {
      const id = ++idSeq;
      setToasts((t) => [...t, { id, message, type }]);
      timers.current[id] = setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  const helpers = {
    toast,
    success: (m) => toast(m, 'success'),
    error: (m) => toast(m, 'error', 4200),
    info: (m) => toast(m, 'info'),
  };

  return (
    <ToastContext.Provider value={helpers}>
      {children}
      <div className="fixed right-4 top-20 z-[200] flex max-w-[min(22rem,calc(100vw-2rem))] flex-col gap-2.5" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast-anim flex cursor-pointer items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg ${TYPE_CLS[t.type]}`}
            onClick={() => dismiss(t.id)}
          >
            <span className="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full bg-white/25 text-xs">
              {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}
            </span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

/** Unwrap a readable message from an axios error */
export const errMsg = (err, fallback = 'Something went wrong') =>
  err?.response?.data?.message || err?.message || fallback;
