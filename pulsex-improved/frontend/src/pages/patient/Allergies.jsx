import { useEffect, useState } from "react";
import { AlertTriangle, Plus, X } from "lucide-react";
import { patientApi } from "../../lib/patientApi";
import { Card, PageHeader, Button, Field, inputCls, Modal, ErrorText, SkeletonCard, EmptyState, ErrorState } from "../../components/ui";

export default function Allergies() {
  const [allergies, setAllergies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [newAllergy, setNewAllergy] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  function load() {
    setLoading(true);
    setError(null);
    patientApi
      .me()
      .then((p) => setAllergies(p.allergies || []))
      .catch((err) => setError(err.response?.data?.error || "Failed to load allergies"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function addAllergy(e) {
    e.preventDefault();
    setFormError("");
    if (!newAllergy.trim()) {
      setFormError("Enter an allergy name");
      return;
    }
    setSaving(true);
    try {
      const updated = [...allergies, newAllergy.trim()];
      await patientApi.updateMe({ allergies: updated });
      setAllergies(updated);
      setNewAllergy("");
      setModalOpen(false);
    } catch (err) {
      setFormError(err.response?.data?.error || "Failed to add allergy");
    } finally {
      setSaving(false);
    }
  }

  async function removeAllergy(name) {
    const updated = allergies.filter((a) => a !== name);
    setAllergies(updated);
    await patientApi.updateMe({ allergies: updated });
  }

  return (
    <div>
      <PageHeader
        title="Allergies"
        subtitle="Shown to emergency responders and doctors during any access grant"
        action={
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={15} /> Add allergy
          </Button>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : allergies.length === 0 ? (
        <EmptyState icon={AlertTriangle} title="No allergies on record" desc="Add any known allergies so emergency responders can see them instantly." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allergies.map((a) => (
            <Card key={a} className="flex items-center justify-between gap-3 border-pulse/20">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-pulse/10 border border-pulse/30 flex items-center justify-center shrink-0">
                  <AlertTriangle size={16} className="text-pulse" />
                </div>
                <span className="font-medium">{a}</span>
              </div>
              <button onClick={() => removeAllergy(a)} className="text-mist hover:text-pulse transition">
                <X size={16} />
              </button>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add allergy">
        <form onSubmit={addAllergy} className="space-y-4">
          <Field label="Allergy name">
            <input className={inputCls} placeholder="e.g. Penicillin" value={newAllergy} onChange={(e) => setNewAllergy(e.target.value)} />
          </Field>
          <ErrorText>{formError}</ErrorText>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Adding…" : "Add allergy"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
