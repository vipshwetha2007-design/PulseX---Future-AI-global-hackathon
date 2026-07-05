import { useEffect, useState } from "react";
import { Nfc, ShieldCheck, RefreshCw } from "lucide-react";
import { patientApi } from "../../lib/patientApi";
import { Card, PageHeader, Button, Field, inputCls, Badge, ErrorText, SkeletonCard, ErrorState } from "../../components/ui";

export default function NfcCardPage() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cardUid, setCardUid] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    setError(null);
    patientApi
      .nfcStatus()
      .then(setStatus)
      .catch((err) => setError(err.response?.data?.error || "Failed to load NFC status"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function submit(e) {
    e.preventDefault();
    setFormError("");
    if (!cardUid.trim()) {
      setFormError("Enter the card's UID");
      return;
    }
    setSaving(true);
    try {
      await patientApi.registerNfc(cardUid.trim());
      setCardUid("");
      load();
    } catch (err) {
      setFormError(err.response?.data?.error || "Failed to register card");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <SkeletonCard />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <PageHeader title="NFC Card" subtitle="An alternative to QR for emergency responders with NFC-capable devices" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="flex flex-col items-center text-center py-8">
          <div
            className={`w-20 h-20 rounded-2xl border flex items-center justify-center mb-4 ${
              status?.registered ? "bg-vital/10 border-vital/30" : "border-dashed border-line"
            }`}
          >
            <Nfc size={30} className={status?.registered ? "text-vital" : "text-mist"} strokeWidth={1.5} />
          </div>
          {status?.registered ? (
            <>
              <Badge tone="approved">
                <ShieldCheck size={11} /> Registered
              </Badge>
              <p className="text-xs text-mist mt-3">Registered on {new Date(status.createdAt).toLocaleDateString()}</p>
            </>
          ) : (
            <>
              <Badge tone="default">Not registered</Badge>
              <p className="text-xs text-mist mt-3 max-w-xs">Register a physical NFC card below to enable tap-to-scan emergency access.</p>
            </>
          )}
        </Card>

        <Card>
          <h2 className="font-display text-base font-medium mb-1">{status?.registered ? "Replace card" : "Register a card"}</h2>
          <p className="text-sm text-mist mb-4">
            Enter the unique ID printed on or encoded into your NFC card. {status?.registered && "Registering a new card deactivates the current one."}
          </p>
          <form onSubmit={submit} className="space-y-4">
            <Field label="Card UID">
              <input className={inputCls} placeholder="e.g. 04:A2:B1:9C:3E:80" value={cardUid} onChange={(e) => setCardUid(e.target.value)} />
            </Field>
            <ErrorText>{formError}</ErrorText>
            <Button type="submit" disabled={saving}>
              <RefreshCw size={15} /> {saving ? "Saving…" : status?.registered ? "Replace card" : "Register card"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
