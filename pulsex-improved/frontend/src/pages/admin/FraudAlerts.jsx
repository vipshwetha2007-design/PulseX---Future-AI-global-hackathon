import { useEffect, useMemo, useState } from "react";
import { ShieldAlert, ShieldCheck, AlertTriangle } from "lucide-react";
import { adminApi } from "../../lib/adminApi";
import { severityTone } from "../../lib/adminAnalytics";
import { PageHeader, Card, Badge, Pill, SkeletonCard, ErrorState, EmptyState, StatBox, SectionHeading } from "../../components/ui";

const SEVERITY_FILTERS = [
  { key: "all", label: "All severities" },
  { key: "high", label: "High" },
  { key: "medium", label: "Medium" },
  { key: "low", label: "Low" },
];

export default function FraudAlerts() {
  const [live, setLive] = useState([]);
  const [resolved, setResolved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [severity, setSeverity] = useState("all");

  function load() {
    setLoading(true);
    setError(null);
    adminApi
      .fraudAlerts()
      .then((res) => {
        setLive(res.live || []);
        setResolved(res.resolved || []);
      })
      .catch((err) => setError(err.response?.data?.error || "Failed to load fraud alerts"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const filteredLive = useMemo(() => (severity === "all" ? live : live.filter((a) => a.severity === severity)), [live, severity]);

  if (loading) return <SkeletonCard />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const highCount = live.filter((a) => a.severity === "high").length;
  const mediumCount = live.filter((a) => a.severity === "medium").length;

  return (
    <div className="space-y-6">
      <PageHeader title="Fraud Alerts" subtitle="AI-detected anomalies in access patterns, re-evaluated live against the audit log" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBox label="Open Alerts" value={live.length} tone={live.length ? "pulse" : "vital"} />
        <StatBox label="High Severity" value={highCount} tone={highCount ? "pulse" : "default"} />
        <StatBox label="Medium Severity" value={mediumCount} tone={mediumCount ? "amber" : "default"} />
        <StatBox label="Resolved" value={resolved.length} tone="vital" />
      </div>

      <div>
        <SectionHeading icon={ShieldAlert} title="Active Alerts" />
        <div className="flex flex-wrap gap-2 mb-4">
          {SEVERITY_FILTERS.map((f) => (
            <Pill key={f.key} active={severity === f.key} onClick={() => setSeverity(f.key)}>
              {f.label}
            </Pill>
          ))}
        </div>

        {filteredLive.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No active fraud alerts"
            desc="Anomalies like mass patient access, location jumps, or bulk downloads will surface here in real time."
          />
        ) : (
          <div className="space-y-3">
            {filteredLive.map((alert, i) => (
              <Card key={i} className="flex items-start justify-between gap-4 flex-wrap border-pulse/20">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-pulse/10 text-pulse flex items-center justify-center shrink-0">
                    <AlertTriangle size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-paper capitalize">{alert.type?.replace(/_/g, " ")}</p>
                    <p className="text-xs text-mist mt-0.5">{alert.details}</p>
                    <p className="text-xs text-mist font-mono mt-1">Actor: {alert.actorUserId}</p>
                  </div>
                </div>
                <Badge tone={severityTone[alert.severity] === "pulse" ? "rejected" : severityTone[alert.severity] === "amber" ? "pending_review" : "approved"}>
                  {alert.severity}
                </Badge>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <SectionHeading icon={ShieldCheck} title="Resolved Alerts" />
        {resolved.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="No resolved alerts on record" />
        ) : (
          <div className="space-y-3">
            {resolved.map((alert) => (
              <Card key={alert.id} className="flex items-center justify-between gap-4 flex-wrap opacity-70">
                <div>
                  <p className="text-sm text-paper capitalize">{alert.type?.replace(/_/g, " ")}</p>
                  <p className="text-xs text-mist mt-0.5">{alert.details}</p>
                </div>
                <Badge tone="approved">Resolved</Badge>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
