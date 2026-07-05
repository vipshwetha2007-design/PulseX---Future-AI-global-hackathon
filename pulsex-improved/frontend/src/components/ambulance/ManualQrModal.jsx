import { useState } from "react";
import { KeyRound } from "lucide-react";
import { Modal, Field, Textarea, ErrorText, Button } from "../ui";

export default function ManualQrModal({ open, onClose, onSubmit, loading }) {
  const [token, setToken] = useState("");
  const [formError, setFormError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = token.trim();
    if (!trimmed) {
      setFormError("Paste or type the patient's QR token.");
      return;
    }
    if (trimmed.length < 8) {
      setFormError("That doesn't look like a valid QR token.");
      return;
    }
    setFormError("");
    onSubmit(trimmed);
  }

  function handleClose() {
    setToken("");
    setFormError("");
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Manual QR Entry">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="QR Token">
          <Textarea
            placeholder="Paste the token encoded in the patient's QR code…"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            rows={4}
            autoFocus
          />
        </Field>
        <ErrorText>{formError}</ErrorText>
        <div className="flex gap-3">
          <Button type="submit" disabled={loading} className="flex-1">
            <KeyRound size={15} /> {loading ? "Verifying…" : "Verify & Grant Access"}
          </Button>
          <Button type="button" variant="ghost" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
