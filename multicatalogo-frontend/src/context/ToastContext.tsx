// src/context/ToastContext.tsx
import { useState, useCallback, type ReactNode } from 'react';
import { ToastContext, type ToastItem } from './toast';

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newToast: ToastItem = { ...toast, id };
    setToasts((prev) => [...prev.slice(-3), newToast]);

    const timer = setTimeout(() => {
      removeToast(id);
    }, toast.duration ?? 3500);

    return () => clearTimeout(timer);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      {/* Toast Floating Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-xl p-4 shadow-xl border backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 flex items-start gap-3 ${
              t.type === 'error'
                ? 'bg-rose-900/95 text-white border-rose-700'
                : t.type === 'warning'
                ? 'bg-amber-900/95 text-white border-amber-700'
                : 'bg-slate-900/95 text-white border-slate-700'
            }`}
          >
            <span className="text-xl shrink-0">
              {t.type === 'error' ? '❌' : t.type === 'warning' ? '⚠️' : t.type === 'info' ? 'ℹ️' : '✨'}
            </span>
            <div className="flex-1 min-w-0">
              {t.title && <p className="font-bold text-sm leading-tight text-white">{t.title}</p>}
              <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">{t.message}</p>
              {t.actionText && t.onAction && (
                <button
                  type="button"
                  onClick={() => {
                    t.onAction?.();
                    removeToast(t.id);
                  }}
                  className="mt-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                >
                  {t.actionText} →
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-white text-xs shrink-0 p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
