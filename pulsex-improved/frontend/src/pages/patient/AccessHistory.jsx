import { useEffect, useState } from "react";
import { History, Stethoscope, Ambulance, ShieldCheck, Clock } from "lucide-react";
import { patientApi } from "../../lib/patientApi";
import { Card, PageHeader, Badge, SkeletonCard, EmptyState, ErrorState } from "../../components/ui";

const ROLE_ICON = { doctor: Stethoscope, paramedic: Ambulance };

function statusTone(status) {
  if (status === "approved") return "approved";
  if (status === "pending_review") return "pending_review";
  if (status === "rejected") return "rejected";
  return "default";
}

export default function AccessHistory() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  function load() {
    setLoading(true);
    setError(null);
    patientApi
      .accessHistory()
      .then(setLogs)
      .catch((err) => setError(err.response?.data?.error || "Failed to load access history"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  return (
    <div>
      <PageHeader title="Access History" subtitle="Every time your record was viewed — doctor, hospital, time, reason, and duration" />

      {loading ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : logs.length === 0 ? (
        <EmptyState icon={History} title="No access recorded yet" desc="This log is immutable and will fill in as your record is accessed." />
      ) : (
        <div className="relative pl-8">
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-line" />
          <div className="space-y-5">
            {logs.map((log) => {
              const Icon = ROLE_ICON[log.actorRole] || ShieldCheck;
              return (
                <div key={log.id} className="relative">
                  <div className="absolute -left-8 top-1 w-8 h-8 rounded-full bg-surface2 border border-line flex items-center justify-center">
                    <Icon size={13} className="text-vital" />
                  </div>
                  <Card>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <p className="font-medium text-paper">
                          {log.actorName} <span className="text-mist font-normal capitalize">· {log.actorRole}</span>
                        </p>
                        {log.hospitalName && <p className="text-sm text-mist mt-0.5">{log.hospitalName}</p>}
                      </div>
                      <span className="text-xs text-mist font-mono shrink-0">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mt-3">
                      <Badge tone="default">{log.action.replace(/_/g, " ")}</Badge>
                      {log.requestStatus && <Badge tone={statusTone(log.requestStatus)}>{log.requestStatus.replace("_", " ")}</Badge>}
                      {log.durationMinutes != null && (
                        <Badge tone="default">
                          <Clock size={10} /> {log.durationMinutes} min window
                        </Badge>
                      )}
                    </div>
                    {log.reason && <p className="text-sm text-mist mt-3">Reason: {log.reason}</p>}
                    {log.infoViewed?.length > 0 && (
                      <p className="text-xs text-mist/70 mt-2">Info viewed: {log.infoViewed.join(", ")}</p>
                    )}
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
