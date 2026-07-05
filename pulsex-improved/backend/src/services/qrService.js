import QRCode from "qrcode";
import { db, id, persist } from "../db/store.js";
import { encrypt, decrypt } from "../utils/crypto.js";

export async function generateQrForPatient(patientId) {
  // Revoke any currently active token before issuing a new one.
  db().qrTokens.filter((t) => t.patientId === patientId && t.active).forEach((t) => {
    t.active = false;
    t.revokedAt = new Date().toISOString();
  });

  const rawPayload = JSON.stringify({ patientId, issuedAt: Date.now() });
  const token = encrypt(rawPayload);
  const dataUrl = await QRCode.toDataURL(token, { errorCorrectionLevel: "H", margin: 2, width: 320 });
  const record = { id: id(), patientId, token, dataUrl, active: true, createdAt: new Date().toISOString(), revokedAt: null };
  db().qrTokens.push(record);
  persist();

  return { token, dataUrl, tokenId: record.id };
}

export function resolveQrToken(token) {
  const record = db().qrTokens.find((t) => t.token === token);
  if (!record || !record.active) return null;
  try {
    const payload = JSON.parse(decrypt(token));
    if (payload.patientId !== record.patientId) return null;
    return record;
  } catch {
    return null;
  }
}

export function revokeQr(patientId) {
  const tokens = db().qrTokens.filter((t) => t.patientId === patientId && t.active);
  tokens.forEach((t) => {
    t.active = false;
    t.revokedAt = new Date().toISOString();
  });
  persist();
  return tokens.length;
}

export function registerNfcCard(patientId, cardUid) {
  // Registering a new card replaces any currently active one for this patient.
  db().nfcCards.filter((c) => c.patientId === patientId && c.active).forEach((c) => {
    c.active = false;
    c.revokedAt = new Date().toISOString();
  });
  const record = { id: id(), patientId, cardUid: encrypt(cardUid), active: true, createdAt: new Date().toISOString() };
  db().nfcCards.push(record);
  persist();
  return record;
}

export function resolveNfcCard(cardUid) {
  return db().nfcCards.find((c) => {
    if (!c.active) return false;
    try {
      return decrypt(c.cardUid) === cardUid;
    } catch {
      return false;
    }
  });
}
