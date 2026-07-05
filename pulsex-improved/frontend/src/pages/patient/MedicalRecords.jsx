import { useEffect, useMemo, useState } from "react";
import { FileText, Search, Plus, Syringe, Stethoscope, ClipboardList, File, FlaskConical } from "lucide-react";
import { patientApi } from "../../lib/patientApi";
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

const TYPE_META = {
  diagnosis: { label: "Diagnosis", icon: Stethoscope, tone: "amber" },
  visit: { label: "Visit", icon: ClipboardList, tone: "vital" },
  treatment_plan: { label: "Treatment Plan", icon: ClipboardList, tone: "amber" },
  discharge_summary: { label: "Discharge Summary", icon: FileText, tone: "default" },
  document: { label: "Document", icon: File, tone: "default" },
  vaccination: { label: "Vaccination", icon: Syringe, tone: "vital" },
  lab_report: { label: "Lab Report", icon: FlaskConical, tone: "default" },
};

function metaFor(type) {
  return TYPE_META[type] || { label: type?.replace(/_/g, " ") || "Record", icon: FileText, tone: "default" };
}

export default function MedicalRecords() {
  const [records, setRecords] = useState([]);
  const [vaccinations, setVaccinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [activeType, setActiveType] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ type: "visit", title: "", date: "", notes: "" });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function load() {
    setLoading(true);
    setError(null);
    Promise.all([patientApi.records(), patientApi.me()])
      .then(([r, p]) => {
        setRecords(r.filter((rec) => rec.type !== "prescription"));
        setVaccinations(p.vaccinations || []);
      })
      .catch((err) => setError(err.response?.data?.error || "Failed to load medical records"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const items = useMemo(() => {
    const fromRecords = records.map((r) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      date: r.date,
      notes: r.notes,
    }));
    const fromVaccinations = vaccinations.map((v, i) => ({
      id: `vaccination-${i}`,
      type: "vaccination",
      title: typeof v === "string" ? v : v.name || "Vaccination",
      date: typeof v === "string" ? null : v.date || null,
      notes: typeof v === "string" ? "" : v.notes || "",
    }));
    return [...fromRecords, ...fromVaccinations].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [records, vaccinations]);

  const filtered = items.filter((it) => {
    const matchesType = activeType === "all" || it.type === activeType;
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || it.title.toLowerCase().includes(q) || (it.notes || "").toLowerCase().includes(q);
    return matchesType && matchesQuery;
  });

  const typeCounts = items.reduce((acc, it) => {
    acc[it.type] = (acc[it.type] || 0) + 1;
    return acc;
  }, {});

  async function submitRecord(e) {
    e.preventDefault();
    setFormError("");
    if (!form.title || !form.date) {
      setFormError("Title and date are required");
      return;
    }
    setSubmitting(true);
    try {
      await patientApi.addRecord(form);
      setModalOpen(false);
      setForm({ type: "visit", title: "", date: "", notes: "" });
      load();
    } catch (err) {
      setFormError(err.response?.data?.error || "Failed to add record");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Medical Records"
        subtitle="Diagnoses, visits, treatments, documents, and vaccinations"
        action={
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={15} /> Add record
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-mist" />
          <input
            className={`${inputCls} pl-9`}
            placeholder="Search records by title or notes…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <FilterChip active={activeType === "all"} onClick={() => setActiveType("all")} label={`All (${items.length})`} />
        {Object.keys(TYPE_META).map((t) =>
          typeCounts[t] ? (
            <FilterChip key={t} active={activeType === t} onClick={() => setActiveType(t)} label={`${metaFor(t).label} (${typeCounts[t]})`} />
          ) : null
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={FileText} title="No matching records" desc="Try a different search or filter, or add a new record." />
      ) : (
        <div className="space-y-3">
          {filtered.map((it) => {
            const meta = metaFor(it.type);
            const Icon = meta.icon;
            return (
              <Card key={it.id} className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-lg bg-surface2 border border-line flex items-center justify-center shrink-0">
                  <Icon size={16} className="text-mist" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-paper">{it.title}</p>
                    <Badge tone={meta.tone}>{meta.label}</Badge>
                  </div>
                  {it.notes && <p className="text-sm text-mist mt-1">{it.notes}</p>}
                </div>
                <span className="text-xs text-mist font-mono shrink-0">
                  {it.date ? new Date(it.date).toLocaleDateString() : "—"}
                </span>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add medical record">
        <form onSubmit={submitRecord} className="space-y-4">
          <Field label="Type">
            <select className={inputCls} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              <option value="visit">Visit</option>
              <option value="diagnosis">Diagnosis</option>
              <option value="treatment_plan">Treatment Plan</option>
              <option value="discharge_summary">Discharge Summary</option>
              <option value="lab_report">Lab Report</option>
              <option value="document">Document</option>
            </select>
          </Field>
          <Field label="Title">
            <input className={inputCls} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </Field>
          <Field label="Date">
            <input type="date" className={inputCls} value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
          </Field>
          <Field label="Notes (optional)">
            <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </Field>
          <ErrorText>{formError}</ErrorText>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Adding…" : "Add record"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}

function FilterChip({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs font-mono px-3 py-1.5 rounded-full border transition ${
        active ? "bg-vital/10 text-vital border-vital/30" : "text-mist border-line hover:border-vital/30 hover:text-paper"
      }`}
    >
      {label}
    </button>
  );
}
