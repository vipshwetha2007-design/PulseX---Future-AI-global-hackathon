import { useEffect, useState } from "react";
import { QrCode as QrIcon, RefreshCw, Download, Copy, Check, ShieldOff } from "lucide-react";
import { patientApi } from "../../lib/patientApi";
import { downloadDataUrl } from "../../lib/download";
import { Card, PageHeader, Button, SkeletonCard, ErrorState, Badge } from "../../components/ui";

export default function QrCodePage() {
  const [patient, setPatient] = useState(null);
  const [qr, setQr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  function load() {
    setLoading(true);
    setError(null);
    Promise.all([patientApi.me(), patientApi.qrStatus()])
      .then(([p, q]) => {
        setPatient(p);
        setQr(q);
      })
      .catch((err) => setError(err.response?.data?.error || "Failed to load QR status"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function regenerate() {
    setBusy(true);
    try {
      const res = await patientApi.generateQr();
      setQr({ active: true, dataUrl: res.dataUrl });
    } finally {
      setBusy(false);
    }
  }

  async function revoke() {
    setBusy(true);
    try {
      await patientApi.revokeQr();
      setQr({ active: false });
    } finally {
      setBusy(false);
    }
  }

  function copyId() {
    if (!patient?.id) return;
    navigator.clipboard.writeText(patient.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  if (loading) return <SkeletonCard />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <PageHeader title="QR Code" subtitle="Encrypted, revocable — reveals nothing until scanned by a verified paramedic or doctor" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="flex flex-col items-center text-center py-8">
          {qr?.active && qr.dataUrl ? (
            <img src={qr.dataUrl} alt="Emergency QR code" className="w-56 h-56 rounded-xl border border-line bg-white p-3" />
          ) : (
            <div className="w-56 h-56 rounded-xl border border-dashed border-line flex flex-col items-center justify-center gap-2 text-mist">
              <QrIcon size={28} strokeWidth={1.5} />
              <span className="text-sm">No active QR code</span>
            </div>
          )}
          <div className="flex items-center gap-3 mt-6">
            <Button onClick={regenerate} disabled={busy}>
              <RefreshCw size={15} /> {qr?.active ? "Regenerate" : "Generate"}
            </Button>
            {qr?.active && qr.dataUrl && (
              <Button variant="ghost" onClick={() => downloadDataUrl("pulsex-emergency-qr.png", qr.dataUrl)}>
                <Download size={15} /> Download
              </Button>
            )}
          </div>
          {qr?.active && (
            <button onClick={revoke} disabled={busy} className="mt-4 text-xs text-pulse hover:underline inline-flex items-center gap-1">
              <ShieldOff size={12} /> Revoke access
            </button>
          )}
        </Card>

        <Card>
          <h2 className="font-display text-base font-medium mb-4">How this QR code works</h2>
          <ul className="space-y-3 text-sm text-mist">
            <li>• The QR encodes an encrypted, single-use identifier — never your actual medical data.</li>
            <li>• Scanning it by a verified paramedic grants exactly 30 minutes of scoped emergency info.</li>
            <li>• Regenerating immediately invalidates any previously printed or saved QR code.</li>
            <li>• You can revoke access at any time, even mid-emergency-window.</li>
          </ul>
          <div className="mt-6 pt-5 border-t border-line">
            <p className="text-xs uppercase tracking-wide text-mist mb-2">Patient ID</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-surface2 border border-line rounded-lg px-3 py-2 text-xs font-mono truncate">{patient?.id}</code>
              <Button variant="subtle" onClick={copyId}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </Button>
            </div>
            {qr?.active && <Badge tone="approved">QR active</Badge>}
          </div>
        </Card>
      </div>
    </div>
  );
}
