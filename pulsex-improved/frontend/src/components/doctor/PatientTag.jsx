import { User } from "lucide-react";

export default function PatientTag({ patientId, className = "" }) {
  const short = patientId ? patientId.slice(0, 8) : "unknown";
  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-xs text-mist ${className}`}>
      <User size={12} /> Patient #{short}
    </span>
  );
}
