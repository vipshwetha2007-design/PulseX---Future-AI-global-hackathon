import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function Card({ children, className = "" }) {
  return (
    <div className={`bg-surface border border-line rounded-xl p-5 ${className}`}>
      {children}
    </div>
  );
}

const badgeColors = {
  approved: "bg-vital/10 text-vital border-vital/30",
  pending_review: "bg-amber/10 text-amber border-amber/30",
  rejected: "bg-pulse/10 text-pulse border-pulse/30",
  low: "bg-vital/10 text-vital border-vital/30",
  monitor: "bg-amber/10 text-amber border-amber/30",
  elevated: "bg-pulse/10 text-pulse border-pulse/30",
  critical: "bg-pulse/20 text-pulse border-pulse/40",
  high: "bg-pulse/10 text-pulse border-pulse/30",
  medium: "bg-amber/10 text-amber border-amber/30",
  vital: "bg-vital/10 text-vital border-vital/30",
  default: "bg-line/40 text-mist border-line",
};

export function Badge({ children, tone = "default" }) {
  const cls = badgeColors[tone] || badgeColors.default;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono border ${cls}`}>
      {children}
    </span>
  );
}

export function Button({ children, variant = "primary", className = "", ...props }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-medium text-sm transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";
  const variants = {
    primary: "bg-vital text-ink hover:brightness-110 shadow-[0_0_0_1px_rgba(47,230,196,0.15)] hover:shadow-glow",
    danger: "bg-pulse text-ink hover:brightness-110 hover:shadow-glow-pulse",
    ghost: "bg-transparent border border-line text-paper hover:border-vital/50 hover:text-vital",
    subtle: "bg-surface2 text-paper hover:bg-line/50",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wide text-mist mb-1.5">{label}</span>
      {children}
    </label>
  );
}

export const inputCls =
  "w-full bg-surface2 border border-line rounded-lg px-3 py-2.5 text-sm text-paper placeholder:text-mist/60 focus:border-vital/60 outline-none transition";

export function StatBox({ label, value, tone = "default" }) {
  const toneCls = { default: "text-paper", vital: "text-vital", pulse: "text-pulse", amber: "text-amber" }[tone];
  return (
    <div className="bg-surface2 border border-line rounded-lg px-4 py-3">
      <div className={`font-mono text-2xl font-medium ${toneCls}`}>{value}</div>
      <div className="text-xs text-mist mt-1">{label}</div>
    </div>
  );
}

export function ErrorText({ children }) {
  if (!children) return null;
  return <p className="text-pulse text-sm bg-pulse/10 border border-pulse/30 rounded-lg px-3 py-2">{children}</p>;
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-mist text-sm mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Skeleton({ className = "" }) {
  return <div className={`skeleton-shimmer bg-surface2 rounded-lg ${className}`} />;
}

export function SkeletonCard() {
  return (
    <Card>
      <Skeleton className="h-4 w-1/3 mb-3" />
      <Skeleton className="h-3 w-2/3 mb-2" />
      <Skeleton className="h-3 w-1/2" />
    </Card>
  );
}

export function EmptyState({ icon: Icon, title, desc, action }) {
  return (
    <div className="border border-dashed border-line rounded-xl px-6 py-12 text-center flex flex-col items-center gap-3">
      {Icon && <Icon className="text-mist" size={28} strokeWidth={1.5} />}
      <div>
        <p className="font-medium text-paper">{title}</p>
        {desc && <p className="text-sm text-mist mt-1 max-w-sm mx-auto">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="border border-pulse/30 bg-pulse/5 rounded-xl px-6 py-8 text-center flex flex-col items-center gap-3">
      <p className="text-sm text-pulse">{message || "Something went wrong loading this data."}</p>
      {onRetry && (
        <Button variant="ghost" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface border border-line rounded-xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-mist hover:text-paper transition text-xl leading-none">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Toggle({ checked, onChange, label, desc }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <div className="text-sm font-medium text-paper">{label}</div>
        {desc && <div className="text-xs text-mist mt-0.5">{desc}</div>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition shrink-0 ${checked ? "bg-vital" : "bg-line"}`}
        aria-pressed={checked}
        aria-label={label}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-ink transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

export function PasswordInput({ className = "", ...props }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input type={show ? "text" : "password"} className={`${inputCls} pr-10 ${className}`} {...props} />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        tabIndex={-1}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-mist hover:text-paper transition"
      >
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}

export function Textarea({ className = "", ...props }) {
  return <textarea className={`${inputCls} resize-none ${className}`} rows={3} {...props} />;
}

export function IconButton({ icon: Icon, className = "", ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-mist hover:text-paper hover:bg-surface2 transition ${className}`}
      {...props}
    >
      <Icon size={15} />
    </button>
  );
}

/* ---------------------------------------------------------------------- */
/* Admin-grade primitives — glassmorphism, animated counters, data tables */
/* ---------------------------------------------------------------------- */

// Frosted glass surface with a soft gradient wash, used for premium/executive
// panels (KPI hero cards, section headers) rather than every card — keeps
// the effect feeling special instead of default.
export function GlassCard({ children, className = "", glow = false }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-line/80 bg-surface/60 backdrop-blur-xl shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset] ${
        glow ? "shadow-glow" : ""
      } ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-transparent" />
      <div className="relative">{children}</div>
    </div>
  );
}

// Counts up from 0 -> value whenever value changes. Purely cosmetic; falls
// back to the static number instantly if the user prefers reduced motion.
export function AnimatedNumber({ value = 0, duration = 900, format }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef(null);
  const prefersReduced = useRef(
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    const target = Number(value) || 0;
    if (prefersReduced.current) {
      setDisplay(target);
      return;
    }
    const start = performance.now();
    const from = 0;
    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(Math.round(from + (target - from) * eased));
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    }
    raf.current = requestAnimationFrame(tick);
    return () => raf.current && cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  const shown = format ? format(display) : display.toLocaleString();
  return <>{shown}</>;
}

const kpiTrendCls = { up: "text-vital", down: "text-pulse", flat: "text-mist" };

// Executive KPI tile: big animated number, label, optional trend delta and icon.
export function KpiCard({ label, value, icon: Icon, trend, trendLabel, tone = "vital", format, className = "" }) {
  const toneRing = { vital: "text-vital bg-vital/10", pulse: "text-pulse bg-pulse/10", amber: "text-amber bg-amber/10", default: "text-paper bg-surface2" }[tone];
  return (
    <GlassCard className={`p-5 hover:border-vital/30 transition-colors duration-300 group ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-mist mb-2">{label}</p>
          <div className="font-display font-semibold text-3xl tracking-tight text-paper">
            <AnimatedNumber value={value} format={format} />
          </div>
          {trend !== undefined && (
            <div className={`mt-2 inline-flex items-center gap-1 text-xs font-medium ${kpiTrendCls[trend >= 0 ? "up" : "down"]}`}>
              {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}% {trendLabel && <span className="text-mist font-normal">{trendLabel}</span>}
            </div>
          )}
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${toneRing}`}>
            <Icon size={18} />
          </div>
        )}
      </div>
    </GlassCard>
  );
}

export function SectionHeading({ icon: Icon, title, action }) {
  return (
    <div className="flex items-center justify-between gap-4 mb-4">
      <div className="flex items-center gap-2 text-mist text-xs uppercase tracking-wide">
        {Icon && <Icon size={14} />} {title}
      </div>
      {action}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = "Search…", className = "" }) {
  return (
    <div className={`relative flex-1 ${className}`}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2 text-mist pointer-events-none">
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
        <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <input className={`${inputCls} pl-9`} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export function Pill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
        active ? "bg-vital/10 text-vital border-vital/30" : "border-line text-mist hover:text-paper hover:border-mist/40"
      }`}
    >
      {children}
    </button>
  );
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 border-b border-line mb-6 overflow-x-auto">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`relative px-4 py-2.5 text-sm font-medium whitespace-nowrap transition ${
            active === t.key ? "text-paper" : "text-mist hover:text-paper"
          }`}
        >
          {t.icon && <t.icon size={14} className="inline mr-1.5 -mt-0.5" />}
          {t.label}
          {active === t.key && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-vital rounded-full" />}
        </button>
      ))}
    </div>
  );
}

// Minimal table shell — plain <table> with matching Th/Td so every admin
// list looks the same without re-implementing borders/hover states each time.
export function Table({ children, className = "" }) {
  return (
    <div className={`overflow-x-auto -mx-5 px-5 ${className}`}>
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  );
}

export function Th({ children, className = "" }) {
  return (
    <th className={`text-left text-[11px] uppercase tracking-wider text-mist font-medium px-3 py-2.5 border-b border-line ${className}`}>
      {children}
    </th>
  );
}

export function Td({ children, className = "" }) {
  return <td className={`px-3 py-3 border-b border-line/60 text-paper align-middle ${className}`}>{children}</td>;
}

export function Tr({ children, className = "" }) {
  return <tr className={`hover:bg-surface2/60 transition-colors ${className}`}>{children}</tr>;
}

export function Pagination({ page, pageCount, onChange }) {
  if (pageCount <= 1) return null;
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === pageCount || Math.abs(p - page) <= 1
  );
  let last = 0;
  return (
    <div className="flex items-center justify-center gap-1 pt-4">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="px-2.5 py-1.5 rounded-lg text-xs text-mist hover:text-paper hover:bg-surface2 transition disabled:opacity-30 disabled:pointer-events-none"
      >
        Prev
      </button>
      {pages.map((p) => {
        const gap = p - last > 1;
        last = p;
        return (
          <span key={p} className="flex items-center gap-1">
            {gap && <span className="px-1 text-mist text-xs">…</span>}
            <button
              onClick={() => onChange(p)}
              className={`w-7 h-7 rounded-lg text-xs font-mono transition ${
                p === page ? "bg-vital/15 text-vital border border-vital/30" : "text-mist hover:text-paper hover:bg-surface2"
              }`}
            >
              {p}
            </button>
          </span>
        );
      })}
      <button
        onClick={() => onChange(Math.min(pageCount, page + 1))}
        disabled={page === pageCount}
        className="px-2.5 py-1.5 rounded-lg text-xs text-mist hover:text-paper hover:bg-surface2 transition disabled:opacity-30 disabled:pointer-events-none"
      >
        Next
      </button>
    </div>
  );
}

export function usePagination(items, pageSize = 8) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const slice = items.slice((safePage - 1) * pageSize, safePage * pageSize);
  return { page: safePage, setPage, pageCount, slice };
}
