import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Pill, CheckCircle2, ShieldAlert } from "lucide-react";
import { doctorApi } from "../../lib/doctorApi";
import { Card, PageHeader, Field, inputCls, Textarea, Button, ErrorText, Badge } from "../../components/ui";
import PatientTag from "../../components/doctor/PatientTag";

const COMMON_MEDICINES = [
  "Metformin", "Insulin", "Amoxicillin", "Ibuprofen", "Paracetamol", "Warfarin", "Aspirin",
  "Lisinopril", "Atorvastatin", "Simvastatin", "Clarithromycin", "Sildenafil", "Nitroglycerin",
  "Omeprazole", "Amlodipine", "Metoprolol", "Levothyroxine", "Azithromycin", "Ciprofloxacin",
];

const FREQUENCIES = ["Once daily", "Twice daily", "Three times daily", "Every 6 hours", "As needed"];

const SEVERITY_TONE = { critical: "rejected", high: "rejected", medium: "pending_review", low: "default" };

export default function PrescriptionForm() {
  const { patientId } = useParams();
  const [form, setForm] = useState({ medicine: "", dosage: "", frequency: FREQUENCIES[0], duration: "", instructions: "" });
  const [flags, setFlags] = useState({ isPregnant: false, hasKidneyDisease: false, hasLiverDisease: false });
  const [safety, setSafety] = useState(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  const suggestions = useMemo(() => {
    if (!form.medicine.trim()) return [];
    const q = form.medicine.toLowerCase();
    return COMMON_MEDICINES.filter((m) => m.toLowerCase().includes(q) && m.toLowerCase() !== q).slice(0, 5);
  }, [form.medicine]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function runSafetyCheck() {
    if (!form.medicine.trim()) return;
    setChecking(true);
    setSafety(null);
    try {
      const result = await doctorApi.medicationCheck(patientId, { newMedicine: form.medicine, ...flags });
      setSafety(result);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to run medication safety check");
    } finally {
      setChecking(false);
    }
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!form.medicine.trim() || !form.dosage.trim()) {
      setError("Medicine and dosage are required");
      return;
    }
    setSubmitting(true);
    try {
      const notes = [`Dosage: ${form.dosage}`, `Frequency: ${form.frequency}`, form.duration && `Duration: ${form.duration}`, form.instructions && `Instructions: ${form.instructions}`]
        .filter(Boolean)
        .join("\n");
      await doctorApi.addRecord(patientId, { type: "prescription", title: form.medicine, notes });
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save prescription — you may no longer have an active access grant");
    } finally {
      setSubmitting(false);
    }
  }

  if (saved) {
    return (
      <Card className="max-w-lg mx-auto text-center py-10">
        <CheckCircle2 className="text-vital mx-auto mb-3" size={32} />
        <h1 className="font-display text-xl font-semibold mb-2">Prescription saved</h1>
        <p className="text-mist text-sm mb-6">The patient has been notified and this now appears on their record.</p>
        <Link to={`/doctor/patients/${patientId}/access`}>
          <Button variant="ghost">Back to patient</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Prescription Builder" subtitle={<PatientTag patientId={patientId} />} />
      <Card>
        <form onSubmit={submit} className="space-y-4">
          <div className="relative">
            <Field label="Medicine">
              <input className={inputCls} value={form.medicine} onChange={set("medicine")} placeholder="Start typing to search…" autoComplete="off" />
            </Field>
            {suggestions.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-surface2 border border-line rounded-lg overflow-hidden">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="block w-full text-left px-3 py-2 text-sm hover:bg-line/40 transition"
                    onClick={() => setForm((f) => ({ ...f, medicine: s }))}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Dosage">
              <input className={inputCls} value={form.dosage} onChange={set("dosage")} placeholder="e.g. 500mg" />
            </Field>
            <Field label="Frequency">
              <select className={inputCls} value={form.frequency} onChange={set("frequency")}>
                {FREQUENCIES.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Duration">
            <input className={inputCls} value={form.duration} onChange={set("duration")} placeholder="e.g. 7 days" />
          </Field>
          <Field label="Instructions">
            <Textarea value={form.instructions} onChange={set("instructions")} placeholder="e.g. Take after food" />
          </Field>

          <div className="border-t border-line pt-4">
            <p className="text-xs uppercase tracking-wide text-mist mb-2">Patient risk flags for safety check</p>
            <div className="flex flex-wrap gap-4 mb-3">
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
            <Button type="button" variant="subtle" onClick={runSafetyCheck} disabled={checking || !form.medicine.trim()}>
              <ShieldAlert size={14} /> {checking ? "Checking…" : "Run AI safety check"}
            </Button>

            {safety && (
              <div className="mt-4 space-y-2">
                {safety.safe ? (
                  <p className="text-vital text-sm">No conflicts detected against this patient's known allergies and medications.</p>
                ) : (
                  safety.warnings.map((w, i) => (
                    <div key={i} className="border border-line rounded-lg px-3 py-2.5 flex items-start justify-between gap-3">
                      <p className="text-sm text-paper">{w.message}</p>
                      <Badge tone={SEVERITY_TONE[w.severity] || "default"}>{w.severity}</Badge>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <ErrorText>{error}</ErrorText>
          <Button type="submit" className="w-full" disabled={submitting}>
            <Pill size={15} /> {submitting ? "Saving…" : "Save prescription"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
