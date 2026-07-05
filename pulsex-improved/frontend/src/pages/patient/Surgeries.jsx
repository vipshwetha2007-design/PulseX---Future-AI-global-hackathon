import { useEffect, useState } from "react";
import { Scissors, Plus } from "lucide-react";
import { patientApi } from "../../lib/patientApi";
import { Card, PageHeader, Button, Field, inputCls, Textarea, Modal, ErrorText, SkeletonCard, EmptyState, ErrorState } from "../../components/ui";

export default function Surgeries() {
  const [surgeries, setSurgeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", date: "", notes: "" });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    setError(null);
    patientApi
      .me()
      .then((p) => setSurgeries(p.surgeries || []))
      .catch((err) => setError(err.response?.data?.error || "Failed to load surgeries"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function submit(e) {
    e.preventDefault();
    setFormError("");
    if (!form.name || !form.date) {
      setFormError("Name and date are required");
      return;
    }
    setSaving(true);
    try {
      const updated = [...surgeries, form];
      await patientApi.updateMe({ surgeries: updated });
      setSurgeries(updated);
      setForm({ name: "", date: "", notes: "" });
      setModalOpen(false);
    } catch (err) {
      setFormError(err.response?.data?.error || "Failed to add surgery");
    } finally {
      setSaving(false);
    }
  }

  const sorted = [...surgeries]
    .map((s, i) => (typeof s === "string" ? { name: s, date: null, notes: "", _i: i } : { ...s, _i: i }))
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  return (
    <div>
      <PageHeader
        title="Surgeries"
        subtitle="Surgical history, most recent first"
        action={
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={15} /> Add surgery
          </Button>
        }
      />

      {loading ? (
        <SkeletonCard />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : sorted.length === 0 ? (
        <EmptyState icon={Scissors} title="No surgical history on record" desc="Add past surgeries so your care team has full context." />
      ) : (
        <div className="relative pl-8">
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-line" />
          <div className="space-y-6">
            {sorted.map((s) => (
              <div key={s._i} className="relative">
                <div className="absolute -left-8 top-1 w-8 h-8 rounded-full bg-surface2 border border-line flex items-center justify-center">
                  <Scissors size={13} className="text-amber" />
                </div>
                <Card>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <p className="font-medium text-paper">{s.name}</p>
                    <span className="text-xs text-mist font-mono">{s.date ? new Date(s.date).toLocaleDateString() : "Date unknown"}</span>
                  </div>
                  {s.notes && <p className="text-sm text-mist mt-2">{s.notes}</p>}
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add surgery">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Surgery name">
            <input className={inputCls} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </Field>
          <Field label="Date">
            <input type="date" className={inputCls} value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
          </Field>
          <Field label="Notes (optional)">
            <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </Field>
          <ErrorText>{formError}</ErrorText>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Adding…" : "Add surgery"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
