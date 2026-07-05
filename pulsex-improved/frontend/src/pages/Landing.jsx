import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PulseLine from "../components/PulseLine";
import {
  HeartPulse,
  Stethoscope,
  Ambulance,
  ShieldCheck,
  Lock,
  Timer,
  QrCode,
  ArrowRight,
  Sparkles,
  ScanLine,
  FileWarning,
} from "lucide-react";

const ROLES = [
  { key: "patient", label: "Patient", desc: "Manage your record, QR access, and consent", icon: HeartPulse, to: "/login/patient", tone: "vital" },
  { key: "doctor", label: "Doctor", desc: "Request emergency access, document care", icon: Stethoscope, to: "/login/doctor", tone: "vital" },
  { key: "paramedic", label: "Ambulance", desc: "Scan for critical info in seconds", icon: Ambulance, to: "/login/paramedic", tone: "pulse" },
  { key: "admin", label: "Admin", desc: "Verify hospitals, monitor the system", icon: ShieldCheck, to: "/login/admin", tone: "amber" },
];

const STATS = [
  { value: "< 8s", label: "Average scan-to-record time" },
  { value: "30 min", label: "Max emergency access window" },
  { value: "100%", label: "Access attempts logged" },
];

const STEPS = [
  { icon: ScanLine, title: "Scan or search", desc: "A paramedic scans a QR/NFC tag, or a doctor searches by patient ID." },
  { icon: Sparkles, title: "AI scores the request", desc: "Context, role, and urgency are scored in real time to decide scope." },
  { icon: Timer, title: "Scoped access opens", desc: "Only clinically relevant fields unlock, on a strict countdown." },
  { icon: FileWarning, title: "Everything is logged", desc: "The patient sees exactly who looked, what they saw, and for how long." },
];

const toneMap = {
  vital: { text: "text-vital", bg: "bg-vital/10", border: "border-vital/30", ring: "group-hover:shadow-glow" },
  pulse: { text: "text-pulse", bg: "bg-pulse/10", border: "border-pulse/30", ring: "group-hover:shadow-glow-pulse" },
  amber: { text: "text-amber", bg: "bg-amber/10", border: "border-amber/30", ring: "" },
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.55, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] } }),
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-mesh relative overflow-x-clip">
      <div className="absolute inset-0 bg-grid pointer-events-none" aria-hidden="true" />
      <div
        className="absolute top-[-10%] left-[-5%] w-[36rem] h-[36rem] rounded-full bg-vital/10 blur-3xl animate-float pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute top-[10%] right-[-10%] w-[28rem] h-[28rem] rounded-full bg-pulse/10 blur-3xl animate-float pointer-events-none"
        style={{ animationDelay: "3s" }}
        aria-hidden="true"
      />

      {/* Header */}
      <header className="sticky top-0 z-30 glass border-b border-line">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HeartPulse className="text-pulse" size={22} strokeWidth={2.5} />
            <span className="font-display font-semibold text-xl tracking-tight">PulseX AI</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs font-mono text-mist border border-line rounded-full px-3 py-1">
              ROOKIE CODERS — hackathon build
            </span>
            <Link to="/login/patient">
              <span className="text-sm font-medium text-paper hover:text-vital transition px-3 py-1.5">Sign in</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative max-w-6xl mx-auto px-6 pt-20 pb-14">
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0} className="max-w-2xl">
          <div className="inline-flex items-center gap-2 font-mono text-xs text-vital tracking-widest uppercase mb-5 px-3 py-1.5 rounded-full border border-vital/30 bg-vital/5">
            <Sparkles size={12} /> Emergency health records, gated by AI
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.08]">
            Locked by default.
            <br />
            Opened <span className="text-gradient">deliberately.</span>
            <br />
            Closed <span className="text-pulse">automatically.</span>
          </h1>
          <p className="mt-6 text-mist text-lg leading-relaxed max-w-xl">
            When a doctor or paramedic needs a patient's record in an emergency, PulseX AI scores the request,
            grants only what's clinically necessary, starts a 30-minute clock, and logs every second of it.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/login/patient">
              <span className="group inline-flex items-center gap-2 bg-vital text-ink font-medium text-sm rounded-lg px-5 py-3 hover:brightness-110 hover:shadow-glow transition-all">
                Get started <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
            <Link to="/register/patient">
              <span className="inline-flex items-center gap-2 border border-line text-paper font-medium text-sm rounded-lg px-5 py-3 hover:border-vital/50 hover:text-vital transition-all">
                Create a patient account
              </span>
            </Link>
          </div>
        </motion.div>
        <PulseLine height={48} className="mt-12 opacity-80" />

        {/* Stats strip */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={1}
          className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          {STATS.map((s) => (
            <div key={s.label} className="glass border border-line rounded-xl px-5 py-4">
              <div className="font-display text-2xl font-semibold text-paper">{s.value}</div>
              <div className="text-xs text-mist mt-1">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Role picker */}
      <section className="max-w-6xl mx-auto px-6 py-14">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="font-display text-lg font-medium text-mist mb-5"
        >
          Sign in as
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ROLES.map((r, i) => {
            const t = toneMap[r.tone];
            return (
              <motion.div
                key={r.key}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
                custom={i}
              >
                <Link
                  to={r.to}
                  className={`group relative overflow-hidden bg-surface border border-line rounded-xl p-5 hover:border-vital/40 hover:-translate-y-1 transition-all duration-300 flex flex-col gap-3 h-full ${t.ring}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.bg} ${t.text} transition-transform duration-300 group-hover:scale-110`}>
                    <r.icon size={20} strokeWidth={2} />
                  </div>
                  <div>
                    <div className="font-medium">{r.label}</div>
                    <div className="text-sm text-mist mt-1 leading-snug">{r.desc}</div>
                  </div>
                  <span className={`text-xs ${t.text} opacity-0 group-hover:opacity-100 transition mt-auto inline-flex items-center gap-1`}>
                    Enter <ArrowRight size={12} />
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-6 py-14">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="font-display text-lg font-medium text-mist mb-8"
        >
          How an emergency grant works
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.title}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              custom={i}
              className="relative"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-surface2 border border-line flex items-center justify-center text-vital">
                  <s.icon size={16} />
                </div>
                <span className="font-mono text-xs text-mist">0{i + 1}</span>
              </div>
              <div className="font-medium">{s.title}</div>
              <div className="text-sm text-mist mt-1 leading-relaxed">{s.desc}</div>
              {i < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-[18px] left-[calc(100%-0.5rem)] w-6 h-px bg-line" />
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Feature strip */}
      <section className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Feature icon={QrCode} title="QR & NFC" desc="Encrypted, revocable tokens carry only an identifier — never the full record." />
        <Feature icon={Timer} title="30-minute window" desc="Every emergency grant expires automatically. No standing access, ever." />
        <Feature icon={Lock} title="Scoped by role" desc="Ambulance sees blood group and allergies. Nothing about billing, nothing about mental health." />
      </section>

      {/* CTA banner */}
      <section className="max-w-6xl mx-auto px-6 py-6">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="glass border border-vital/20 rounded-2xl px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-premium"
        >
          <div>
            <h3 className="font-display text-xl font-semibold">Ready to secure your emergency record?</h3>
            <p className="text-mist text-sm mt-1.5">Set up your account in under a minute — no card required.</p>
          </div>
          <Link to="/register/patient" className="shrink-0">
            <span className="group inline-flex items-center gap-2 bg-vital text-ink font-medium text-sm rounded-lg px-5 py-3 hover:brightness-110 hover:shadow-glow transition-all">
              Create your account <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        </motion.div>
      </section>

      <footer className="border-t border-line mt-8">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-mist font-mono">
          <span>PulseX AI — AI-Powered Secure Emergency Health Record & Intelligent Access Management Platform</span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-vital" /> Built for national hackathon demo
          </span>
        </div>
      </footer>
    </div>
  );
}

function Feature({ icon: Icon, title, desc }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      className="border-t border-line pt-5"
    >
      <div className="w-9 h-9 rounded-lg bg-surface2 border border-line flex items-center justify-center text-mist">
        <Icon size={16} />
      </div>
      <div className="font-medium mt-3">{title}</div>
      <div className="text-sm text-mist mt-1 leading-relaxed">{desc}</div>
    </motion.div>
  );
}
