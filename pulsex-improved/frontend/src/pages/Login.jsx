import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { HeartPulse, Stethoscope, Ambulance, ShieldCheck, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button, Field, inputCls, ErrorText, PasswordInput } from "../components/ui";
import AuthLayout from "../components/AuthLayout";

const ROLE_HOME = { patient: "/patient", doctor: "/doctor", paramedic: "/ambulance", admin: "/admin" };
const ROLE_LABEL = { patient: "Patient", doctor: "Doctor", paramedic: "Ambulance", admin: "Admin" };
const ROLE_REGISTER = { patient: "/register/patient", doctor: "/register/doctor", paramedic: "/register/paramedic", admin: "/register/admin" };

const ROLE_META = {
  patient: {
    icon: HeartPulse,
    accent: "vital",
    subtitle: "View your record, manage consent, and see exactly who accessed your data and when.",
    points: ["Your record is locked by default", "Every access attempt is logged", "Revoke consent in one tap"],
  },
  doctor: {
    icon: Stethoscope,
    accent: "vital",
    subtitle: "Request scoped emergency access, document care, and get AI medication safety checks.",
    points: ["AI-scored emergency requests", "Automatic 30-minute access windows", "Full patient timeline on approval"],
  },
  paramedic: {
    icon: Ambulance,
    accent: "pulse",
    subtitle: "Scan a QR, NFC card, or manual ID to pull critical info in seconds — even offline.",
    points: ["Blood group & allergies in one scan", "No standing access, ever", "Built for gloved hands & bright light"],
  },
  admin: {
    icon: ShieldCheck,
    accent: "amber",
    subtitle: "Verify hospitals, monitor fraud signals, and tune the AI access-scoring engine.",
    points: ["Real-time platform analytics", "Full audit trail, every action", "Configurable AI risk thresholds"],
  },
};

export default function Login() {
  const { role } = useParams();
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const meta = ROLE_META[role] || ROLE_META.patient;

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(email, password);
      if (data.user.role !== role) {
        logout();
        setError(`This account is registered as ${data.user.role}, not ${role}.`);
        return;
      }
      navigate(ROLE_HOME[data.user.role] || "/");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      icon={meta.icon}
      accent={meta.accent}
      eyebrow={`${ROLE_LABEL[role] || "Sign in"} portal`}
      title={`Welcome back to your ${ROLE_LABEL[role]?.toLowerCase() || ""} workspace.`}
      subtitle={meta.subtitle}
      points={meta.points}
    >
      <h1 className="font-display text-2xl font-semibold mb-1">Sign in</h1>
      <p className="text-mist text-sm mb-7">
        As <span className="text-paper font-medium">{ROLE_LABEL[role] || "user"}</span> — wrong role?{" "}
        <Link to="/" className="text-vital hover:underline">
          Switch
        </Link>
      </p>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email">
          <input
            className={inputCls}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Password">
          <PasswordInput autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <ErrorText>{error}</ErrorText>
        <Button type="submit" className="w-full group" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
          {!loading && <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />}
        </Button>
      </form>
      <p className="text-center text-sm text-mist mt-6">
        New here?{" "}
        <Link to={ROLE_REGISTER[role]} className="text-vital hover:underline font-medium">
          Create a {ROLE_LABEL[role]?.toLowerCase()} account
        </Link>
      </p>
    </AuthLayout>
  );
}
