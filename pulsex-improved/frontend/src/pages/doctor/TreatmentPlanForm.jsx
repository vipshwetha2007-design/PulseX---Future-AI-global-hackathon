import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ClipboardList, CheckCircle2 } from "lucide-react";
import { doctorApi } from "../../lib/doctorApi";
import { Card, PageHeader, Field, inputCls, Textarea, Button, ErrorText } from "../../components/ui";
import PatientTag from "../../components/doctor/PatientTag";

export default function TreatmentPlanForm() {
  const { patientId } = useParams();
  const [form, setForm] = useState({ notes: "", followUpDate: "", recommendations: "", lifestyleAdvice: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!form.notes.trim()) {
      setError("Treatment notes are required");
      return;
    }
    setSubmitting(true);
    try {
      const notes = [
        form.notes,
        form.followUpDate && `Follow-up date: ${new Date(form.followUpDate).toLocaleDateString()}`,
        form.recommendations && `Recommendations: ${form.recommendations}`,
        form.lifestyleAdvice && `Lifestyle advice: ${form.lifestyleAdvice}`,
      ]
        .filter(Boolean)
        .join("\n");
      await doctorApi.addRecord(patientId, { type: "treatment_plan", title: "Treatment Plan", notes });
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save treatment plan — you may no longer have an active access grant");
    } finally {
      setSubmitting(false);
    }
  }

  if (saved) {
    return (
      <Card className="max-w-lg mx-auto text-center py-10">
        <CheckCircle2 className="text-vital mx-auto mb-3" size={32} />
        <h1 className="font-display text-xl font-semibold mb-2">Treatment plan saved</h1>
        <p className="text-mist text-sm mb-6">Attached to the patient's record and visible on their timeline.</p>
        <Link to={`/doctor/patients/${patientId}/access`}>
          <Button variant="ghost">Back to patient</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Treatment Plan" subtitle={<PatientTag patientId={patientId} />} />
      <Card>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Treatment notes">
            <Textarea value={form.notes} onChange={set("notes")} placeholder="Overall plan and approach" />
          </Field>
          <Field label="Follow-up date">
            <input type="date" className={inputCls} value={form.followUpDate} onChange={set("followUpDate")} />
          </Field>
          <Field label="Recommendations">
            <Textarea value={form.recommendations} onChange={set("recommendations")} placeholder="Specific clinical recommendations" />
          </Field>
          <Field label="Lifestyle advice">
            <Textarea value={form.lifestyleAdvice} onChange={set("lifestyleAdvice")} placeholder="Diet, activity, habits" />
          </Field>
          <ErrorText>{error}</ErrorText>
          <Button type="submit" className="w-full" disabled={submitting}>
            <ClipboardList size={15} /> {submitting ? "Saving…" : "Save treatment plan"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
