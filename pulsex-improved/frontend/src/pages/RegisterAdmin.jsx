import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, ArrowRight } from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Button, Field, inputCls, ErrorText, PasswordInput } from "../components/ui";
import AuthLayout from "../components/AuthLayout";

export default function RegisterAdmin() {
  const { loginSuccess } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register/admin", form);
      loginSuccess(data);
      navigate("/admin");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      icon={ShieldCheck}
      accent="amber"
      eyebrow="Admin bootstrap"
      title="Govern the platform with full visibility."
      subtitle="One-time setup for the first administrator account — verify hospitals, monitor fraud, tune the AI engine."
      points={["Real-time platform analytics", "Complete, immutable audit trail", "Configurable AI risk thresholds"]}
    >
      <h1 className="font-display text-2xl font-semibold mb-1">Admin bootstrap</h1>
      <p className="text-mist text-sm mb-6">Only available before the first admin account exists</p>
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
        <ErrorText>{error}</ErrorText>
        <Button type="submit" className="w-full group" disabled={loading}>
          {loading ? "Creating account…" : "Create admin account"}
          {!loading && <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />}
        </Button>
      </form>
      <p className="text-center text-sm text-mist mt-6">
        Already registered? <Link to="/login/admin" className="text-vital hover:underline font-medium">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
