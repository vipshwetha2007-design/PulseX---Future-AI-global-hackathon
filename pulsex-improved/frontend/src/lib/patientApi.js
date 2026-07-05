import api from "./api";

export const patientApi = {
  me: () => api.get("/patient/me").then((r) => r.data),
  updateMe: (payload) => api.put("/patient/me", payload).then((r) => r.data),
  updateEmergencyContacts: (contacts) => api.put("/patient/emergency-contacts", { contacts }).then((r) => r.data),
  updateEmergencyPin: (pin) => api.put("/patient/emergency-pin", { pin }).then((r) => r.data),
  updateConsent: (payload) => api.put("/patient/consent", payload).then((r) => r.data),

  records: () => api.get("/patient/records").then((r) => r.data),
  addRecord: (payload) => api.post("/patient/records", payload).then((r) => r.data),
  timeline: () => api.get("/patient/timeline").then((r) => r.data),
  riskPrediction: () => api.get("/patient/risk-prediction").then((r) => r.data),

  qrStatus: () => api.get("/patient/qr/status").then((r) => r.data),
  generateQr: () => api.post("/patient/qr/generate").then((r) => r.data),
  revokeQr: () => api.post("/patient/qr/revoke").then((r) => r.data),

  nfcStatus: () => api.get("/patient/nfc/status").then((r) => r.data),
  registerNfc: (cardUid) => api.post("/patient/nfc/register", { cardUid }).then((r) => r.data),

  accessHistory: () => api.get("/patient/access-history").then((r) => r.data),
  notifications: () => api.get("/patient/notifications").then((r) => r.data),
  healthSummary: () => api.get("/patient/health-summary").then((r) => r.data),
};
