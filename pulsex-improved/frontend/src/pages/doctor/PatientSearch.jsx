import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, QrCode, Lock, ArrowRight } from "lucide-react";
import { doctorApi } from "../../lib/doctorApi";
import { Card, PageHeader, Field, inputCls, Button, ErrorText, Badge } from "../../components/ui";
import RiskBadge from "../../components/doctor/RiskBadge";

export default function PatientSearch() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("id"); // "id" | "qr"
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    if (!value.trim()) {
      setError(`Enter a ${mode === "id" ? "patient ID" : "QR code value"}`);
      return;
    }
    setSubmitting(true);
    try {
      const payload = mode === "id" ? { patientId: value.trim(), reason } : { qrToken: value.trim(), reason };
      const res = await doctorApi.createAccessRequest(payload);
      setResult(res);
    } catch (err) {
      setError(err.response?.data?.error || "Patient not found or access could not be initiated");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Patient Search" subtitle="Look up a patient by ID or QR code to begin an access request" />

      <Card className="mb-5 border-line">
        <div className="flex items-start gap-3">
          <Lock size={16} className="text-mist mt-0.5 shrink-0" />
          <p className="text-xs text-mist leading-relaxed">
            PulseX AI doesn't expose a searchable directory of patients by name or phone number — that would let any
            doctor browse the entire patient base, which defeats the purpose of scoped emergency access. Every
            lookup here is tied to a concrete identifier the patient has shared: their Patient ID or their QR code.
          </p>
        </div>
      </Card>

      <Card>
        <div className="flex gap-2 mb-5">
          <ModeButton active={mode === "id"} onClick={() => setMode("id")} icon={Search} label="Patient ID" />
          <ModeButton active={mode === "qr"} onClick={() => setMode("qr")} icon={QrCode} label="QR Code" />
          <div className="flex-1" />
          <DisabledField label="Name" />
          <DisabledField label="Phone" />
        </div>

        {!result ? (
          <form onSubmit={submit} className="space-y-4">
            <Field label={mode === "id" ? "Patient ID" : "QR code value"}>
              <input
                className={inputCls}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={mode === "id" ? "Paste the patient's ID" : "Paste the scanned QR payload"}
              />
            </Field>
            <Field label="Reason for access">
              <input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Follow-up consultation" />
            </Field>
            <ErrorText>{error}</ErrorText>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Searching…" : "Find & request access"}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge tone={result.request.status === "approved" ? "approved" : result.request.status === "pending_review" ? "pending_review" : "rejected"}>
                {result.request.status.replace("_", " ")}
              </Badge>
              <RiskBadge score={result.request.riskScore} />
            </div>
            <p className="text-sm text-mist font-mono">Patient #{result.request.patientId.slice(0, 10)}</p>
            <div className="flex items-center gap-3">
              {result.request.status === "approved" && (
                <Button onClick={() => navigate(`/doctor/patients/${result.request.patientId}/access`)}>
                  Open patient <ArrowRight size={14} />
                </Button>
              )}
              <Button variant="ghost" onClick={() => setResult(null)}>Search again</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function ModeButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-full border transition ${
        active ? "bg-vital/10 text-vital border-vital/30" : "text-mist border-line hover:border-vital/30 hover:text-paper"
      }`}
    >
      <Icon size={12} /> {label}
    </button>
  );
}

function DisabledField({ label }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-full border border-line text-mist/40 cursor-not-allowed">
      <Lock size={10} /> {label}
    </span>
  );
}
