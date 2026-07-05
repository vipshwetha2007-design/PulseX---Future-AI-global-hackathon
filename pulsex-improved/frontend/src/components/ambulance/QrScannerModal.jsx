import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, RefreshCw, AlertTriangle, ScanLine, X, SwitchCamera } from "lucide-react";
import { Button, ErrorText } from "../ui";

const SCANNER_ELEMENT_ID = "ambulance-qr-scanner";

/**
 * Full-screen-ish camera scanner. Requests camera permission, lists available
 * cameras (for switching), scans continuously, and stops itself the moment a
 * code is found. If permission is denied or no camera exists, the parent
 * dashboard falls back to the manual QR entry modal — this component just
 * reports that state back up rather than trying to render its own text input.
 */
export default function QrScannerModal({ onDetected, onClose, onCameraUnavailable }) {
  const scannerRef = useRef(null);
  const [cameras, setCameras] = useState([]);
  const [activeCameraId, setActiveCameraId] = useState(null);
  const [status, setStatus] = useState("requesting"); // requesting | scanning | error
  const [error, setError] = useState("");
  const startingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    Html5Qrcode.getCameras()
      .then((list) => {
        if (cancelled) return;
        if (!list || list.length === 0) {
          setStatus("error");
          setError("No camera detected on this device.");
          onCameraUnavailable?.();
          return;
        }
        setCameras(list);
        // Prefer a rear/back camera on mobile devices when the label hints at it.
        const back = list.find((c) => /back|rear|environment/i.test(c.label));
        setActiveCameraId((back || list[0]).id);
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("error");
        setError("Camera permission denied or unavailable. Use manual entry instead.");
        onCameraUnavailable?.();
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeCameraId || startingRef.current) return;
    startingRef.current = true;

    const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
    scannerRef.current = scanner;

    scanner
      .start(
        activeCameraId,
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          // Stop immediately on first hit — one scan per session, per spec.
          scanner
            .stop()
            .catch(() => {})
            .finally(() => {
              scanner.clear().catch(() => {});
              onDetected(decodedText);
            });
        },
        () => {
          // Per-frame "no code found yet" callback — expected noise, ignore.
        }
      )
      .then(() => {
        startingRef.current = false;
        setStatus("scanning");
      })
      .catch((err) => {
        startingRef.current = false;
        setStatus("error");
        setError(err?.message || "Unable to start the camera.");
        onCameraUnavailable?.();
      });

    return () => {
      startingRef.current = false;
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .catch(() => {})
          .finally(() => scannerRef.current?.clear().catch(() => {}));
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCameraId]);

  function switchCamera() {
    if (cameras.length < 2) return;
    const idx = cameras.findIndex((c) => c.id === activeCameraId);
    const next = cameras[(idx + 1) % cameras.length];
    const scanner = scannerRef.current;
    const doSwitch = () => setActiveCameraId(next.id);
    if (scanner) {
      scanner
        .stop()
        .catch(() => {})
        .finally(() => {
          scanner.clear().catch(() => {});
          doSwitch();
        });
    } else {
      doSwitch();
    }
  }

  function handleClose() {
    const scanner = scannerRef.current;
    if (scanner) {
      scanner
        .stop()
        .catch(() => {})
        .finally(() => {
          scanner.clear().catch(() => {});
          onClose();
        });
    } else {
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-md bg-surface border border-line rounded-xl p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold flex items-center gap-2">
            <ScanLine size={18} className="text-vital" /> Scan Patient QR
          </h2>
          <button onClick={handleClose} className="text-mist hover:text-paper transition">
            <X size={20} />
          </button>
        </div>

        {status === "requesting" && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Camera size={28} className="text-mist animate-pulse" />
            <p className="text-sm text-mist">Requesting camera access…</p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <AlertTriangle size={28} className="text-amber" />
            <ErrorText>{error}</ErrorText>
            <Button variant="ghost" onClick={handleClose}>
              Close and use manual entry
            </Button>
          </div>
        )}

        <div className={status === "scanning" ? "block" : "hidden"}>
          <div id={SCANNER_ELEMENT_ID} className="rounded-lg overflow-hidden border border-line" />
          <p className="text-xs text-mist text-center mt-3">Align the patient's QR code within the frame — it scans automatically.</p>
          {cameras.length > 1 && (
            <Button variant="ghost" className="w-full mt-3" onClick={switchCamera}>
              <SwitchCamera size={15} /> Switch camera
            </Button>
          )}
        </div>

        <Button variant="ghost" className="w-full mt-4" onClick={handleClose}>
          <RefreshCw size={15} /> Cancel
        </Button>
      </div>
    </div>
  );
}
