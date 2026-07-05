import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Stethoscope,
  Users,
  ShieldAlert,
  Activity,
  ClipboardList,
  Pill,
  Cpu,
  Search,
  ArrowRight,
  CalendarCheck,
  Siren,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { doctorApi } from "../../lib/doctorApi";
import { groupByPatient, activePatients } from "../../lib/doctorAccess";
import { Card, GlassCard, KpiCard, Badge, SkeletonCard, EmptyState, ErrorState } from "../../components/ui";
import RiskBadge from "../../components/doctor/RiskBadge";
import PatientTag from "../../components/doctor/PatientTag";
import PulseLine from "../../components/PulseLine";

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [doctor, setDoctor] = useState(null);
  const [requests, setRequests] = useState([]);
  const [recentPrescriptions, setRecentPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([doctorApi.me(), doctorApi.accessRequests()])
      .then(async ([d, reqs]) => {
        if (cancelled) return;
        setDoctor(d);
        setRequests(reqs);

        // Best-effort: pull recent prescriptions from currently active grants only —
        // there's no cross-patient "my prescriptions" endpoint, so this is scoped to
        // patients this doctor can still legally view.
        const active = activePatients(reqs).slice(0, 3);
        const timelines = await Promise.allSettled(active.map((r) => doctorApi.timeline(r.patientId)));
        if (cancelled) return;
        const rx = [];
        timelines.forEach((res, i) => {
          if (res.status === "fulfilled") {
            res.value
              .filter((t) => t.label?.toLowerCase().startsWith("prescription"))
              .forEach((t) => rx.push({ ...t, patientId: active[i].patientId }));
          }
        });
        setRecentPrescriptions(rx.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5));
      })
      .catch((err) => !cancelled && setError(err.response?.data?.error || "Failed to load your dashboard"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonCard />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  const today = new Date().toDateString();
  const todaysRequests = requests.filter((r) => new Date(r.createdAt).toDateString() === today);
  const todaysPatients = new Set(todaysRequests.map((r) => r.patientId));
  const pending = requests.filter((r) => r.status === "pending_review");
  const active = activePatients(requests);
  const flagged = groupByPatient(requests).filter((r) => r.riskScore >= 30);
  const recentActivity = [...requests].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);

  return (
    <div className="space-y-6">
      <GlassCard className="p-6" glow>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-wide text-mist mb-1">Welcome back</p>
            <h1 className="font-display text-2xl font-semibold flex items-center gap-2">
              <Stethoscope className="text-vital" size={22} /> Dr. {user?.name}
            </h1>
            <p className="text-mist text-sm mt-1 flex items-center gap-2 flex-wrap">
              <span>{doctor?.specialization} · {doctor?.hospitalName}</span>
              {doctor?.licenseVerified ? <Badge tone="approved">Verified</Badge> : <Badge tone="pending_review">License pending</Badge>}
            </p>
          </div>
        </div>
        <PulseLine height={28} className="mt-5 opacity-60" />
      </GlassCard>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Today's Patients" value={todaysPatients.size} icon={CalendarCheck} tone="vital" />
        <KpiCard label="Emergency Requests" value={requests.length} icon={Siren} tone="default" />
        <KpiCard label="Pending Review" value={pending.length} icon={ClipboardList} tone="amber" />
        <KpiCard label="Active Access" value={active.length} icon={ShieldCheck} tone="vital" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent activity */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-mist text-xs uppercase tracking-wide">
              <Activity size={14} /> Recent Activity
            </div>
            <Link to="/doctor/requests" className="text-xs text-vital hover:underline">
              View all requests
            </Link>
          </div>
          {recentActivity.length === 0 ? (
            <EmptyState icon={Activity} title="No activity yet" desc="Requests you make for emergency access will show up here." />
          ) : (
            <ul className="divide-y divide-line">
              {recentActivity.map((r) => (
                <li key={r.id} className="py-3 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <PatientTag patientId={r.patientId} />
                    <Badge tone={r.status === "approved" ? "approved" : r.status === "pending_review" ? "pending_review" : "rejected"}>
                      {r.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <span className="text-xs text-mist font-mono">{new Date(r.createdAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* AI Alerts */}
        <Card>
          <div className="flex items-center gap-2 text-mist text-xs uppercase tracking-wide mb-4">
            <Cpu size={14} /> AI Alerts
          </div>
          {flagged.length === 0 ? (
            <EmptyState icon={Cpu} title="No flagged requests" desc="Elevated or high-risk requests will surface here." />
          ) : (
            <ul className="space-y-3">
              {flagged.slice(0, 5).map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2">
                  <PatientTag patientId={r.patientId} />
                  <RiskBadge score={r.riskScore} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pending diagnoses (active grants needing documentation) */}
        <Card>
          <div className="flex items-center gap-2 text-mist text-xs uppercase tracking-wide mb-4">
            <ClipboardList size={14} /> Active Grants — Documentation Pending
          </div>
          {active.length === 0 ? (
            <EmptyState icon={ClipboardList} title="No active access" desc="Patients you currently hold emergency access for will appear here." />
          ) : (
            <ul className="space-y-3">
              {active.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2">
                  <PatientTag patientId={r.patientId} />
                  <Link to={`/doctor/patients/${r.patientId}/diagnosis`} className="text-xs text-vital hover:underline inline-flex items-center gap-1">
                    Document <ArrowRight size={12} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Recent prescriptions */}
        <Card>
          <div className="flex items-center gap-2 text-mist text-xs uppercase tracking-wide mb-4">
            <Pill size={14} /> Recent Prescriptions
          </div>
          {recentPrescriptions.length === 0 ? (
            <EmptyState icon={Pill} title="No prescriptions yet" desc="Prescriptions you write for currently-active patients appear here." />
          ) : (
            <ul className="space-y-3">
              {recentPrescriptions.map((rx) => (
                <li key={rx.recordId} className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm text-paper">{rx.label.replace(/^prescription:\s*/i, "")}</p>
                    <PatientTag patientId={rx.patientId} />
                  </div>
                  <span className="text-xs text-mist font-mono">{new Date(rx.date).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <div className="text-mist text-xs uppercase tracking-wide mb-4">Quick Actions</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickAction to="/doctor/requests" icon={ShieldAlert} label="Request Access" />
          <QuickAction to="/doctor/search" icon={Search} label="Patient Search" />
          <QuickAction to="/doctor/medication-safety" icon={Pill} label="Medication Safety" />
          <QuickAction to="/doctor/patients" icon={Users} label="Assigned Patients" />
        </div>
      </Card>
    </div>
  );
}

function QuickAction({ to, icon: Icon, label }) {
  return (
    <Link to={to} className="flex flex-col items-center gap-2 text-center border border-line rounded-xl px-3 py-5 hover:border-vital/40 hover:bg-surface2 transition">
      <Icon size={20} className="text-vital" />
      <span className="text-xs text-paper">{label}</span>
    </Link>
  );
}
