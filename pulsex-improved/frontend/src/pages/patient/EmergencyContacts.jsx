import { useEffect, useState } from "react";
import { Users, Plus, Pencil, Trash2, Star } from "lucide-react";
import { patientApi } from "../../lib/patientApi";
import { Card, PageHeader, Button, Field, inputCls, Modal, ErrorText, SkeletonCard, EmptyState, ErrorState, IconButton, Badge } from "../../components/ui";

const emptyForm = { name: "", phone: "", relation: "", primary: false };

export default function EmergencyContacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    setError(null);
    patientApi
      .me()
      .then((p) => setContacts(p.emergencyContacts || []))
      .catch((err) => setError(err.response?.data?.error || "Failed to load emergency contacts"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function openAdd() {
    setForm(emptyForm);
    setEditIndex(null);
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(i) {
    setForm({ ...emptyForm, ...contacts[i] });
    setEditIndex(i);
    setFormError("");
    setModalOpen(true);
  }

  async function persist(nextContacts) {
    await patientApi.updateEmergencyContacts(nextContacts);
    setContacts(nextContacts);
  }

  async function submit(e) {
    e.preventDefault();
    setFormError("");
    if (!form.name || !form.phone) {
      setFormError("Name and phone are required");
      return;
    }
    setSaving(true);
    try {
      let next = [...contacts];
      if (form.primary) next = next.map((c) => ({ ...c, primary: false }));
      if (editIndex === null) {
        next = [...next, form];
      } else {
        next[editIndex] = form;
      }
      await persist(next);
      setModalOpen(false);
    } catch (err) {
      setFormError(err.response?.data?.error || "Failed to save contact");
    } finally {
      setSaving(false);
    }
  }

  async function remove(i) {
    const next = contacts.filter((_, idx) => idx !== i);
    await persist(next);
  }

  return (
    <div>
      <PageHeader
        title="Emergency Contacts"
        subtitle="Shared with emergency responders and family notifications"
        action={
          <Button onClick={openAdd}>
            <Plus size={15} /> Add contact
          </Button>
        }
      />

      {loading ? (
        <SkeletonCard />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : contacts.length === 0 ? (
        <EmptyState icon={Users} title="No emergency contacts yet" desc="Add at least one contact so responders can reach your family." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {contacts.map((c, i) => (
            <Card key={i} className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-surface2 border border-line flex items-center justify-center shrink-0">
                  <Users size={16} className="text-mist" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-paper truncate">{c.name}</p>
                    {c.primary && (
                      <Badge tone="vital">
                        <Star size={10} className="fill-current" /> Primary
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-mist mt-0.5">{c.phone}</p>
                  {c.relation && <p className="text-xs text-mist/70 mt-0.5">{c.relation}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <IconButton icon={Pencil} onClick={() => openEdit(i)} />
                <IconButton icon={Trash2} onClick={() => remove(i)} className="hover:text-pulse" />
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editIndex === null ? "Add emergency contact" : "Edit emergency contact"}>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Name">
            <input className={inputCls} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </Field>
          <Field label="Phone number">
            <input className={inputCls} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </Field>
          <Field label="Relation (optional)">
            <input className={inputCls} placeholder="e.g. Mother, Spouse" value={form.relation} onChange={(e) => setForm((f) => ({ ...f, relation: e.target.value }))} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-paper">
            <input
              type="checkbox"
              checked={!!form.primary}
              onChange={(e) => setForm((f) => ({ ...f, primary: e.target.checked }))}
              className="accent-vital"
            />
            Set as primary contact
          </label>
          <ErrorText>{formError}</ErrorText>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Saving…" : "Save contact"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
