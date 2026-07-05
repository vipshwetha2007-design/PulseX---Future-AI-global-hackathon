import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Building2,
  Stethoscope,
  Truck,
  ShieldAlert,
  ShieldCheck,
  Activity,
  ClipboardList,
  Cpu,
  ArrowRight,
  UserCog,
  BarChart3,
  Siren,
} from "lucide-react";
import { adminApi } from "../../lib/adminApi";
import { dailySeries, trendFromSeries } from "../../lib/adminAnalytics";
import { Card, GlassCard, KpiCard, Badge, SkeletonCard, ErrorState, EmptyState, SectionHeading } from "../../components/ui";
import { TrendArea, StatusDonut, ChartLegend } from "../../components/admin/Charts";
import PulseLine from "../../components/PulseLine";

export default function AdminOverview() {
  const [overview, setOverview] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  function load() {
    setLoading(true);
    setError(null);
    Promise.all([adminApi.overview(), adminApi.auditLogs(), adminApi.emergencyRequests()])
      .then(([o, logs, reqs]) => {
        setOverview(o);
        setAuditLogs(logs);
        setRequests(reqs);
      })
      .catch((err) => setError(err.response?.data?.error || "Failed to load the admin overview"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonCard />
      </div>
    );
  }
  if (error) return <ErrorState message={error} onRetry={load} />;

  const activitySeries = dailySeries(auditLogs, "timestamp", 14);
  const activityTrend = trendFromSeries(activitySeries);

  const statusCounts = ["approved", "pending_review", "rejected"].map((s) => ({
    label: s.replace("_", " "),
    value: requests.filter((r) => r.status === s).length,
    color: s === "approved" ? "#2FE6C4" : s === "pending_review" ? "#F5B942" : "#FF4D5E",
  }));

  const recentActivity = [...auditLogs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 7);

  return (
    <div className="space-y-6">
      {/* Executive header */}
      <GlassCard className="p-6" glow>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-wide text-mist mb-1">Executive Overview</p>
            <h1 className="font-display text-2xl font-semibold tracking-tight">Platform health at a glance</h1>
            <p className="text-mist text-sm mt-1">
              {overview.totalUsers} total users across {overview.hospitals} hospital{overview.hospitals === 1 ? "" : "s"} ·{" "}
              {overview.openFraudAlerts} open fraud alert{overview.openFraudAlerts === 1 ? "" : "s"}
            </p>
          </div>
          <Badge tone={overview.openFraudAlerts > 0 ? "pending_review" : "approved"}>
            {overview.openFraudAlerts > 0 ? "Needs attention" : "All systems normal"}
          </Badge>
        </div>
        <PulseLine height={28} className="mt-5 opacity-60" />
      </GlassCard>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Users" value={overview.totalUsers} icon={Users} tone="vital" />
        <KpiCard label="Hospitals" value={overview.hospitals} icon={Building2} tone="default" />
        <KpiCard label="Doctors" value={overview.doctors} icon={Stethoscope} tone="default" />
        <KpiCard label="Paramedics" value={overview.paramedics} icon={Truck} tone="default" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Emergency Requests" value={overview.emergencyRequests} icon={Siren} tone="vital" />
        <KpiCard label="Approved" value={overview.approvedRequests} icon={ShieldCheck} tone="vital" />
        <KpiCard label="Pending Review" value={overview.pendingReview} icon={ClipboardList} tone="amber" />
        <KpiCard label="Open Fraud Alerts" value={overview.openFraudAlerts} icon={ShieldAlert} tone={overview.openFraudAlerts > 0 ? "pulse" : "default"} />
      </div>

      {/* Trend + composition */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <SectionHeading
            icon={Activity}
            title="Platform Activity — last 14 days"
            action={
              <span className={`text-xs font-medium ${activityTrend >= 0 ? "text-vital" : "text-pulse"}`}>
                {activityTrend >= 0 ? "▲" : "▼"} {Math.abs(activityTrend)}% vs. prior period
              </span>
            }
          />
          {auditLogs.length === 0 ? (
            <EmptyState icon={Activity} title="No activity yet" desc="Audit log activity will chart here as the platform is used." />
          ) : (
            <TrendArea data={activitySeries} />
          )}
        </Card>

        <Card>
          <SectionHeading icon={BarChart3} title="Request Status Mix" />
          {requests.length === 0 ? (
            <EmptyState icon={BarChart3} title="No requests yet" />
          ) : (
            <>
              <StatusDonut data={statusCounts} centerValue={requests.length} centerLabel="Requests" />
              <ChartLegend items={statusCounts} />
            </>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Activity timeline */}
        <Card className="lg:col-span-2">
          <SectionHeading
            icon={Cpu}
            title="Activity Timeline"
            action={
              <Link to="/admin/audit" className="text-xs text-vital hover:underline">
                View all logs
              </Link>
            }
          />
          {recentActivity.length === 0 ? (
            <EmptyState icon={Cpu} title="No audit activity yet" />
          ) : (
            <ol className="relative border-l border-line ml-2 space-y-5">
              {recentActivity.map((log) => (
                <li key={log.id} className="ml-4">
                  <span className="absolute -left-[5px] w-2.5 h-2.5 rounded-full bg-vital ring-4 ring-vital/10 mt-1.5" />
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <p className="text-sm text-paper">
                      <span className="capitalize text-mist">{log.actorRole}</span> · {log.action.replace(/_/g, " ")}
                    </p>
                    <span className="text-xs text-mist font-mono">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  {log.reason && <p className="text-xs text-mist mt-0.5">{log.reason}</p>}
                </li>
              ))}
            </ol>
          )}
        </Card>

        {/* Quick actions */}
        <Card>
          <SectionHeading title="Quick Actions" />
          <div className="grid grid-cols-2 gap-3">
            <QuickAction to="/admin/hospitals" icon={Building2} label="Verify Hospitals" />
            <QuickAction to="/admin/hospitals" icon={Stethoscope} label="Verify Doctors" />
            <QuickAction to="/admin/users" icon={UserCog} label="Manage Users" />
            <QuickAction to="/admin/fraud" icon={ShieldAlert} label="Fraud Alerts" />
            <QuickAction to="/admin/audit" icon={ClipboardList} label="Audit Logs" />
            <QuickAction to="/admin/analytics" icon={BarChart3} label="Analytics" />
          </div>
        </Card>
      </div>
    </div>
  );
}

function QuickAction({ to, icon: Icon, label }) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center gap-2 text-center border border-line rounded-xl px-3 py-5 hover:border-vital/40 hover:bg-surface2 transition group"
    >
      <Icon size={20} className="text-vital transition-transform group-hover:scale-110" />
      <span className="text-xs text-paper flex items-center gap-1">
        {label} <ArrowRight size={11} className="opacity-0 group-hover:opacity-100 transition" />
      </span>
    </Link>
  );
}
