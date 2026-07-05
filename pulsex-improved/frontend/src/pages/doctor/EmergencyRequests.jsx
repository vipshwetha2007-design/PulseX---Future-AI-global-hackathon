import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ShieldAlert, Plus, Eye, RotateCw, Clock } from "lucide-react";
import { doctorApi } from "../../lib/doctorApi";
import {
  Card,
  PageHeader,
  Badge,
  Button,
  Field,
  inputCls,
  Textarea,
  Modal,
  ErrorText,
  SkeletonCard,
  EmptyState,
  ErrorState,
} from "../../components/ui";
import RiskBadge from "../../components/doctor/RiskBadge";
import PatientTag from "../../components/doctor/PatientTag";

const TABS = [
  { key: "all", label: "All" },
  { key: "pending_review", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

export default function EmergencyRequests() {
  const [searchParams] = useSearchParams();
  const [requests, setRequests] = useState([]);
  const [hospitals, setHospitals] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("all");

  const [newModalOpen, setNewModalOpen] = useState(false);
  const [detailRequest, setDetailRequest] = useState(null);

  function load() {
    setLoading(true);
    setError(null);
    Promise.all([doctorApi.accessRequests(), doctorApi.hospitalMap()])
      .then(([reqs, hMap]) => {
        setRequests(reqs);
        setHospitals(hMap);
      })
      .catch((err) => setError(err.response?.data?.error || "Failed to load emergency requests"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  useEffect(() => {
    if (searchParams.get("patientId")) setNewModalOpen(true);
  }, [searchParams]);

  const filtered = useMemo(() => {
    const list = tab === "all" ? requests : requests.filter((r) => r.status === tab);
    return [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [requests, tab]);

  const counts = {
    all: requests.length,
    pending_review: requests.filter((r) => r.status === "pending_review").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  return (
    <div>
      <PageHeader
        title="Emergency Requests"
        subtitle="Every access request you've submitted, AI-scored on creation"
        action={
          <Button onClick={() => setNewModalOpen(true)}>
            <Plus size={15} /> New request
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`text-xs font-mono px-3 py-1.5 rounded-full border transition ${
              tab === t.key ? "bg-vital/10 text-vital border-vital/30" : "text-mist border-line hover:border-vital/30 hover:text-paper"
            }`}
          >
            {t.label} ({counts[t.key] ?? 0})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={ShieldAlert} title="No requests in this view" desc="Submit a new emergency access request to get started." />
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <Card key={r.id} className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4 flex-wrap">
                <PatientTag patientId={r.patientId} />
                <Badge tone={r.status === "approved" ? "approved" : r.status === "pending_review" ? "pending_review" : "rejected"}>
                  {r.status.replace("_", " ")}
                </Badge>
                <RiskBadge score={r.riskScore} />
                <span className="text-xs text-mist">{hospitals[r.hospitalId] || "Unknown hospital"}</span>
                <span className="text-xs text-mist font-mono">{new Date(r.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" className="text-xs px-3 py-2" onClick={() => setDetailRequest(r)}>
                  <Eye size={13} /> Details
                </Button>
                {r.status === "pending_review" && <ResubmitButton request={r} onDone={load} />}
              </div>
            </Card>
          ))}
        </div>
      )}

      <NewRequestModal open={newModalOpen} onClose={() => setNewModalOpen(false)} defaultPatientId={searchParams.get("patientId") || ""} onCreated={load} />

      <Modal open={!!detailRequest} onClose={() => setDetailRequest(null)} title="Request details">
        {detailRequest && (
          <div className="space-y-3 text-sm">
            <Row label="Patient" value={`#${detailRequest.patientId.slice(0, 10)}`} />
            <Row label="Status" value={detailRequest.status.replace("_", " ")} />
            <Row label="Risk score" value={detailRequest.riskScore} />
            <Row label="Hospital" value={hospitals[detailRequest.hospitalId] || "Unknown"} />
            <Row label="Reason" value={detailRequest.reason} />
            <Row label="Created" value={new Date(detailRequest.createdAt).toLocaleString()} />
            {detailRequest.expiresAt && <Row label="Expires" value={new Date(detailRequest.expiresAt).toLocaleString()} />}
            <Row label="Info scope" value={detailRequest.infoScope?.join(", ")} />
          </div>
        )}
      </Modal>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-line last:border-0">
      <span className="text-mist">{label}</span>
      <span className="text-paper text-right">{value}</span>
    </div>
  );
}

function ResubmitButton({ request, onDone }) {
  const [busy, setBusy] = useState(false);

  async function resubmit() {
    setBusy(true);
    try {
      await doctorApi.createAccessRequest({
        patientId: request.patientId,
        reason: `Resubmission following manual review: ${request.reason}`,
        gpsMatchesHospital: true,
      });
      onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="subtle" className="text-xs px-3 py-2" onClick={resubmit} disabled={busy}>
      <RotateCw size={13} /> {busy ? "Resubmitting…" : "Resubmit"}
    </Button>
  );
}

function NewRequestModal({ open, onClose, defaultPatientId, onCreated }) {
  const [patientId, setPatientId] = useState(defaultPatientId);
  const [reason, setReason] = useState("");
  const [gpsMatches, setGpsMatches] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (open) {
      setPatientId(defaultPatientId);
      setReason("");
      setError("");
      setResult(null);
    }
  }, [open, defaultPatientId]);

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!patientId.trim()) {
      setError("Patient ID is required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await doctorApi.createAccessRequest({ patientId: patientId.trim(), reason, gpsMatchesHospital: gpsMatches });
      setResult(res);
      onCreated();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New emergency access request">
      {result ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge tone={result.request.status === "approved" ? "approved" : result.request.status === "pending_review" ? "pending_review" : "rejected"}>
              {result.request.status.replace("_", " ")}
            </Badge>
            <RiskBadge score={result.request.riskScore} />
          </div>
          <ul className="text-xs text-mist space-y-1">
            {result.riskFactors?.map((f, i) => (
              <li key={i}>
                • {f.factor} ({f.weight > 0 ? "+" : ""}
                {f.weight})
              </li>
            ))}
          </ul>
          <Button className="w-full" onClick={onClose}>
            Done
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="Patient ID">
            <input className={inputCls} value={patientId} onChange={(e) => setPatientId(e.target.value)} placeholder="Paste the patient's ID" />
          </Field>
          <Field label="Reason for access">
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Chest pain evaluation" />
          </Field>
          <label className="flex items-center gap-2 text-sm text-paper">
            <input type="checkbox" checked={gpsMatches} onChange={(e) => setGpsMatches(e.target.checked)} className="accent-vital" />
            My current location matches my hospital
          </label>
          <ErrorText>{error}</ErrorText>
          <Button type="submit" className="w-full" disabled={submitting}>
            <Clock size={15} /> {submitting ? "Submitting…" : "Submit request"}
          </Button>
        </form>
      )}
    </Modal>
  );
}
