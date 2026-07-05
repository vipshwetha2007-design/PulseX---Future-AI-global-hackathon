import { createContext, useCallback, useContext, useRef, useState } from "react";
import { CheckCircle2, XCircle, Clock, Cpu, AlertTriangle, X } from "lucide-react";

const ToastContext = createContext(null);

const TONE_META = {
  success: { icon: CheckCircle2, cls: "border-vital/30 bg-vital/10 text-vital" },
  error: { icon: XCircle, cls: "border-pulse/30 bg-pulse/10 text-pulse" },
  warning: { icon: AlertTriangle, cls: "border-amber/30 bg-amber/10 text-amber" },
  expired: { icon: Clock, cls: "border-amber/30 bg-amber/10 text-amber" },
  ai: { icon: Cpu, cls: "border-mist/30 bg-surface2 text-mist" },
};

// Minimal in-app toast system — the project has no toast library installed,
// and pulling one in for a single portal isn't worth the new dependency.
// Purely presentational + auto-dismiss; carries no sensitive patient data.
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (message, tone = "success", timeout = 5000) => {
      const id = ++counter.current;
      setToasts((t) => [...t, { id, message, tone }]);
      if (timeout) setTimeout(() => dismiss(id), timeout);
      return id;
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm px-4 sm:px-0">
        {toasts.map((t) => {
          const meta = TONE_META[t.tone] || TONE_META.success;
          const Icon = meta.icon;
          return (
            <div
              key={t.id}
              className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-md bg-surface/95 ${meta.cls} animate-[fadeIn_0.15s_ease-out]`}
              role="status"
            >
              <Icon size={16} className="shrink-0 mt-0.5" />
              <p className="text-sm text-paper flex-1 leading-snug">{t.message}</p>
              <button onClick={() => dismiss(t.id)} className="text-mist hover:text-paper transition shrink-0">
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
