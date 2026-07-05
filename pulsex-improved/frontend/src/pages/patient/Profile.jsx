import { useEffect, useState } from "react";
import { User, Save, KeyRound, Camera } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { patientApi } from "../../lib/patientApi";
import { Card, PageHeader, Field, inputCls, Button, ErrorText, SkeletonCard } from "../../components/ui";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function Profile() {
  const { user } = useAuth();
  const [patient, setPatient] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinSaved, setPinSaved] = useState(false);
  const [pinSaving, setPinSaving] = useState(false);

  useEffect(() => {
    patientApi
      .me()
      .then((p) => {
        setPatient(p);
        setForm({ bloodGroup: p.bloodGroup || "", dob: p.dob || "", phone: p.phone || "", address: p.address || "" });
      })
      .catch((err) => setError(err.response?.data?.error || "Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setSaved(false);
  };

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const updated = await patientApi.updateMe(form);
      setPatient(updated);
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  async function submitPin(e) {
    e.preventDefault();
    setPinError("");
    if (!/^\d{4,6}$/.test(pin)) {
      setPinError("PIN must be 4-6 digits");
      return;
    }
    setPinSaving(true);
    try {
      await patientApi.updateEmergencyPin(pin);
      setPinSaved(true);
      setPin("");
    } catch (err) {
      setPinError(err.response?.data?.error || "Failed to update PIN");
    } finally {
      setPinSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Profile" subtitle="Your personal, contact, and identity details" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-1 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-surface2 border border-line flex items-center justify-center mb-4 relative">
            <User size={32} className="text-mist" />
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-vital text-ink flex items-center justify-center border-4 border-surface">
              <Camera size={13} />
            </div>
          </div>
          <p className="font-medium">{user?.name}</p>
          <p className="text-xs text-mist mt-1">{patient?.bloodGroup ? `Blood group ${patient.bloodGroup}` : "Patient"}</p>
          <p className="text-xs text-mist/60 mt-3">Photo upload isn't wired to storage in this build.</p>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="font-display text-base font-medium mb-4">Personal & contact information</h2>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Blood group">
                <select className={inputCls} value={form.bloodGroup} onChange={set("bloodGroup")}>
                  {BLOOD_GROUPS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </Field>
              <Field label="Date of birth">
                <input className={inputCls} type="date" value={form.dob} onChange={set("dob")} />
              </Field>
            </div>
            <Field label="Phone number">
              <input className={inputCls} type="tel" placeholder="+91 90000 00000" value={form.phone} onChange={set("phone")} />
            </Field>
            <Field label="Address">
              <input className={inputCls} placeholder="Street, city, state, PIN code" value={form.address} onChange={set("address")} />
            </Field>
            <ErrorText>{error}</ErrorText>
            {saved && <p className="text-vital text-sm">Profile updated.</p>}
            <Button type="submit" disabled={saving}>
              <Save size={15} /> {saving ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </Card>
      </div>

      <Card className="mt-5">
        <div className="flex items-center gap-2 mb-4">
          <KeyRound size={16} className="text-amber" />
          <h2 className="font-display text-base font-medium">Emergency PIN</h2>
        </div>
        <p className="text-sm text-mist mb-4 max-w-lg">
          Used to authenticate you directly during an emergency verification step. Never share this PIN.
        </p>
        <form onSubmit={submitPin} className="flex items-end gap-3 flex-wrap">
          <Field label="New 4-6 digit PIN">
            <input
              className={`${inputCls} max-w-[160px]`}
              inputMode="numeric"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setPinSaved(false);
              }}
            />
          </Field>
          <Button type="submit" variant="subtle" disabled={pinSaving}>
            {pinSaving ? "Updating…" : "Update PIN"}
          </Button>
        </form>
        <div className="mt-3 space-y-1">
          <ErrorText>{pinError}</ErrorText>
          {pinSaved && <p className="text-vital text-sm">PIN updated.</p>}
        </div>
      </Card>
    </div>
  );
}
