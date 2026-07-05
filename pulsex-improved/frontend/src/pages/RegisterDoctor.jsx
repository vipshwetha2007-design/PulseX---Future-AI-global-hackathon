import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Stethoscope, ArrowRight } from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Button, Field, inputCls, ErrorText, PasswordInput } from "../components/ui";
import AuthLayout from "../components/AuthLayout";

export default function RegisterDoctor() {
  const { loginSuccess } = useAuth();
  const navigate = useNavigate();
  const [hospitals, setHospitals] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", hospitalId: "", licenseNumber: "", specialization: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/auth/hospitals").then(({ data }) => {
      setHospitals(data);
      if (data[0]) setForm((f) => ({ ...f, hospitalId: data[0].id }));
    });
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register/doctor", form);
      loginSuccess(data);
      navigate("/doctor");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      icon={Stethoscope}
      accent="vital"
      eyebrow="Doctor portal"
      title="Care backed by scored, time-boxed access."
      subtitle="Your license is verified against your hospital's status before any patient data is exposed."
      points={["AI risk-scores every access request", "Automatic 30-minute access windows", "Built-in medication safety checks"]}
    >
      <h1 className="font-display text-2xl font-semibold mb-1">Doctor registration</h1>
      <p className="text-mist text-sm mb-6">License is verified against your hospital's status</p>
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
        <Field label="Hospital">
          <select className={inputCls} value={form.hospitalId} onChange={set("hospitalId")} required>
            {hospitals.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name} {h.verified ? "" : "(pending verification)"}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Medical license number">
          <input className={inputCls} required value={form.licenseNumber} onChange={set("licenseNumber")} />
        </Field>
        <Field label="Specialization">
          <input className={inputCls} required placeholder="e.g. Emergency Medicine" value={form.specialization} onChange={set("specialization")} />
        </Field>
        <ErrorText>{error}</ErrorText>
        <Button type="submit" className="w-full group" disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
          {!loading && <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />}
        </Button>
      </form>
      <p className="text-center text-sm text-mist mt-6">
        Already registered? <Link to="/login/doctor" className="text-vital hover:underline font-medium">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
