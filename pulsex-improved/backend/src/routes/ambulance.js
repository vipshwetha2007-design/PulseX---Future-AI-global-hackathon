import { Router } from "express";
import { db, id, persist } from "../db/store.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { resolveQrToken, resolveNfcCard } from "../services/qrService.js";
import { scoreEmergencyRequest } from "../services/aiEngine.js";
import { writeAudit, notify } from "../services/auditService.js";

const router = Router();
router.use(requireAuth, requireRole("paramedic"));

const EMERGENCY_ACCESS_MINUTES = 30;
// Strict ambulance scope — narrower than the doctor emergency scope, per spec:
// blood group, allergies, current medicines, critical (chronic) diseases, emergency contacts. Nothing else.
const AMBULANCE_SCOPE = ["bloodGroup", "allergies", "currentMedicines", "chronicDiseases", "emergencyContacts"];

function myStaff(req) {
  return db().ambulanceStaff.find((s) => s.userId === req.user.id);
}

function issueGrantAndReturnInfo(req, res, patient) {
  const staff = myStaff(req);
  const hospital = db().hospitals.find((h) => h.id === staff.hospitalId);
  const previousRequestsForPatient = db().emergencyRequests.filter((r) => r.patientId === patient.id);

  const { score, decision, factors } = scoreEmergencyRequest({
    doctor: null,
    hospital,
    ambulanceStaff: staff,
    patient,
    previousRequestsForPatient,
    requestedAtHour: new Date().getHours(),
    gpsMatchesHospital: undefined,
  });

  // Ambulance-originated scans are inherently urgent and pre-scoped to the minimal safe
  // dataset, so anything short of an outright reject clears automatically.
  const status = decision === "reject" ? "rejected" : "approved";
  const now = new Date();
  const request = {
    id: id(),
    patientId: patient.id,
    doctorId: null,
    ambulanceStaffId: staff.id,
    hospitalId: staff.hospitalId,
    status,
    riskScore: score,
    decision,
    reason: "Ambulance QR/NFC emergency scan",
    createdAt: now.toISOString(),
    expiresAt: status === "approved" ? new Date(now.getTime() + EMERGENCY_ACCESS_MINUTES * 60000).toISOString() : null,
    infoScope: AMBULANCE_SCOPE,
  };
  db().emergencyRequests.push(request);
  persist();

  writeAudit({
    actorUserId: req.user.id,
    actorRole: "paramedic",
    patientId: patient.id,
    ip: req.ip,
    action: status === "approved" ? "ambulance_scan_approved" : "ambulance_scan_rejected",
    infoViewed: status === "approved" ? AMBULANCE_SCOPE : [],
    reason: request.reason,
  });

  notify(patient.userId, "access_alert", "Your emergency medical information was accessed by ambulance personnel.");
  (patient.familyMemberUserIds || []).forEach((uid) => notify(uid, "family_alert", "Emergency services accessed a family member's medical information."));

  if (status !== "approved") {
    return res.status(403).json({ error: "Access request did not clear automated safety checks", riskFactors: factors });
  }

  const info = {};
  AMBULANCE_SCOPE.forEach((f) => (info[f] = patient[f]));
  res.status(201).json({ info, patientId: patient.id, expiresAt: request.expiresAt, requestId: request.id, riskScore: score });
}

router.post("/scan/qr", (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "token is required" });
  const resolved = resolveQrToken(token);
  if (!resolved) return res.status(400).json({ error: "QR code is invalid, expired, or has been revoked" });
  const patient = db().patients.find((p) => p.id === resolved.patientId);
  if (!patient) return res.status(404).json({ error: "No patient record found for this QR code" });
  issueGrantAndReturnInfo(req, res, patient);
});

router.post("/scan/nfc", (req, res) => {
  const { cardUid } = req.body;
  if (!cardUid) return res.status(400).json({ error: "cardUid is required" });
  const card = resolveNfcCard(cardUid);
  if (!card) return res.status(400).json({ error: "NFC card not recognized or inactive" });
  const patient = db().patients.find((p) => p.id === card.patientId);
  if (!patient) return res.status(404).json({ error: "No patient record found for this NFC card" });
  issueGrantAndReturnInfo(req, res, patient);
});

router.get("/history", (req, res) => {
  const staff = myStaff(req);
  const logs = db().emergencyRequests.filter((r) => r.ambulanceStaffId === staff.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(logs);
});

export default router;
