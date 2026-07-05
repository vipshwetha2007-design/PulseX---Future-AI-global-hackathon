import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Stethoscope, CheckCircle2 } from "lucide-react";
import { doctorApi } from "../../lib/doctorApi";
import { Card, PageHeader, Field, inputCls, Textarea, Button, ErrorText } from "../../components/ui";
import PatientTag from "../../components/doctor/PatientTag";

const SEVERITIES = ["Mild", "Moderate", "Severe", "Critical"];

export default function DiagnosisForm() {
  const { patientId } = useParams();
  const [form, setForm] = useState({ diagnosis: "", symptoms: "", observations: "", severity: "Moderate", treatmentNotes: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!form.diagnosis.trim()) {
      setError("Diagnosis is required");
      return;
    }
    setSubmitting(true);
    try {
      const notes = [
        form.symptoms && `Symptoms: ${form.symptoms}`,
        form.observations && `Observations: ${form.observations}`,
        `Severity: ${form.severity}`,
        form.treatmentNotes && `Treatment Notes: ${form.treatmentNotes}`,
      ]
        .filter(Boolean)
        .join("\n");
      await doctorApi.addRecord(patientId, { type: "diagnosis", title: form.diagnosis, notes });
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save diagnosis — you may no longer have an active access grant");
    } finally {
      setSubmitting(false);
    }
  }

  if (saved) {
    return (
      <Card className="max-w-lg mx-auto text-center py-10">
        <CheckCircle2 className="text-vital mx-auto mb-3" size={32} />
        <h1 className="font-display text-xl font-semibold mb-2">Diagnosis saved</h1>
        <p className="text-mist text-sm mb-6">Added to the patient's clinical record and visible on their timeline.</p>
        <div className="flex items-center justify-center gap-3">
          <Link to={`/doctor/patients/${patientId}/access`}>
            <Button variant="ghost">Back to patient</Button>
          </Link>
          <Link to={`/doctor/patients/${patientId}/prescription`}>
            <Button>Add prescription</Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Create Diagnosis" subtitle={<PatientTag patientId={patientId} />} />
      <Card>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Diagnosis">
            <input className={inputCls} value={form.diagnosis} onChange={set("diagnosis")} placeholder="e.g. Acute myocardial infarction" />
          </Field>
          <Field label="Symptoms">
            <Textarea value={form.symptoms} onChange={set("symptoms")} placeholder="Reported and observed symptoms" />
          </Field>
          <Field label="Observations">
            <Textarea value={form.observations} onChange={set("observations")} placeholder="Clinical observations, vitals, exam findings" />
          </Field>
          <Field label="Severity">
            <select className={inputCls} value={form.severity} onChange={set("severity")}>
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Treatment Notes">
            <Textarea value={form.treatmentNotes} onChange={set("treatmentNotes")} placeholder="Immediate treatment / next steps" />
          </Field>
          <ErrorText>{error}</ErrorText>
          <Button type="submit" className="w-full" disabled={submitting}>
            <Stethoscope size={15} /> {submitting ? "Saving…" : "Save diagnosis"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
