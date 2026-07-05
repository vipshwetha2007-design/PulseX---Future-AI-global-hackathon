import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { patientApi } from "../../lib/patientApi";
import { Card, PageHeader, Toggle, SkeletonCard, ErrorState } from "../../components/ui";

const SETTINGS = [
  { key: "emergencyConsent", label: "Emergency Consent", desc: "Allow AI-verified emergency access by doctors and paramedics" },
  { key: "familyAccess", label: "Family Access", desc: "Let registered family members view limited medical information" },
  { key: "doctorAccess", label: "Doctor Access", desc: "Allow your assigned doctors to request access outside emergencies" },
  { key: "researchSharing", label: "Anonymized Research Sharing", desc: "Share de-identified data to help improve care models" },
];

export default function ConsentSettings() {
  const [consent, setConsent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  function load() {
    setLoading(true);
    setError(null);
    patientApi
      .me()
      .then((p) => setConsent(p.consent || {}))
      .catch((err) => setError(err.response?.data?.error || "Failed to load consent settings"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function toggle(key, value) {
    const prev = consent;
    setConsent((c) => ({ ...c, [key]: value }));
    try {
      const updated = await patientApi.updateConsent({ [key]: value });
      setConsent(updated);
    } catch {
      setConsent(prev);
    }
  }

  if (loading) return <SkeletonCard />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <PageHeader title="Consent Settings" subtitle="Control who can access your record and under what conditions" />
      <Card>
        <div className="flex items-center gap-2 mb-2 text-xs text-mist uppercase tracking-wide">
          <ShieldCheck size={14} /> Access permissions
        </div>
        <div className="divide-y divide-line">
          {SETTINGS.map((s) => (
            <Toggle key={s.key} label={s.label} desc={s.desc} checked={!!consent?.[s.key]} onChange={(v) => toggle(s.key, v)} />
          ))}
        </div>
      </Card>
      <p className="text-xs text-mist mt-4 max-w-lg">
        Turning off Emergency Consent does not disable the 30-minute emergency workflow entirely — it factors into the
        AI risk score and may route ambulance/doctor requests to manual review instead of automatic approval.
      </p>
    </div>
  );
}
