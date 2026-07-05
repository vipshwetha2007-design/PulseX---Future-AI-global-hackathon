import { Building2, Clock, RotateCcw, Lock } from "lucide-react";
import { Card, Badge } from "../ui";
import PatientTag from "../doctor/PatientTag";

function statusOf(scan) {
  if (scan.status === "rejected") return { tone: "rejected", label: "Denied" };
  const expired = scan.expiresAt && new Date(scan.expiresAt) <= new Date();
  if (expired) return { tone: "default", label: "Expired" };
  return { tone: "approved", label: "Active" };
}

export default function RecentScanCard({ scan, hospitalName, canReopen, onReopen }) {
  const { tone, label } = statusOf(scan);
  const isActive = label === "Active";

  return (
    <Card className="flex items-center justify-between gap-4 flex-wrap">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1.5">
          <PatientTag patientId={scan.patientId} />
          <Badge tone={tone}>{label}</Badge>
        </div>
        <div className="flex items-center gap-3 flex-wrap text-xs text-mist">
          <span className="flex items-center gap-1 font-mono">
            <Clock size={12} /> {new Date(scan.createdAt).toLocaleString()}
          </span>
          {hospitalName && (
            <span className="flex items-center gap-1">
              <Building2 size={12} /> {hospitalName}
            </span>
          )}
          {scan.expiresAt && (
            <span className="font-mono">{isActive ? `Expires ${new Date(scan.expiresAt).toLocaleTimeString()}` : "—"}</span>
          )}
        </div>
      </div>

      {isActive &&
        (canReopen ? (
          <button
            onClick={onReopen}
            className="shrink-0 inline-flex items-center gap-1.5 text-xs text-vital hover:underline font-medium"
          >
            <RotateCcw size={13} /> Reopen
          </button>
        ) : (
          <span className="shrink-0 inline-flex items-center gap-1.5 text-xs text-mist" title="Re-scan required to view details in a new session">
            <Lock size={13} /> Re-scan to view
          </span>
        ))}
    </Card>
  );
}
