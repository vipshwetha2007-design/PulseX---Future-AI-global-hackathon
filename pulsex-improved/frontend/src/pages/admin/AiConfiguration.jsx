import { useEffect, useState } from "react";
import { Cpu, ShieldCheck, ShieldAlert, Save } from "lucide-react";
import { adminApi } from "../../lib/adminApi";
import { PageHeader, Card, Button, SectionHeading, SkeletonCard, ErrorState, ErrorText, Badge } from "../../components/ui";

export default function AiConfiguration() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function load() {
    setLoading(true);
    setError(null);
    adminApi
      .aiConfig()
      .then(setConfig)
      .catch((err) => setError(err.response?.data?.error || "Failed to load AI configuration"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function save() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const updated = await adminApi.updateAiConfig(config);
      setConfig(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save configuration");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <SkeletonCard />;
  if (error && !config) return <ErrorState message={error} onRetry={load} />;

  const invalid = config.approveBelow >= config.rejectAtOrAbove;

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Configuration"
        subtitle="Tune the automated decision thresholds used to triage emergency access requests"
        action={
          <Button onClick={save} disabled={saving || invalid}>
            <Save size={15} /> {saving ? "Saving…" : "Save changes"}
          </Button>
        }
      />

      <Card>
        <SectionHeading icon={Cpu} title="Risk Score Thresholds" />
        <p className="text-sm text-mist mb-6 max-w-2xl">
          Every emergency access request is scored 0–100 by the AI risk engine. Requests scoring below the approve threshold
          are auto-approved; requests at or above the reject threshold are auto-rejected. Everything in between is routed to
          manual review.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ThresholdSlider
            label="Auto-approve below"
            icon={ShieldCheck}
            tone="vital"
            value={config.approveBelow}
            onChange={(v) => setConfig((c) => ({ ...c, approveBelow: v }))}
          />
          <ThresholdSlider
            label="Auto-reject at or above"
            icon={ShieldAlert}
            tone="pulse"
            value={config.rejectAtOrAbove}
            onChange={(v) => setConfig((c) => ({ ...c, rejectAtOrAbove: v }))}
          />
        </div>

        {/* Visual band */}
        <div className="mt-8">
          <div className="h-3 rounded-full bg-surface2 overflow-hidden flex">
            <div className="h-full bg-vital" style={{ width: `${config.approveBelow}%` }} />
            <div className="h-full bg-amber" style={{ width: `${Math.max(0, config.rejectAtOrAbove - config.approveBelow)}%` }} />
            <div className="h-full bg-pulse" style={{ width: `${Math.max(0, 100 - config.rejectAtOrAbove)}%` }} />
          </div>
          <div className="flex justify-between text-[11px] text-mist mt-2 font-mono">
            <span>0</span>
            <span>50</span>
            <span>100</span>
          </div>
          <div className="flex gap-4 mt-3 text-xs text-mist">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-vital" /> Auto-approve
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber" /> Manual review
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-pulse" /> Auto-reject
            </span>
          </div>
        </div>

        {invalid && <div className="mt-4"><ErrorText>Approve threshold must be lower than the reject threshold.</ErrorText></div>}
        {error && <div className="mt-4"><ErrorText>{error}</ErrorText></div>}
        {saved && (
          <div className="mt-4">
            <Badge tone="approved">Configuration saved</Badge>
          </div>
        )}
      </Card>
    </div>
  );
}

function ThresholdSlider({ label, icon: Icon, tone, value, onChange }) {
  const toneCls = { vital: "accent-vital text-vital", pulse: "accent-pulse text-pulse" }[tone];
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase tracking-wide text-mist flex items-center gap-1.5">
          <Icon size={13} className={toneCls} /> {label}
        </span>
        <span className={`font-mono text-lg font-medium ${toneCls}`}>{value}</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full h-2 rounded-full bg-surface2 appearance-none cursor-pointer ${toneCls}`}
      />
    </div>
  );
}
