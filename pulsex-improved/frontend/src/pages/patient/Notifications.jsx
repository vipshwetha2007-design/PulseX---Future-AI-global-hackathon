import { useEffect, useState } from "react";
import { Bell, ShieldAlert, Stethoscope, Cpu, Info } from "lucide-react";
import { patientApi } from "../../lib/patientApi";
import { Card, PageHeader, Badge, SkeletonCard, EmptyState, ErrorState } from "../../components/ui";

const TYPE_META = {
  access_alert: { label: "Emergency Access", icon: ShieldAlert, tone: "pulse" },
  family_alert: { label: "Family Alert", icon: Bell, tone: "amber" },
  record_update: { label: "Doctor Access", icon: Stethoscope, tone: "vital" },
  ai_alert: { label: "AI Alert", icon: Cpu, tone: "amber" },
  system: { label: "System", icon: Info, tone: "default" },
};

function metaFor(type) {
  return TYPE_META[type] || { label: "Notification", icon: Info, tone: "default" };
}

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  function load() {
    setLoading(true);
    setError(null);
    patientApi
      .notifications()
      .then(setItems)
      .catch((err) => setError(err.response?.data?.error || "Failed to load notifications"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  return (
    <div>
      <PageHeader title="Notifications" subtitle="Emergency access alerts, doctor activity, AI alerts, and system updates" />

      {loading ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : items.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications yet" desc="You'll be notified any time your record is accessed or updated." />
      ) : (
        <div className="space-y-3">
          {items.map((n) => {
            const meta = metaFor(n.type);
            const Icon = meta.icon;
            return (
              <Card key={n.id} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-surface2 border border-line flex items-center justify-center shrink-0">
                  <Icon size={16} className="text-mist" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Badge tone={meta.tone}>{meta.label}</Badge>
                    <span className="text-xs text-mist font-mono">{new Date(n.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-paper leading-snug">{n.message}</p>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
