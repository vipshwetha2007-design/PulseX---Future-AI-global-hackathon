import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import PulseLine from "./PulseLine";
import {
  Activity,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  LayoutDashboard,
  FileText,
  Pill,
  FlaskConical,
  AlertTriangle,
  Scissors,
  QrCode,
  Nfc,
  Users,
  History,
  User,
  Bell,
  Stethoscope,
  Search,
  Siren,
  ShieldAlert,
  Ambulance,
  BarChart3,
  UsersRound,
  Building2,
  ScrollText,
  Cpu,
  ChevronDown,
} from "lucide-react";

const NAV = {
  patient: [
    { items: [{ to: "/patient", label: "Overview", icon: LayoutDashboard }] },
    {
      section: "Health Record",
      items: [
        { to: "/patient/records", label: "Medical Records", icon: FileText },
        { to: "/patient/prescriptions", label: "Prescriptions", icon: Pill },
        { to: "/patient/lab-reports", label: "Lab Reports", icon: FlaskConical },
        { to: "/patient/allergies", label: "Allergies", icon: AlertTriangle },
        { to: "/patient/surgeries", label: "Surgeries", icon: Scissors },
      ],
    },
    {
      section: "Security & Access",
      items: [
        { to: "/patient/qr", label: "QR Code", icon: QrCode },
        { to: "/patient/nfc", label: "NFC Card", icon: Nfc },
        { to: "/patient/contacts", label: "Emergency Contacts", icon: Users },
        { to: "/patient/consent", label: "Consent Settings", icon: ShieldCheck },
        { to: "/patient/history", label: "Access History", icon: History },
      ],
    },
    {
      section: "Account",
      items: [
        { to: "/patient/profile", label: "Profile", icon: User },
        { to: "/patient/notifications", label: "Notifications", icon: Bell },
      ],
    },
  ],
  doctor: [
    { items: [{ to: "/doctor", label: "Overview", icon: LayoutDashboard }] },
    {
      section: "Patients",
      items: [
        { to: "/doctor/patients", label: "Assigned Patients", icon: Users },
        { to: "/doctor/search", label: "Patient Search", icon: Search },
      ],
    },
    {
      section: "Emergency Access",
      items: [{ to: "/doctor/requests", label: "Emergency Requests", icon: Siren }],
    },
    {
      section: "Clinical Tools",
      items: [{ to: "/doctor/medication-safety", label: "Medication Safety AI", icon: ShieldAlert }],
    },
  ],
  paramedic: [{ items: [{ to: "/ambulance", label: "Scan Patient", icon: Ambulance }] }],
  admin: [
    {
      items: [
        { to: "/admin", label: "Overview", icon: LayoutDashboard },
        { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
      ],
    },
    {
      section: "Management",
      items: [
        { to: "/admin/users", label: "User Management", icon: UsersRound },
        { to: "/admin/hospitals", label: "Hospitals & Doctors", icon: Building2 },
      ],
    },
    {
      section: "Trust & Safety",
      items: [
        { to: "/admin/audit", label: "Audit Logs", icon: ScrollText },
        { to: "/admin/fraud", label: "Fraud Alerts", icon: ShieldAlert },
      ],
    },
    {
      section: "System",
      items: [{ to: "/admin/ai-config", label: "AI Configuration", icon: Cpu }],
    },
  ],
};

const ROLE_ICON = { patient: Activity, doctor: Stethoscope, paramedic: Ambulance, admin: ShieldCheck };

function useCurrentPageLabel(role) {
  const location = useLocation();
  const groups = NAV[role] || [];
  for (const g of groups) {
    for (const item of g.items) {
      const isIndex = item.to === `/${role}`;
      if (isIndex ? location.pathname === item.to : location.pathname.startsWith(item.to)) {
        return item.label;
      }
    }
  }
  return "Overview";
}

export default function Shell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const groups = NAV[user?.role] || [];
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const RoleIcon = ROLE_ICON[user?.role] || Activity;
  const pageLabel = useCurrentPageLabel(user?.role);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  const initials = (user?.name || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const sidebarContent = (
    <>
      <div className="px-5 py-5 border-b border-line">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="text-pulse" size={20} strokeWidth={2.5} />
            <span className="font-display font-semibold text-lg tracking-tight">PulseX AI</span>
          </div>
          <button
            className="lg:hidden text-mist hover:text-paper"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>
        <PulseLine height={20} className="mt-2 opacity-70" />
      </div>
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {groups.map((group, gi) => (
          <div key={group.section || gi}>
            {group.section && (
              <div className="px-3 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-mist/70">
                {group.section}
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === `/${user?.role}` || item.to === "/admin"}
                  className={({ isActive }) =>
                    `relative flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      isActive ? "text-vital bg-vital/10 border border-vital/30" : "text-mist hover:text-paper hover:bg-surface2 border border-transparent"
                    }`
                  }
                >
                  {item.icon && <item.icon size={15} className="shrink-0" />}
                  <span className="truncate">{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-line">
        <div className="flex items-center gap-2 px-3 py-2 text-xs text-mist">
          <ShieldCheck size={14} className="text-vital shrink-0" />
          <span className="capitalize">{user?.role}</span>
          <span className="text-line">•</span>
          <span className="truncate">{user?.name}</span>
        </div>
        <button
          onClick={() => {
            logout();
            navigate("/");
          }}
          className="mt-1 w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-mist hover:text-pulse hover:bg-pulse/5 transition"
        >
          <LogOut size={15} /> Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-ink">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] bg-vital text-ink px-3 py-2 rounded-lg text-sm font-medium"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 border-r border-line bg-surface flex-col">{sidebarContent}</aside>

      {/* Mobile sidebar drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-ink/70 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-y-0 left-0 w-72 bg-surface border-r border-line z-50 flex flex-col lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 glass border-b border-line">
          <div className="flex items-center justify-between gap-4 px-4 lg:px-8 h-16">
            <div className="flex items-center gap-3 min-w-0">
              <button
                className="lg:hidden text-mist hover:text-paper shrink-0"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
              >
                <Menu size={20} />
              </button>
              <div className="flex items-center gap-2 min-w-0">
                <RoleIcon size={16} className="text-vital shrink-0" />
                <h1 className="font-display font-semibold text-base truncate">{pageLabel}</h1>
              </div>
            </div>

            <div className="relative shrink-0">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full border border-line hover:border-vital/40 transition"
                aria-haspopup="true"
                aria-expanded={menuOpen}
              >
                <span className="w-7 h-7 rounded-full bg-vital/15 text-vital text-xs font-semibold flex items-center justify-center">
                  {initials}
                </span>
                <span className="hidden sm:inline text-sm text-paper max-w-[9rem] truncate">{user?.name}</span>
                <ChevronDown size={14} className={`text-mist transition-transform ${menuOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-52 bg-surface border border-line rounded-xl shadow-premium overflow-hidden"
                  >
                    <div className="px-3.5 py-3 border-b border-line">
                      <div className="text-sm font-medium truncate">{user?.name}</div>
                      <div className="text-xs text-mist capitalize">{user?.role}</div>
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        navigate("/");
                      }}
                      className="w-full flex items-center gap-2 px-3.5 py-2.5 text-sm text-mist hover:text-pulse hover:bg-pulse/5 transition"
                    >
                      <LogOut size={14} /> Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Main content with page transitions */}
        <main id="main-content" className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
