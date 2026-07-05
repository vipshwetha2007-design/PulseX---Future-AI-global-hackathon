import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FileText, Stethoscope, Pill, ClipboardList, FileCheck, AlertTriangle } from "lucide-react";
import { doctorApi } from "../../lib/doctorApi";
import { Card, PageHeader, Badge, Button, SkeletonCard, EmptyState, ErrorState } from "../../components/ui";
import PatientTag from "../../components/doctor/PatientTag";

const TYPE_META = {
  diagnosis: { label: "Diagnosis", icon: Stethoscope, tone: "medium" },
  prescription: { label: "Prescription", icon: Pill, tone: "low" },
  treatment_plan: { label: "Treatment Plan", icon: ClipboardList, tone: "medium" },
  discharge_summary: { label: "Discharge Summary", icon: FileCheck, tone: "default" },
};

function parseLabel(label) {
  const [type, ...rest] = (label || "").split(":");
  const key = type?.trim().toLowerCase().replace(/\s+/g, "_");
  return { type: key, title: rest.join(":").trim() || label };
}

export default function PatientTimeline() {
  const { patientId } = useParams();
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expired, setExpired] = useState(false);

  function load() {
    setLoading(true);
    setError(null);
    setExpired(false);
    doctorApi
      .timeline(patientId)
      .then(setTimeline)
      .catch((err) => {
        if (err.response?.status === 403) setExpired(true);
        else setError(err.response?.data?.error || "Failed to load timeline");
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, [patientId]);

  if (loading) return <SkeletonCard />;

  if (expired) {
    return (
      <div>
        <PageHeader title="Patient Timeline" subtitle={<PatientTag patientId={patientId} />} />
        <EmptyState
          icon={AlertTriangle}
          title="No active access grant"
          desc="The timeline is only visible while you hold an active emergency access grant."
          action={
            <Link to={`/doctor/requests?patientId=${patientId}`}>
              <Button>Request access</Button>
            </Link>
          }
        />
      </div>
    );
  }

  if (error) return <ErrorState message={error} onRetry={load} />;

  const sorted = [...timeline].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div>
      <PageHeader title="Patient Timeline" subtitle={<PatientTag patientId={patientId} />} />

      <p className="text-xs text-mist mb-6 max-w-xl">
        Generated from the AI timeline endpoint, built from clinical records only. Surgical and vaccination history
        outside the emergency-scoped dataset intentionally isn't included here — that's outside what emergency
        access is meant to expose.
      </p>

      {sorted.length === 0 ? (
        <EmptyState icon={FileText} title="No clinical records yet" desc="Diagnoses, prescriptions, and treatment plans you document will appear here." />
      ) : (
        <div className="relative pl-8">
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-line" />
          <div className="space-y-5">
            {sorted.map((t) => {
              const { type, title } = parseLabel(t.label);
              const meta = TYPE_META[type] || { label: type || "Record", icon: FileText, tone: "default" };
              const Icon = meta.icon;
              return (
                <div key={t.recordId} className="relative">
                  <div className="absolute -left-8 top-1 w-8 h-8 rounded-full bg-surface2 border border-line flex items-center justify-center">
                    <Icon size={13} className="text-vital" />
                  </div>
                  <Card>
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                        <p className="font-medium text-paper">{title}</p>
                      </div>
                      <span className="text-xs text-mist font-mono">{t.year}</span>
                    </div>
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
