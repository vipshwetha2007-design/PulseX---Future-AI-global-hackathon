import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Droplet, AlertTriangle, Pill, HeartPulse, Users, Stethoscope, FileText, ClipboardList } from "lucide-react";
import { doctorApi } from "../../lib/doctorApi";
import { Card, PageHeader, Badge, Button, SkeletonCard, ErrorState, EmptyState } from "../../components/ui";
import AccessCountdown from "../../components/doctor/AccessCountdown";
import PatientTag from "../../components/doctor/PatientTag";

export default function EmergencyAccess() {
  const { patientId } = useParams();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expired, setExpired] = useState(false);

  function load() {
    setLoading(true);
    setError(null);
    setExpired(false);
    doctorApi
      .emergencyInfo(patientId)
      .then(setInfo)
      .catch((err) => {
        if (err.response?.status === 403) setExpired(true);
        else setError(err.response?.data?.error || "Failed to load emergency information");
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, [patientId]);

  if (loading) return <SkeletonCard />;

  if (expired) {
    return (
      <div>
        <PageHeader title="Emergency Access" subtitle={<PatientTag patientId={patientId} />} />
        <EmptyState
          icon={AlertTriangle}
          title="No active access grant"
          desc="Your emergency access to this patient has expired or was never granted. Submit a new request to continue."
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

  return (
    <div>
      <PageHeader
        title="Emergency Access"
        subtitle={<PatientTag patientId={patientId} />}
        action={<AccessCountdown expiresAt={info.accessExpiresAt} onExpire={() => setExpired(true)} />}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <InfoCard icon={Droplet} tone="pulse" label="Blood Group" value={info.bloodGroup || "Unknown"} />
        <InfoListCard icon={AlertTriangle} tone="amber" label="Allergies" items={info.allergies} />
        <InfoListCard icon={Pill} tone="vital" label="Current Medicines" items={info.currentMedicines} />
        <InfoListCard icon={HeartPulse} tone="amber" label="Critical / Chronic Diseases" items={info.chronicDiseases} />
      </div>

      <Card>
        <div className="flex items-center gap-2 text-mist text-xs uppercase tracking-wide mb-3">
          <Users size={14} /> Emergency Contacts
        </div>
        {!info.emergencyContacts || info.emergencyContacts.length === 0 ? (
          <EmptyState icon={Users} title="No emergency contacts on file" />
        ) : (
          <ul className="divide-y divide-line">
            {info.emergencyContacts.map((c, i) => (
              <li key={i} className="py-2 flex items-center justify-between">
                <span className="text-paper text-sm">{c.name}{c.relation ? ` · ${c.relation}` : ""}</span>
                <span className="text-mist text-sm font-mono">{c.phone}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
        <QuickLink to={`/doctor/patients/${patientId}/timeline`} icon={FileText} label="Timeline" />
        <QuickLink to={`/doctor/patients/${patientId}/diagnosis`} icon={Stethoscope} label="Diagnosis" />
        <QuickLink to={`/doctor/patients/${patientId}/prescription`} icon={Pill} label="Prescription" />
        <QuickLink to={`/doctor/patients/${patientId}/treatment-plan`} icon={ClipboardList} label="Treatment Plan" />
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, tone, label, value }) {
  const toneCls = { pulse: "bg-pulse/10 border-pulse/30 text-pulse", amber: "bg-amber/10 border-amber/30 text-amber", vital: "bg-vital/10 border-vital/30 text-vital" }[tone];
  return (
    <Card className="flex items-center gap-4">
      <div className={`w-11 h-11 rounded-lg border flex items-center justify-center shrink-0 ${toneCls}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs text-mist uppercase tracking-wide">{label}</p>
        <p className="text-lg font-display font-medium mt-0.5">{value}</p>
      </div>
    </Card>
  );
}

function InfoListCard({ icon: Icon, tone, label, items }) {
  const toneCls = { pulse: "bg-pulse/10 border-pulse/30 text-pulse", amber: "bg-amber/10 border-amber/30 text-amber", vital: "bg-vital/10 border-vital/30 text-vital" }[tone];
  return (
    <Card>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${toneCls}`}>
          <Icon size={15} />
        </div>
        <p className="text-xs text-mist uppercase tracking-wide">{label}</p>
      </div>
      {!items || items.length === 0 ? (
        <p className="text-sm text-mist">None recorded</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((it, i) => (
            <Badge key={i} tone={tone === "pulse" ? "high" : tone === "amber" ? "medium" : "low"}>
              {it}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  );
}

function QuickLink({ to, icon: Icon, label }) {
  return (
    <Link to={to} className="flex flex-col items-center gap-2 text-center border border-line rounded-xl px-3 py-4 hover:border-vital/40 hover:bg-surface2 transition">
      <Icon size={18} className="text-vital" />
      <span className="text-xs text-paper">{label}</span>
    </Link>
  );
}
