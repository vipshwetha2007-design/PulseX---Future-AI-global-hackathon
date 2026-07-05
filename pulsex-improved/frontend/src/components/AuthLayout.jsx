import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { HeartPulse, ShieldCheck } from "lucide-react";
import PulseLine from "./PulseLine";

/**
 * Shared premium auth shell used by Login + all Register pages.
 * Left: branded gradient panel with role context + trust signals.
 * Right: the actual form, dropped in as children.
 */
export default function AuthLayout({
  icon: RoleIcon = HeartPulse,
  eyebrow = "Secure access",
  title,
  subtitle,
  accent = "vital", // "vital" | "pulse" | "amber"
  points = [],
  children,
}) {
  const accentText = { vital: "text-vital", pulse: "text-pulse", amber: "text-amber" }[accent];
  const accentBg = { vital: "bg-vital/10", pulse: "bg-pulse/10", amber: "bg-amber/10" }[accent];
  const accentBorder = { vital: "border-vital/30", pulse: "border-pulse/30", amber: "border-amber/30" }[accent];

  return (
    <div className="min-h-screen flex bg-ink">
      {/* Brand panel */}
      <div className="hidden lg:flex lg:w-[44%] xl:w-[38%] relative overflow-hidden border-r border-line bg-mesh">
        <div className="absolute inset-0 bg-grid" aria-hidden="true" />
        <div
          className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-vital/10 blur-3xl animate-float"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-pulse/10 blur-3xl animate-float"
          style={{ animationDelay: "2s" }}
          aria-hidden="true"
        />
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 flex flex-col justify-between w-full px-12 py-12"
        >
          <Link to="/" className="flex items-center gap-2 w-fit">
            <HeartPulse className="text-pulse" size={22} strokeWidth={2.5} />
            <span className="font-display font-semibold text-xl tracking-tight">PulseX AI</span>
          </Link>

          <div>
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${accentBorder} ${accentBg} ${accentText} text-xs font-mono uppercase tracking-wider mb-6`}>
              <RoleIcon size={13} /> {eyebrow}
            </div>
            <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight max-w-sm">
              {title}
            </h2>
            {subtitle && <p className="text-mist mt-3 max-w-sm leading-relaxed">{subtitle}</p>}
            <PulseLine height={36} className="mt-8 opacity-70 max-w-xs" />

            {points.length > 0 && (
              <ul className="mt-8 space-y-3">
                {points.map((p, i) => (
                  <motion.li
                    key={p}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.15 + i * 0.08 }}
                    className="flex items-start gap-2.5 text-sm text-paper/90"
                  >
                    <ShieldCheck size={15} className={`mt-0.5 shrink-0 ${accentText}`} />
                    <span>{p}</span>
                  </motion.li>
                ))}
              </ul>
            )}
          </div>

          <p className="text-xs text-mist font-mono">
            AI-Powered Secure Emergency Health Record &amp; Intelligent Access Management Platform
          </p>
        </motion.div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative">
        <div className="absolute inset-0 lg:hidden bg-mesh opacity-60" aria-hidden="true" />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-sm"
        >
          <Link to="/" className="flex lg:hidden items-center gap-2 justify-center mb-8">
            <HeartPulse className="text-pulse" size={22} strokeWidth={2.5} />
            <span className="font-display font-semibold text-xl">PulseX AI</span>
          </Link>
          {children}
        </motion.div>
      </div>
    </div>
  );
}
