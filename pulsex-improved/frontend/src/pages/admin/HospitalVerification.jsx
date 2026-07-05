import { useEffect, useMemo, useState } from "react";
import { Building2, Stethoscope, ShieldCheck, Plus } from "lucide-react";
import { adminApi } from "../../lib/adminApi";
import {
  PageHeader,
  Card,
  Badge,
  Button,
  SearchInput,
  Tabs,
  Table,
  Th,
  Td,
  Tr,
  Pagination,
  usePagination,
  SkeletonCard,
  ErrorState,
  EmptyState,
  Modal,
  Field,
  inputCls,
  ErrorText,
} from "../../components/ui";

export default function HospitalVerification() {
  const [tab, setTab] = useState("hospitals");
  const [hospitals, setHospitals] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  function load() {
    setLoading(true);
    setError(null);
    Promise.all([adminApi.hospitals(), adminApi.doctors()])
      .then(([h, d]) => {
        setHospitals(h);
        setDoctors(d);
      })
      .catch((err) => setError(err.response?.data?.error || "Failed to load hospitals & doctors"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const filteredHospitals = useMemo(() => {
    let list = hospitals;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((h) => h.name?.toLowerCase().includes(q) || h.address?.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [hospitals, query]);

  const filteredDoctors = useMemo(() => {
    let list = doctors;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((d) => d.name?.toLowerCase().includes(q) || d.email?.toLowerCase().includes(q) || d.hospitalName?.toLowerCase().includes(q));
    }
    return list;
  }, [doctors, query]);

  const hospitalPager = usePagination(filteredHospitals, 8);
  const doctorPager = usePagination(filteredDoctors, 8);

  async function verifyHospital(hospitalId) {
    setBusyId(hospitalId);
    try {
      const updated = await adminApi.verifyHospital(hospitalId);
      setHospitals((prev) => prev.map((h) => (h.id === hospitalId ? updated : h)));
      setDoctors((prev) => prev.map((d) => (d.hospitalId === hospitalId ? { ...d, licenseVerified: true } : d)));
    } catch (err) {
      setError(err.response?.data?.error || "Failed to verify hospital");
    } finally {
      setBusyId(null);
    }
  }

  async function verifyDoctor(doctorId) {
    setBusyId(doctorId);
    try {
      const updated = await adminApi.verifyDoctor(doctorId);
      setDoctors((prev) => prev.map((d) => (d.id === doctorId ? { ...d, ...updated } : d)));
    } catch (err) {
      setError(err.response?.data?.error || "Failed to verify doctor");
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
      <PageHeader
        title="Hospitals & Doctors"
        subtitle="Verify institutional and clinical credentials before they can act on emergency access"
        action={
          <Button onClick={() => setShowAdd(true)}>
            <Plus size={15} /> Add Hospital
          </Button>
        }
      />

      <Tabs
        tabs={[
          { key: "hospitals", label: "Hospital Verification", icon: Building2 },
          { key: "doctors", label: "Doctor Verification", icon: Stethoscope },
        ]}
        active={tab}
        onChange={setTab}
      />

      <div className="mb-6">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder={tab === "hospitals" ? "Search hospitals by name or address…" : "Search doctors by name, email, or hospital…"}
        />
      </div>

      {tab === "hospitals" ? (
        <Card>
          {filteredHospitals.length === 0 ? (
            <EmptyState icon={Building2} title="No hospitals found" />
          ) : (
            <>
              <Table>
                <thead>
                  <tr>
                    <Th>Hospital</Th>
                    <Th>Address</Th>
                    <Th>Departments</Th>
                    <Th>Status</Th>
                    <Th className="text-right">Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {hospitalPager.slice.map((h) => (
                    <Tr key={h.id}>
                      <Td className="font-medium">{h.name}</Td>
                      <Td className="text-mist text-xs">{h.address || "—"}</Td>
                      <Td className="text-xs text-mist">{(h.departments || []).slice(0, 3).join(", ") || "—"}</Td>
                      <Td>{h.verified ? <Badge tone="approved">Verified</Badge> : <Badge tone="pending_review">Pending</Badge>}</Td>
                      <Td className="text-right">
                        {h.verified ? (
                          <span className="inline-flex items-center gap-1 text-xs text-mist">
                            <ShieldCheck size={13} className="text-vital" /> Verified
                          </span>
                        ) : (
                          <Button variant="primary" className="!px-3 !py-1.5 text-xs" disabled={busyId === h.id} onClick={() => verifyHospital(h.id)}>
                            {busyId === h.id ? "Verifying…" : "Verify"}
                          </Button>
                        )}
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
              <Pagination page={hospitalPager.page} pageCount={hospitalPager.pageCount} onChange={hospitalPager.setPage} />
            </>
          )}
        </Card>
      ) : (
        <Card>
          {filteredDoctors.length === 0 ? (
            <EmptyState icon={Stethoscope} title="No doctors found" desc="Doctors appear here once they register against a hospital." />
          ) : (
            <>
              <Table>
                <thead>
                  <tr>
                    <Th>Doctor</Th>
                    <Th>Email</Th>
                    <Th>Hospital</Th>
                    <Th>Specialization</Th>
                    <Th>License</Th>
                    <Th className="text-right">Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {doctorPager.slice.map((d) => (
                    <Tr key={d.id}>
                      <Td className="font-medium">{d.name}</Td>
                      <Td className="text-mist font-mono text-xs">{d.email}</Td>
                      <Td className="text-xs text-mist">{d.hospitalName || "—"}</Td>
                      <Td className="text-xs text-mist">{d.specialization || "—"}</Td>
                      <Td>{d.licenseVerified ? <Badge tone="approved">Verified</Badge> : <Badge tone="pending_review">Pending</Badge>}</Td>
                      <Td className="text-right">
                        {d.licenseVerified ? (
                          <span className="inline-flex items-center gap-1 text-xs text-mist">
                            <ShieldCheck size={13} className="text-vital" /> Verified
                          </span>
                        ) : (
                          <Button variant="primary" className="!px-3 !py-1.5 text-xs" disabled={busyId === d.id} onClick={() => verifyDoctor(d.id)}>
                            {busyId === d.id ? "Verifying…" : "Verify"}
                          </Button>
                        )}
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
              <Pagination page={doctorPager.page} pageCount={doctorPager.pageCount} onChange={doctorPager.setPage} />
            </>
          )}
        </Card>
      )}

      <AddHospitalModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onCreated={(h) => {
          setHospitals((prev) => [h, ...prev]);
          setShowAdd(false);
        }}
      />
    </div>
  );
}

function AddHospitalModal({ open, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [departments, setDepartments] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setName("");
      setAddress("");
      setDepartments("");
      setError(null);
    }
  }, [open]);

  async function submit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Hospital name is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const hospital = await adminApi.createHospital({
        name: name.trim(),
        address: address.trim(),
        departments: departments.split(",").map((d) => d.trim()).filter(Boolean),
      });
      onCreated(hospital);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create hospital");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Hospital">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Hospital name">
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Chennai General Emergency Hospital" />
        </Field>
        <Field label="Address">
          <input className={inputCls} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="City, state" />
        </Field>
        <Field label="Departments (comma-separated)">
          <input className={inputCls} value={departments} onChange={(e) => setDepartments(e.target.value)} placeholder="Emergency, Cardiology, ICU" />
        </Field>
        <ErrorText>{error}</ErrorText>
        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Adding…" : "Add hospital"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
