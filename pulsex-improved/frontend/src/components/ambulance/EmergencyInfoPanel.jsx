import { Droplet, ShieldAlert, Pill, HeartPulse, Phone, X } from "lucide-react";
import { Card, Badge } from "../ui";
import AccessCountdown from "../doctor/AccessCountdown";

const FIELD_META = {
  bloodGroup: { label: "Blood Group", icon: Droplet },
  allergies: { label: "Allergies", icon: ShieldAlert },
  currentMedicines: { label: "Current Medicines", icon: Pill },
  chronicDiseases: { label: "Critical / Chronic Diseases", icon: HeartPulse },
  emergencyContacts: { label: "Emergency Contacts", icon: Phone },
};

function ListValue({ value }) {
  if (!value || (Array.isArray(value) && value.length === 0)) {
    return <p className="text-sm text-mist italic">None on record</p>;
  }
  if (Array.isArray(value)) {
    return (
      <ul className="space-y-1">
        {value.map((item, i) => (
          <li key={i} className="text-sm text-paper">
            {typeof item === "string" ? item : item.name ? `${item.name}${item.phone ? ` · ${item.phone}` : ""}` : JSON.stringify(item)}
          </li>
        ))}
      </ul>
    );
  }
  return <p className="text-sm text-paper">{String(value)}</p>;
}

/**
 * Renders exactly the ambulance-scoped emergency fields the backend returns —
 * blood group, allergies, current medicines, chronic diseases, emergency
 * contacts — and nothing else. There is no path in this component that could
 * surface history, billing, insurance, mental health, or lab data, because
 * the backend never sends it to this role in the first place.
 */
export default function EmergencyInfoPanel({ grant, onExpire, onClose }) {
  if (!grant) return null;
  const { info, expiresAt, riskScore } = grant;

  return (
    <Card className="border-vital/30 shadow-glow">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge tone="approved">Access Granted</Badge>
            {riskScore !== undefined && riskScore !== null && <Badge tone={riskScore >= 30 ? "pending_review" : "approved"}>Risk {riskScore}</Badge>}
          </div>
          <p className="text-xs text-mist">Emergency-scoped record — visible only while access remains active.</p>
        </div>
        <div className="flex items-center gap-2">
          <AccessCountdown expiresAt={expiresAt} onExpire={onExpire} />
          <button onClick={onClose} className="text-mist hover:text-paper transition">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.keys(FIELD_META).map((key) => {
          const meta = FIELD_META[key];
          const Icon = meta.icon;
          return (
            <div key={key} className="bg-surface2 border border-line rounded-lg p-3.5">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-mist mb-2">
                <Icon size={13} /> {meta.label}
              </div>
              <ListValue value={info[key]} />
            </div>
          );
        })}
      </div>
    </Card>
  );
}
