import { useEffect, useMemo, useState } from "react";
import { ClipboardList } from "lucide-react";
import { adminApi } from "../../lib/adminApi";
import {
  PageHeader,
  Card,
  Badge,
  SearchInput,
  Pill,
  Table,
  Th,
  Td,
  Tr,
  Pagination,
  usePagination,
  SkeletonCard,
  ErrorState,
  EmptyState,
} from "../../components/ui";

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");

  function load() {
    setLoading(true);
    setError(null);
    adminApi
      .auditLogs()
      .then(setLogs)
      .catch((err) => setError(err.response?.data?.error || "Failed to load audit logs"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const roleOptions = useMemo(() => {
    const roles = [...new Set(logs.map((l) => l.actorRole).filter(Boolean))];
    return [{ key: "all", label: "All actors" }, ...roles.map((r) => ({ key: r, label: r }))];
  }, [logs]);

  const filtered = useMemo(() => {
    let list = logs;
    if (role !== "all") list = list.filter((l) => l.actorRole === role);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (l) =>
          l.action?.toLowerCase().includes(q) ||
          l.reason?.toLowerCase().includes(q) ||
          l.actorUserId?.toLowerCase().includes(q) ||
          l.patientId?.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [logs, role, query]);

  const { page, setPage, pageCount, slice } = usePagination(filtered, 10);

  if (loading) return <SkeletonCard />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <PageHeader title="Audit Logs" subtitle={`${logs.length} recorded event${logs.length === 1 ? "" : "s"} — most recent 500 kept for review`} />

      <div className="mb-4">
        <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search by action, reason, actor, or patient ID…" />
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {roleOptions.map((r) => (
          <Pill key={r.key} active={role === r.key} onClick={() => { setRole(r.key); setPage(1); }}>
            <span className="capitalize">{r.label}</span>
          </Pill>
        ))}
      </div>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No matching audit events" />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Timestamp</Th>
                  <Th>Actor</Th>
                  <Th>Action</Th>
                  <Th>Patient</Th>
                  <Th>Reason</Th>
                  <Th>Info Viewed</Th>
                </tr>
              </thead>
              <tbody>
                {slice.map((log) => (
                  <Tr key={log.id}>
                    <Td className="text-xs font-mono text-mist whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</Td>
                    <Td>
                      <Badge tone="default">
                        <span className="capitalize">{log.actorRole}</span>
                      </Badge>
                    </Td>
                    <Td className="text-xs capitalize">{log.action?.replace(/_/g, " ")}</Td>
                    <Td className="text-xs font-mono text-mist">{log.patientId ? `${log.patientId.slice(0, 8)}…` : "—"}</Td>
                    <Td className="text-xs text-mist max-w-xs truncate">{log.reason || "—"}</Td>
                    <Td className="text-xs text-mist">{(log.infoViewed || []).length ? `${log.infoViewed.length} field(s)` : "—"}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
            <Pagination page={page} pageCount={pageCount} onChange={setPage} />
          </>
        )}
      </Card>
    </div>
  );
}
