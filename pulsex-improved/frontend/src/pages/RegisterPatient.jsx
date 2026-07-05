import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HeartPulse, ArrowRight } from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Button, Field, inputCls, ErrorText, PasswordInput } from "../components/ui";
import AuthLayout from "../components/AuthLayout";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function RegisterPatient() {
  const { loginSuccess } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", bloodGroup: "O+", emergencyPin: "", dob: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register/patient", form);
      loginSuccess(data);
      navigate("/patient");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      icon={HeartPulse}
      accent="vital"
      eyebrow="Patient portal"
      title="Your record, private by default."
      subtitle="Create your PulseX AI record once — it stays locked until you or a scored emergency grants access."
      points={["Nothing shared without your consent", "Emergency PIN unlocks manual paramedic lookup", "Full history of every access, forever"]}
    >
      <h1 className="font-display text-2xl font-semibold mb-1">Create patient account</h1>
      <p className="text-mist text-sm mb-6">Takes about a minute</p>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name">
          <input className={inputCls} required value={form.name} onChange={set("name")} />
        </Field>
        <Field label="Email">
          <input className={inputCls} type="email" autoComplete="email" required value={form.email} onChange={set("email")} />
        </Field>
        <Field label="Password (min 8 characters)">
          <PasswordInput autoComplete="new-password" minLength={8} required value={form.password} onChange={set("password")} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
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
        <Field label="Emergency PIN (4-6 digits)">
          <input className={inputCls} inputMode="numeric" minLength={4} maxLength={6} required value={form.emergencyPin} onChange={set("emergencyPin")} />
        </Field>
        <ErrorText>{error}</ErrorText>
        <Button type="submit" className="w-full group" disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
          {!loading && <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />}
        </Button>
      </form>
      <p className="text-center text-sm text-mist mt-6">
        Already registered? <Link to="/login/patient" className="text-vital hover:underline font-medium">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
