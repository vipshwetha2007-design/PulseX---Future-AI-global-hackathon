import { useEffect, useState } from "react";
import { Clock, AlertTriangle } from "lucide-react";

function formatRemaining(ms) {
  if (ms <= 0) return "Expired";
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function AccessCountdown({ expiresAt, onExpire }) {
  const [remainingMs, setRemainingMs] = useState(() => new Date(expiresAt) - Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      const ms = new Date(expiresAt) - Date.now();
      setRemainingMs(ms);
      if (ms <= 0) {
        clearInterval(interval);
        onExpire?.();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const expired = remainingMs <= 0;
  const critical = !expired && remainingMs < 60000;
  const warning = !expired && !critical && remainingMs < 5 * 60000;

  const tone = expired || critical ? "text-pulse border-pulse/30 bg-pulse/10" : warning ? "text-amber border-amber/30 bg-amber/10" : "text-vital border-vital/30 bg-vital/10";

  return (
    <div className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 font-mono text-sm ${tone}`}>
      {warning || critical || expired ? <AlertTriangle size={14} /> : <Clock size={14} />}
      <span>{expired ? "Access expired" : `${formatRemaining(remainingMs)} remaining`}</span>
    </div>
  );
}
