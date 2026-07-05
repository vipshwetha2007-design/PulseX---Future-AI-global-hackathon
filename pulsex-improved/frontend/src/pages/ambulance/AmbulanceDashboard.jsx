import { useCallback, useEffect, useRef, useState } from "react";
import { ScanLine, KeyRound, Nfc, Siren, History, ShieldOff, ShieldCheck, ScanEye } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { ambulanceApi } from "../../lib/ambulanceApi";
import { Card, GlassCard, KpiCard, SkeletonCard, EmptyState, ErrorState } from "../../components/ui";
import PulseLine from "../../components/PulseLine";
import { useToast } from "../../components/ambulance/ToastProvider";
import QrScannerModal from "../../components/ambulance/QrScannerModal";
import ManualQrModal from "../../components/ambulance/ManualQrModal";
import NfcEntryModal from "../../components/ambulance/NfcEntryModal";
import EmergencyInfoPanel from "../../components/ambulance/EmergencyInfoPanel";
import RecentScanCard from "../../components/ambulance/RecentScanCard";

export default function AmbulanceDashboard() {
  const { user } = useAuth();
  const toast = useToast();

  const [history, setHistory] = useState([]);
  const [hospitalMap, setHospitalMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeGrant, setActiveGrant] = useState(null);
  // In-memory cache of scoped info per requestId, cleared the moment access
  // expires — this is what makes "reopen" work within the same session
  // without ever persisting sensitive data to disk or after expiry.
  const grantCacheRef = useRef(new Map());

  const [showScanner, setShowScanner] = useState(false);
  const [showManualQr, setShowManualQr] = useState(false);
  const [showNfc, setShowNfc] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cameraUnavailable, setCameraUnavailable] = useState(false);

  const loadHistory = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([ambulanceApi.history(), ambulanceApi.hospitalMap()])
      .then(([logs, map]) => {
        setHistory(logs);
        setHospitalMap(map);
      })
      .catch((err) => setError(err.response?.data?.error || "Failed to load recent scans"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(loadHistory, [loadHistory]);

  function acceptGrant(result) {
    const grant = {
      requestId: result.requestId,
      patientId: result.patientId,
      info: result.info,
      expiresAt: result.expiresAt,
      riskScore: result.riskScore,
    };
    grantCacheRef.current.set(grant.requestId, grant);
    setActiveGrant(grant);
    toast("Emergency access granted — patient record unlocked.", "success");
    if (result.riskScore >= 30) {
      toast(`AI warning: this scan was flagged with an elevated risk score (${result.riskScore}).`, "ai", 7000);
    }
    loadHistory();
  }

  function handleScanError(err, context) {
    const status = err.response?.status;
    const message = err.response?.data?.error;
    if (!err.response) {
      toast("Network error — check your connection and try again.", "error");
    } else if (status === 403) {
      toast(message || "Access denied by automated safety checks.", "error");
    } else if (status === 400) {
      toast(message || `${context} is invalid, expired, or unrecognized.`, "error");
    } else if (status === 401) {
      toast("Session expired. Please sign in again.", "error");
    } else {
      toast(message || "Something went wrong processing that scan.", "error");
    }
  }

  async function submitQr(token) {
    setSubmitting(true);
    try {
      const result = await ambulanceApi.scanQr(token);
      setShowScanner(false);
      setShowManualQr(false);
      acceptGrant(result);
    } catch (err) {
      handleScanError(err, "QR code");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitNfc(cardUid) {
    setSubmitting(true);
    try {
      const result = await ambulanceApi.scanNfc(cardUid);
      setShowNfc(false);
      acceptGrant(result);
    } catch (err) {
      handleScanError(err, "NFC card");
    } finally {
      setSubmitting(false);
    }
  }

  function handleExpire() {
    if (activeGrant) grantCacheRef.current.delete(activeGrant.requestId);
    setActiveGrant(null);
    toast("Emergency access has expired for that patient.", "expired");
    loadHistory();
  }

  function reopen(scan) {
    const cached = grantCacheRef.current.get(scan.id);
    if (cached) setActiveGrant(cached);
  }

  const activeCount = history.filter((h) => h.status === "approved" && h.expiresAt && new Date(h.expiresAt) > new Date()).length;
  const todaysScans = history.filter((h) => new Date(h.createdAt).toDateString() === new Date().toDateString());

  return (
    <div className="space-y-6">
      <GlassCard className="p-6" glow>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-wide text-mist mb-1">Paramedic</p>
            <h1 className="font-display text-2xl font-semibold flex items-center gap-2">
              <Siren className="text-pulse" size={22} /> {user?.name}
            </h1>
            <p className="text-mist text-sm mt-1">Scan a patient's QR code or NFC card to unlock emergency-critical information.</p>
          </div>
        </div>
        <PulseLine height={28} className="mt-5 opacity-60" color="#FF4D5E" />
      </GlassCard>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KpiCard label="Scans Today" value={todaysScans.length} icon={ScanEye} tone="default" />
        <KpiCard label="Active Access" value={activeCount} icon={ShieldCheck} tone="vital" />
        <KpiCard label="Total Scans" value={history.length} icon={History} tone="default" />
      </div>

      {/* Quick actions — large, touch-friendly, minimal clicks */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => {
            setCameraUnavailable(false);
            setShowScanner(true);
          }}
          className="flex flex-col items-center justify-center gap-3 rounded-xl border border-vital/30 bg-vital/10 hover:bg-vital/15 hover:shadow-glow active:scale-[0.98] transition-all py-8 px-4 text-center"
        >
          <ScanLine size={30} className="text-vital" />
          <span className="font-display font-semibold text-paper">Quick Scan</span>
          <span className="text-xs text-mist">Open camera scanner</span>
        </button>

        <button
          onClick={() => setShowManualQr(true)}
          className="flex flex-col items-center justify-center gap-3 rounded-xl border border-line hover:border-vital/40 hover:bg-surface2 active:scale-[0.98] transition-all py-8 px-4 text-center"
        >
          <KeyRound size={28} className="text-mist" />
          <span className="font-display font-semibold text-paper">Manual QR Entry</span>
          <span className="text-xs text-mist">{cameraUnavailable ? "Recommended — camera unavailable" : "Type or paste a token"}</span>
        </button>

        <button
          onClick={() => setShowNfc(true)}
          className="flex flex-col items-center justify-center gap-3 rounded-xl border border-line hover:border-vital/40 hover:bg-surface2 active:scale-[0.98] transition-all py-8 px-4 text-center"
        >
          <Nfc size={28} className="text-mist" />
          <span className="font-display font-semibold text-paper">NFC Card Entry</span>
          <span className="text-xs text-mist">Tap or enter UID</span>
        </button>
      </div>

      {/* Active emergency status */}
      {activeGrant ? (
        <EmergencyInfoPanel grant={activeGrant} onExpire={handleExpire} onClose={() => setActiveGrant(null)} />
      ) : (
        <EmptyState
          icon={ShieldOff}
          title="No active emergency access"
          desc="Scan a patient's QR code or NFC card to grant time-limited access to their critical emergency information."
        />
      )}

      {/* Recent scans */}
      <div>
        <div className="flex items-center gap-2 text-mist text-xs uppercase tracking-wide mb-3">
          <History size={14} /> Recent Scans
        </div>
        {loading ? (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={loadHistory} />
        ) : history.length === 0 ? (
          <EmptyState icon={History} title="No scans yet" desc="Emergency scans you perform will show up here." />
        ) : (
          <div className="space-y-3">
            {history.slice(0, 10).map((scan) => (
              <RecentScanCard
                key={scan.id}
                scan={scan}
                hospitalName={hospitalMap[scan.hospitalId]}
                canReopen={grantCacheRef.current.has(scan.id)}
                onReopen={() => reopen(scan)}
              />
            ))}
          </div>
        )}
      </div>

      {showScanner && (
        <QrScannerModal
          onDetected={submitQr}
          onClose={() => setShowScanner(false)}
          onCameraUnavailable={() => setCameraUnavailable(true)}
        />
      )}
      <ManualQrModal open={showManualQr} onClose={() => setShowManualQr(false)} onSubmit={submitQr} loading={submitting} />
      <NfcEntryModal open={showNfc} onClose={() => setShowNfc(false)} onSubmit={submitNfc} loading={submitting} />
    </div>
  );
}
