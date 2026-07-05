import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Users, Search, Clock, FileText, ShieldCheck } from "lucide-react";
import { doctorApi } from "../../lib/doctorApi";
import { groupByPatient, isActiveGrant } from "../../lib/doctorAccess";
import { Card, PageHeader, Badge, Button, inputCls, SkeletonCard, EmptyState, ErrorState } from "../../components/ui";
import RiskBadge from "../../components/doctor/RiskBadge";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active Access" },
  { key: "pending_review", label: "Pending Review" },
  { key: "rejected", label: "Rejected" },
  { key: "expired", label: "Expired" },
];

const SORTS = [
  { key: "recent", label: "Most recent" },
  { key: "risk", label: "Highest risk" },
];

export default function AssignedPatients() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("recent");

  function load() {
    setLoading(true);
    setError(null);
    doctorApi
      .accessRequests()
      .then(setRequests)
      .catch((err) => setError(err.response?.data?.error || "Failed to load assigned patients"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const patients = useMemo(() => {
    let list = groupByPatient(requests);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((p) => p.patientId.toLowerCase().includes(q));
    }
    if (filter === "active") list = list.filter(isActiveGrant);
    else if (filter === "expired") list = list.filter((p) => p.status === "approved" && !isActiveGrant(p));
    else if (filter !== "all") list = list.filter((p) => p.status === filter);

    if (sort === "risk") list = [...list].sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0));
    else list = [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return list;
  }, [requests, query, filter, sort]);

  return (
    <div>
      <PageHeader
        title="Assigned Patients"
        subtitle="Patients you've requested emergency access for — PulseX AI doesn't expose a general patient directory"
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-mist" />
          <input className={`${inputCls} pl-9`} placeholder="Search by patient ID…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <select className={`${inputCls} sm:w-48`} value={sort} onChange={(e) => setSort(e.target.value)}>
          {SORTS.map((s) => (
            <option key={s.key} value={s.key}>Sort: {s.label}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`text-xs font-mono px-3 py-1.5 rounded-full border transition ${
              filter === f.key ? "bg-vital/10 text-vital border-vital/30" : "text-mist border-line hover:border-vital/30 hover:text-paper"
            }`}
          >
            {f.label}
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
      ) : patients.length === 0 ? (
        <EmptyState icon={Users} title="No matching patients" desc="Requests you make for emergency access will populate this list." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {patients.map((p) => {
            const active = isActiveGrant(p);
            return (
              <Card key={p.patientId} className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-sm text-paper">Patient #{p.patientId.slice(0, 8)}</p>
                    <p className="text-xs text-mist mt-0.5">Last request {new Date(p.createdAt).toLocaleString()}</p>
                  </div>
                  <Badge tone={active ? "approved" : p.status === "pending_review" ? "pending_review" : p.status === "rejected" ? "rejected" : "default"}>
                    {active ? "Active" : p.status === "approved" ? "Expired" : p.status.replace("_", " ")}
                  </Badge>
                </div>
                <RiskBadge score={p.riskScore} />
                <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-line">
                  {active ? (
                    <>
                      <Link to={`/doctor/patients/${p.patientId}/access`}>
                        <Button variant="subtle" className="text-xs px-3 py-2">
                          <ShieldCheck size={13} /> Emergency Info
                        </Button>
                      </Link>
                      <Link to={`/doctor/patients/${p.patientId}/timeline`}>
                        <Button variant="ghost" className="text-xs px-3 py-2">
                          <FileText size={13} /> Timeline
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <Link to={`/doctor/requests?patientId=${p.patientId}`}>
                      <Button variant="ghost" className="text-xs px-3 py-2">
                        <Clock size={13} /> Request access again
                      </Button>
                    </Link>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
