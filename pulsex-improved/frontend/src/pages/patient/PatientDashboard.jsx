import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Calendar,
  QrCode,
  Bell,
  Activity,
  Download,
  ArrowRight,
  Droplet,
  Pill,
  AlertTriangle,
  Stethoscope,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { patientApi } from "../../lib/patientApi";
import { downloadJson } from "../../lib/download";
import { Card, Button, GlassCard, KpiCard, SkeletonCard, EmptyState, ErrorState } from "../../components/ui";
import PulseLine from "../../components/PulseLine";

export default function PatientDashboard() {
  const { user } = useAuth();
  const [patient, setPatient] = useState(null);
  const [qr, setQr] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([patientApi.me(), patientApi.qrStatus(), patientApi.notifications(), patientApi.records()])
      .then(([p, q, n, r]) => {
        if (cancelled) return;
        setPatient(p);
        setQr(q);
        setNotifications(n);
        setRecords(r);
      })
      .catch((err) => !cancelled && setError(err.response?.data?.error || "Failed to load your dashboard"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDownloadSummary() {
    setDownloading(true);
    try {
      const summary = await patientApi.healthSummary();
      downloadJson(`pulsex-health-summary-${new Date().toISOString().slice(0, 10)}.json`, summary);
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonCard />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  const recentRecords = [...records].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome card */}
      <GlassCard className="p-6" glow>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-wide text-mist mb-1">Welcome back</p>
            <h1 className="font-display text-2xl font-semibold">{user?.name}</h1>
            <p className="text-mist text-sm mt-1">
              Your record is private by default. Emergency access is scoped, time-limited, and logged.
            </p>
          </div>
          <Button variant="ghost" onClick={handleDownloadSummary} disabled={downloading}>
            <Download size={15} /> {downloading ? "Preparing…" : "Health Summary"}
          </Button>
        </div>
        <PulseLine height={28} className="mt-5 opacity-60" />
      </GlassCard>

      {/* Health summary stat row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Blood Group" value={patient?.bloodGroup ? 1 : 0} format={() => patient?.bloodGroup || "—"} icon={Droplet} tone="pulse" />
        <KpiCard label="Active Diseases" value={patient?.chronicDiseases?.length || 0} icon={AlertTriangle} tone="amber" />
        <KpiCard label="Current Medicines" value={patient?.currentMedicines?.length || 0} icon={Pill} tone="vital" />
        <KpiCard label="Allergies" value={patient?.allergies?.length || 0} icon={Stethoscope} tone="default" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* QR card */}
        <Card className="lg:col-span-1 flex flex-col items-center text-center">
          <div className="flex items-center gap-2 self-start text-mist text-xs uppercase tracking-wide mb-3">
            <QrCode size={14} /> Emergency QR
          </div>
          {qr?.active && qr.dataUrl ? (
            <img src={qr.dataUrl} alt="Emergency QR code" className="w-36 h-36 rounded-lg border border-line bg-white p-2" />
          ) : (
            <div className="w-36 h-36 rounded-lg border border-dashed border-line flex items-center justify-center text-mist text-xs px-4">
              No active QR yet
            </div>
          )}
          <Link to="/patient/qr" className="mt-4 text-sm text-vital hover:underline inline-flex items-center gap-1">
            Manage QR & NFC <ArrowRight size={13} />
          </Link>
        </Card>

        {/* Upcoming appointments (placeholder — no backend endpoint yet) */}
        <Card className="lg:col-span-1">
          <div className="flex items-center gap-2 text-mist text-xs uppercase tracking-wide mb-3">
            <Calendar size={14} /> Upcoming Appointments
          </div>
          <EmptyState
            icon={Calendar}
            title="No appointment scheduling yet"
            desc="This feature isn't wired to a backend endpoint in the current build."
          />
        </Card>

        {/* Recent notifications */}
        <Card className="lg:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-mist text-xs uppercase tracking-wide">
              <Bell size={14} /> Recent Notifications
            </div>
            <Link to="/patient/notifications" className="text-xs text-vital hover:underline">
              View all
            </Link>
          </div>
          {notifications.length === 0 ? (
            <EmptyState icon={Bell} title="No notifications yet" desc="You'll see access alerts and updates here." />
          ) : (
            <ul className="space-y-3">
              {notifications.slice(0, 4).map((n) => (
                <li key={n.id} className="text-sm">
                  <p className="text-paper leading-snug">{n.message}</p>
                  <p className="text-xs text-mist mt-0.5">{new Date(n.createdAt).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Recent medical activity */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-mist text-xs uppercase tracking-wide">
            <Activity size={14} /> Recent Medical Activity
          </div>
          <Link to="/patient/records" className="text-xs text-vital hover:underline">
            View all records
          </Link>
        </div>
        {recentRecords.length === 0 ? (
          <EmptyState icon={Activity} title="No medical records yet" desc="Records added by you or your care team will appear here." />
        ) : (
          <ul className="divide-y divide-line">
            {recentRecords.map((r) => (
              <li key={r.id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-paper">{r.title}</p>
                  <p className="text-xs text-mist mt-0.5 capitalize">{r.type.replace("_", " ")}</p>
                </div>
                <span className="text-xs text-mist font-mono shrink-0">{new Date(r.date).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
