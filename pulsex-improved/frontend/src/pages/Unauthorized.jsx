import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldAlert, ArrowLeft, HeartPulse } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui";
import PulseLine from "../components/PulseLine";

const ROLE_HOME = { patient: "/patient", doctor: "/doctor", paramedic: "/ambulance", admin: "/admin" };

export default function Unauthorized() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const home = user ? ROLE_HOME[user.role] || "/" : "/";

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-mesh relative overflow-hidden">
      <div className="absolute inset-0 bg-grid" aria-hidden="true" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md text-center glass border border-line rounded-2xl px-8 py-12 shadow-premium"
      >
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <HeartPulse className="text-pulse" size={20} strokeWidth={2.5} />
          <span className="font-display font-semibold text-lg">PulseX AI</span>
        </Link>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4, ease: "backOut" }}
          className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-pulse/10 border border-pulse/30 flex items-center justify-center"
        >
          <ShieldAlert className="text-pulse" size={28} strokeWidth={1.5} />
        </motion.div>
        <div className="font-mono text-xs text-pulse tracking-widest uppercase mb-2">Access denied</div>
        <h1 className="font-display text-2xl font-semibold mb-2">You don't have permission</h1>
        <p className="text-mist text-sm mb-8 leading-relaxed">
          This page isn't available{user ? ` for your ${user.role} account` : ""}. If you think this is a mistake,
          contact your administrator.
        </p>
        <PulseLine height={20} className="mb-8 opacity-50" color="#FF4D5E" />
        <div className="flex items-center justify-center gap-3">
          <Button variant="ghost" onClick={() => navigate(-1)} className="flex-1">
            <ArrowLeft size={15} /> Go back
          </Button>
          <Link to={home} className="flex-1">
            <Button className="w-full">{user ? "Dashboard" : "Home"}</Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
