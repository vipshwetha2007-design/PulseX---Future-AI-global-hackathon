import { useEffect, useMemo, useState } from "react";
import { UserCog, ShieldOff, ShieldCheck } from "lucide-react";
import { adminApi } from "../../lib/adminApi";
import {
  PageHeader,
  Card,
  Badge,
  Button,
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

const ROLE_FILTERS = [
  { key: "all", label: "All roles" },
  { key: "patient", label: "Patients" },
  { key: "doctor", label: "Doctors" },
  { key: "paramedic", label: "Paramedics" },
  { key: "admin", label: "Admins" },
];

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [busyId, setBusyId] = useState(null);

  function load() {
    setLoading(true);
    setError(null);
    adminApi
      .users()
      .then(setUsers)
      .catch((err) => setError(err.response?.data?.error || "Failed to load users"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const filtered = useMemo(() => {
    let list = users;
    if (role !== "all") list = list.filter((u) => u.role === role);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((u) => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [users, role, query]);

  const { page, setPage, pageCount, slice } = usePagination(filtered, 8);

  async function deactivate(userId) {
    setBusyId(userId);
    try {
      await adminApi.deactivateUser(userId);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, deactivated: true } : u)));
    } catch (err) {
      setError(err.response?.data?.error || "Failed to deactivate user");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <PageHeader title="User Management" subtitle={`${users.length} registered user${users.length === 1 ? "" : "s"} across every role`} />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search by name or email…" />
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {ROLE_FILTERS.map((f) => (
          <Pill key={f.key} active={role === f.key} onClick={() => { setRole(f.key); setPage(1); }}>
            {f.label}
          </Pill>
        ))}
      </div>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState icon={UserCog} title="No users found" desc="Try a different search term or role filter." />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Role</Th>
                  <Th>Status</Th>
                  <Th>Joined</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {slice.map((u) => (
                  <Tr key={u.id}>
                    <Td className="font-medium">{u.name}</Td>
                    <Td className="text-mist font-mono text-xs">{u.email}</Td>
                    <Td>
                      <span className="capitalize text-xs">{u.role}</span>
                    </Td>
                    <Td>
                      {u.deactivated ? <Badge tone="rejected">Deactivated</Badge> : <Badge tone="approved">Active</Badge>}
                    </Td>
                    <Td className="text-xs text-mist font-mono">{new Date(u.createdAt).toLocaleDateString()}</Td>
                    <Td className="text-right">
                      {u.deactivated ? (
                        <span className="inline-flex items-center gap-1 text-xs text-mist">
                          <ShieldCheck size={13} /> No action
                        </span>
                      ) : (
                        <Button
                          variant="ghost"
                          className="!px-3 !py-1.5 text-xs"
                          disabled={busyId === u.id}
                          onClick={() => deactivate(u.id)}
                        >
                          <ShieldOff size={13} /> {busyId === u.id ? "Deactivating…" : "Deactivate"}
                        </Button>
                      )}
                    </Td>
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
