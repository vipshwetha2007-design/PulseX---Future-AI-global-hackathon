import { useEffect, useRef, useState } from "react";
import { Nfc, RadioTower } from "lucide-react";
import { Modal, Field, inputCls, ErrorText, Button, Badge } from "../ui";

const WEB_NFC_SUPPORTED = typeof window !== "undefined" && "NDEFReader" in window;

export default function NfcEntryModal({ open, onClose, onSubmit, loading }) {
  const [cardUid, setCardUid] = useState("");
  const [formError, setFormError] = useState("");
  const [webNfcState, setWebNfcState] = useState(WEB_NFC_SUPPORTED ? "idle" : "unsupported"); // idle | listening | error
  const readerRef = useRef(null);

  useEffect(() => {
    if (!open) {
      setCardUid("");
      setFormError("");
      setWebNfcState(WEB_NFC_SUPPORTED ? "idle" : "unsupported");
      readerRef.current = null;
    }
  }, [open]);

  async function startWebNfc() {
    if (!WEB_NFC_SUPPORTED) return;
    try {
      // eslint-disable-next-line no-undef
      const reader = new NDEFReader();
      readerRef.current = reader;
      await reader.scan();
      setWebNfcState("listening");
      reader.onreading = (event) => {
        const uid = event.serialNumber || event.message?.records?.[0]?.data;
        if (uid) {
          setWebNfcState("idle");
          onSubmit(String(uid));
        }
      };
      reader.onreadingerror = () => {
        setWebNfcState("error");
        setFormError("Couldn't read that card. Try again or enter the UID manually below.");
      };
    } catch {
      setWebNfcState("error");
      setFormError("NFC access denied or unavailable. Enter the card UID manually below.");
    }
  }

  function handleManualSubmit(e) {
    e.preventDefault();
    const trimmed = cardUid.trim();
    if (!trimmed) {
      setFormError("Enter the NFC card UID.");
      return;
    }
    setFormError("");
    onSubmit(trimmed);
  }

  function handleClose() {
    setCardUid("");
    setFormError("");
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="NFC Card Entry">
      <div className="space-y-5">
        {WEB_NFC_SUPPORTED ? (
          <div className="border border-line rounded-lg p-4 text-center">
            <div
              className={`w-14 h-14 mx-auto rounded-2xl border flex items-center justify-center mb-3 ${
                webNfcState === "listening" ? "bg-vital/10 border-vital/30" : "border-dashed border-line"
              }`}
            >
              <Nfc size={24} className={webNfcState === "listening" ? "text-vital animate-pulse" : "text-mist"} strokeWidth={1.5} />
            </div>
            {webNfcState === "listening" ? (
              <>
                <Badge tone="approved">
                  <RadioTower size={11} /> Listening
                </Badge>
                <p className="text-xs text-mist mt-2">Hold the patient's NFC card near the device.</p>
              </>
            ) : (
              <Button variant="ghost" onClick={startWebNfc} disabled={loading}>
                <Nfc size={15} /> Start NFC Scan
              </Button>
            )}
          </div>
        ) : (
          <p className="text-xs text-mist bg-surface2 border border-line rounded-lg px-3 py-2.5">
            Web NFC isn't supported on this browser/device — enter the card UID manually below.
          </p>
        )}

        <form onSubmit={handleManualSubmit} className="space-y-4">
          <Field label="Card UID (manual fallback)">
            <input
              className={inputCls}
              placeholder="e.g. 04:A2:B1:9C:3E:80"
              value={cardUid}
              onChange={(e) => setCardUid(e.target.value)}
            />
          </Field>
          <ErrorText>{formError}</ErrorText>
          <div className="flex gap-3">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Verifying…" : "Verify & Grant Access"}
            </Button>
            <Button type="button" variant="ghost" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
