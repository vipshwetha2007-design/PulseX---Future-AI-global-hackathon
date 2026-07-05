import { useEffect, useState } from "react";
import { Pill, Search } from "lucide-react";
import { patientApi } from "../../lib/patientApi";
import { Card, PageHeader, Badge, inputCls, SkeletonCard, EmptyState, ErrorState } from "../../components/ui";

export default function Prescriptions() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");

  function load() {
    setLoading(true);
    setError(null);
    patientApi
      .records()
      .then((r) => setRecords(r.filter((rec) => rec.type === "prescription")))
      .catch((err) => setError(err.response?.data?.error || "Failed to load prescriptions"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const filtered = records.filter((r) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return r.title.toLowerCase().includes(q) || (r.notes || "").toLowerCase().includes(q) || (r.doctorName || "").toLowerCase().includes(q);
  });

  return (
    <div>
      <PageHeader title="Prescriptions" subtitle="Medicines prescribed by your care team during emergency or clinical access" />

      <div className="relative mb-6 max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-mist" />
        <input
          className={`${inputCls} pl-9`}
          placeholder="Search by medicine or doctor…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Pill}
          title="No prescriptions yet"
          desc="Prescriptions added by a doctor during an emergency access grant will appear here."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((r) => (
            <Card key={r.id}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-vital/10 border border-vital/30 flex items-center justify-center shrink-0">
                  <Pill size={16} className="text-vital" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-paper">{r.title}</p>
                  {r.notes && <p className="text-sm text-mist mt-1">{r.notes}</p>}
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <Badge tone="vital">{new Date(r.date).toLocaleDateString()}</Badge>
                    {r.doctorName ? (
                      <Badge tone="default">Dr. {r.doctorName}{r.doctorSpecialization ? ` · ${r.doctorSpecialization}` : ""}</Badge>
                    ) : (
                      <Badge tone="default">Self-reported</Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
