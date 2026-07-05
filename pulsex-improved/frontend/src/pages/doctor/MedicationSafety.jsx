import { useEffect, useState } from "react";
import { Pill, ShieldAlert, ShieldCheck, AlertOctagon } from "lucide-react";
import { doctorApi } from "../../lib/doctorApi";
import { activePatients } from "../../lib/doctorAccess";
import { Card, PageHeader, Field, inputCls, Button, Badge, ErrorText, EmptyState, SkeletonCard } from "../../components/ui";

const SEVERITY_TONE = { critical: "rejected", high: "rejected", medium: "pending_review", low: "default" };
const SEVERITY_ICON = { critical: AlertOctagon, high: ShieldAlert, medium: ShieldAlert, low: ShieldCheck };

const TYPE_LABEL = {
  drug_interaction: "Drug Interaction",
  allergy_conflict: "Allergy Conflict",
  duplicate_medicine: "Duplicate Medicine",
  pregnancy_warning: "Pregnancy Warning",
  kidney_warning: "Kidney Disease Warning",
  liver_warning: "Liver Disease Warning",
};

export default function MedicationSafety() {
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [patientId, setPatientId] = useState("");
  const [medicine, setMedicine] = useState("");
  const [flags, setFlags] = useState({ isPregnant: false, hasKidneyDisease: false, hasLiverDisease: false });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    doctorApi
      .accessRequests()
      .then((reqs) => setPatients(activePatients(reqs)))
      .finally(() => setLoadingPatients(false));
  }, []);

  async function runCheck(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    if (!patientId || !medicine.trim()) {
      setError("Select a patient and enter a medicine name");
      return;
    }
    setChecking(true);
    try {
      const res = await doctorApi.medicationCheck(patientId, { newMedicine: medicine, ...flags });
      setResult(res);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to run medication safety check");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div>
      <PageHeader title="Medication Safety AI" subtitle="Drug interactions, allergy conflicts, duplicates, and condition-based warnings" />

      <Card className="mb-6">
        {loadingPatients ? (
          <SkeletonCard />
        ) : patients.length === 0 ? (
          <EmptyState icon={Pill} title="No active patient access" desc="You need an active emergency access grant to run a medication safety check." />
        ) : (
          <form onSubmit={runCheck} className="space-y-4">
            <Field label="Patient">
              <select className={inputCls} value={patientId} onChange={(e) => setPatientId(e.target.value)}>
                <option value="">Select an active patient…</option>
                {patients.map((p) => (
                  <option key={p.patientId} value={p.patientId}>
                    Patient #{p.patientId.slice(0, 8)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Medicine to check">
              <input className={inputCls} value={medicine} onChange={(e) => setMedicine(e.target.value)} placeholder="e.g. Ibuprofen" />
            </Field>
            <div className="flex flex-wrap gap-4">
              {[
                ["isPregnant", "Pregnant"],
                ["hasKidneyDisease", "Kidney disease"],
                ["hasLiverDisease", "Liver disease"],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm text-paper">
                  <input type="checkbox" className="accent-vital" checked={flags[key]} onChange={(e) => setFlags((f) => ({ ...f, [key]: e.target.checked }))} />
                  {label}
                </label>
              ))}
            </div>
            <ErrorText>{error}</ErrorText>
            <Button type="submit" disabled={checking}>
              <ShieldAlert size={15} /> {checking ? "Checking…" : "Run safety check"}
            </Button>
          </form>
        )}
      </Card>

      {result && (
        <div className="space-y-3">
          {result.safe ? (
            <Card className="flex items-center gap-3 border-vital/30">
              <ShieldCheck className="text-vital" size={20} />
              <p className="text-sm text-paper">No conflicts detected for this medicine against the patient's known profile.</p>
            </Card>
          ) : (
            result.warnings.map((w, i) => {
              const Icon = SEVERITY_ICON[w.severity] || ShieldAlert;
              return (
                <Card key={i} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-pulse/10 border border-pulse/30 flex items-center justify-center shrink-0">
                    <Icon size={18} className="text-pulse" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge tone={SEVERITY_TONE[w.severity] || "default"}>{w.severity}</Badge>
                      <span className="text-xs text-mist uppercase tracking-wide">{TYPE_LABEL[w.type] || w.type}</span>
                    </div>
                    <p className="text-sm text-paper">{w.message}</p>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
