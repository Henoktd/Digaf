"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, variant: ToastVariant = "info") => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, message, variant }]);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]"
      >
        {toasts.map((t) => (
          <ToastBubble key={t.id} item={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastBubble({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: number) => void;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => onDismiss(item.id), 4000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [item.id, onDismiss]);

  const base = "flex items-start gap-3 rounded-xl px-4 py-3 text-sm shadow-lg border";
  const variants: Record<ToastVariant, string> = {
    success: `${base} bg-emerald-50 border-emerald-200 text-emerald-900`,
    error: `${base} bg-rose-50 border-rose-200 text-rose-900`,
    info: `${base} bg-white border-slate-200 text-slate-800`,
  };

  const icons: Record<ToastVariant, string> = {
    success: "✓",
    error: "✕",
    info: "i",
  };

  const iconColors: Record<ToastVariant, string> = {
    success: "bg-emerald-500 text-white",
    error: "bg-rose-500 text-white",
    info: "bg-slate-500 text-white",
  };

  return (
    <div className={variants[item.variant]}>
      <span
        className={`flex-none mt-0.5 h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold ${iconColors[item.variant]}`}
      >
        {icons[item.variant]}
      </span>
      <span className="flex-1 leading-snug">{item.message}</span>
      <button
        onClick={() => onDismiss(item.id)}
        aria-label="Dismiss notification"
        className="flex-none rounded text-xs opacity-50 hover:opacity-100 mt-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:opacity-100"
      >
        ✕
      </button>
    </div>
  );
}

export function useToast(): (message: string, variant?: ToastVariant) => void {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx.toast;
}
