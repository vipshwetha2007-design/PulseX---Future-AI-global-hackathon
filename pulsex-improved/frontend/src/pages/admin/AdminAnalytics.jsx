import { useEffect, useState } from "react";
import { TrendingUp, Users, Building2, Cpu } from "lucide-react";
import { adminApi } from "../../lib/adminApi";
import { dailySeries, countBy, trendFromSeries } from "../../lib/adminAnalytics";
import { Card, PageHeader, SkeletonCard, ErrorState, EmptyState, SectionHeading, StatBox } from "../../components/ui";
import { TrendArea, CategoryBar, StatusDonut, ChartLegend } from "../../components/admin/Charts";

export default function AdminAnalytics() {
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [requests, setRequests] = useState([]);
  const [riskScores, setRiskScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  function load() {
    setLoading(true);
    setError(null);
    Promise.all([adminApi.users(), adminApi.auditLogs(), adminApi.emergencyRequests(), adminApi.riskScores()])
      .then(([u, logs, reqs, risk]) => {
        setUsers(u);
        setAuditLogs(logs);
        setRequests(reqs);
        setRiskScores(risk);
      })
      .catch((err) => setError(err.response?.data?.error || "Failed to load analytics"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonCard />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }
  if (error) return <ErrorState message={error} onRetry={load} />;

  const signupSeries = dailySeries(users, "createdAt", 14);
  const signupTrend = trendFromSeries(signupSeries);

  const roleComposition = countBy(users, (u) => u.role).map((c) => ({
    ...c,
    color: { patient: "#2FE6C4", doctor: "#5B8DEF", paramedic: "#F5B942", admin: "#FF4D5E" }[c.label] || "#8CA0C4",
  }));

  const requestsPerDay = dailySeries(requests, "createdAt", 14);

  const riskBuckets = [
    { label: "Low (0-29)", value: riskScores.filter((r) => r.score < 30).length },
    { label: "Monitor (30-59)", value: riskScores.filter((r) => r.score >= 30 && r.score < 60).length },
    { label: "High (60+)", value: riskScores.filter((r) => r.score >= 60).length },
  ];

  const actionBreakdown = countBy(auditLogs, (l) => l.action.replace(/_/g, " ")).sort((a, b) => b.value - a.value).slice(0, 6);

  const avgRisk = riskScores.length ? Math.round(riskScores.reduce((s, r) => s + (r.score || 0), 0) / riskScores.length) : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" subtitle="Growth, engagement, and AI risk trends across the platform" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBox label="Total Users" value={users.length} tone="vital" />
        <StatBox label="Audit Events" value={auditLogs.length} />
        <StatBox label="Avg. Risk Score" value={avgRisk} tone={avgRisk >= 60 ? "pulse" : avgRisk >= 30 ? "amber" : "vital"} />
        <StatBox label="Emergency Requests" value={requests.length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <SectionHeading
            icon={TrendingUp}
            title="User Growth — last 14 days"
            action={
              <span className={`text-xs font-medium ${signupTrend >= 0 ? "text-vital" : "text-pulse"}`}>
                {signupTrend >= 0 ? "▲" : "▼"} {Math.abs(signupTrend)}%
              </span>
            }
          />
          {users.length === 0 ? <EmptyState icon={TrendingUp} title="No signups yet" /> : <TrendArea data={signupSeries} color="#2FE6C4" />}
        </Card>

        <Card>
          <SectionHeading icon={Users} title="User Composition" />
          {users.length === 0 ? (
            <EmptyState icon={Users} title="No users yet" />
          ) : (
            <>
              <StatusDonut data={roleComposition} centerValue={users.length} centerLabel="Users" />
              <ChartLegend items={roleComposition} />
            </>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <SectionHeading icon={Building2} title="Emergency Requests — last 14 days" />
          {requests.length === 0 ? <EmptyState icon={Building2} title="No requests yet" /> : <CategoryBar data={requestsPerDay} color="#5B8DEF" />}
        </Card>

        <Card>
          <SectionHeading icon={Cpu} title="AI Risk Distribution" />
          {riskScores.length === 0 ? (
            <EmptyState icon={Cpu} title="No risk scores yet" desc="Risk scores are generated as emergency access requests are evaluated." />
          ) : (
            <CategoryBar data={riskBuckets} color="#F5B942" />
          )}
        </Card>
      </div>

      <Card>
        <SectionHeading title="Top Audit Actions" />
        {actionBreakdown.length === 0 ? (
          <EmptyState title="No audit activity yet" />
        ) : (
          <div className="space-y-3">
            {actionBreakdown.map((a) => {
              const max = actionBreakdown[0].value || 1;
              return (
                <div key={a.label} className="flex items-center gap-3">
                  <span className="text-xs text-mist capitalize w-40 shrink-0 truncate">{a.label}</span>
                  <div className="flex-1 h-2 rounded-full bg-surface2 overflow-hidden">
                    <div className="h-full bg-vital rounded-full transition-all duration-700" style={{ width: `${(a.value / max) * 100}%` }} />
                  </div>
                  <span className="text-xs font-mono text-paper w-8 text-right">{a.value}</span>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
