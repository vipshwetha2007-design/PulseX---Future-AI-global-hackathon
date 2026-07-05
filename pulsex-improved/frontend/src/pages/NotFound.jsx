import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Compass, ArrowLeft, HeartPulse } from "lucide-react";
import { Button } from "../components/ui";
import PulseLine from "../components/PulseLine";

export default function NotFound() {
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
          className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-surface2 border border-line flex items-center justify-center"
        >
          <Compass className="text-vital" size={28} strokeWidth={1.5} />
        </motion.div>
        <div className="font-mono text-xs text-mist tracking-widest uppercase mb-2">Error 404</div>
        <h1 className="font-display text-2xl font-semibold mb-2">Page not found</h1>
        <p className="text-mist text-sm mb-8 leading-relaxed">
          The page you're looking for doesn't exist, has moved, or the link may be outdated.
        </p>
        <PulseLine height={20} className="mb-8 opacity-50" />
        <Link to="/">
          <Button className="w-full group">
            <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-0.5" />
            Back to home
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
