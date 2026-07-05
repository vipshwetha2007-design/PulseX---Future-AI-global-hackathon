import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, id, persist } from "../db/store.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { generateQrForPatient, revokeQr, registerNfcCard } from "../services/qrService.js";
import { buildPatientTimeline, predictHealthRisks } from "../services/aiEngine.js";

const router = Router();
router.use(requireAuth, requireRole("patient"));

function myPatient(req) {
  return db().patients.find((p) => p.userId === req.user.id);
}

router.get("/me", (req, res) => {
  const patient = myPatient(req);
  if (!patient) return res.status(404).json({ error: "Patient profile not found" });
  const { emergencyPin, ...safe } = patient;
  res.json(safe);
});

router.put("/me", (req, res) => {
  const patient = myPatient(req);
  if (!patient) return res.status(404).json({ error: "Patient profile not found" });
  const editable = ["bloodGroup", "dob", "phone", "address", "photoUrl", "allergies", "chronicDiseases", "currentMedicines", "surgeries", "vaccinations"];
  editable.forEach((f) => {
    if (req.body[f] !== undefined) patient[f] = req.body[f];
  });
  persist();
  const { emergencyPin, ...safe } = patient;
  res.json(safe);
});

router.put("/emergency-contacts", (req, res) => {
  const patient = myPatient(req);
  if (!Array.isArray(req.body.contacts)) return res.status(400).json({ error: "contacts must be an array" });
  patient.emergencyContacts = req.body.contacts;
  persist();
  res.json(patient.emergencyContacts);
});

router.put("/emergency-pin", async (req, res) => {
  const patient = myPatient(req);
  const { pin } = req.body;
  if (!pin || pin.length < 4 || pin.length > 6) return res.status(400).json({ error: "PIN must be 4-6 digits" });
  patient.emergencyPin = await bcrypt.hash(pin, 10);
  persist();
  res.json({ ok: true });
});

router.put("/consent", (req, res) => {
  const patient = myPatient(req);
  patient.consent = { ...patient.consent, ...req.body };
  persist();
  res.json(patient.consent);
});

// Medical documents (metadata only for this demo — no binary storage layer)
router.get("/records", (req, res) => {
  const patient = myPatient(req);
  const records = db().medicalRecords.filter((r) => r.patientId === patient.id).map((r) => {
    if (!r.doctorId) return r;
    const doctor = db().doctors.find((d) => d.id === r.doctorId);
    const doctorUser = doctor ? db().users.find((u) => u.id === doctor.userId) : null;
    return { ...r, doctorName: doctorUser?.name || null, doctorSpecialization: doctor?.specialization || null };
  });
  res.json(records);
});

router.post("/records", (req, res) => {
  const patient = myPatient(req);
  const { type, title, date, notes } = req.body;
  if (!type || !title || !date) return res.status(400).json({ error: "type, title, and date are required" });
  const record = { id: id(), patientId: patient.id, type, title, date, doctorId: null, notes: notes || "", fileRef: null };
  db().medicalRecords.push(record);
  persist();
  res.status(201).json(record);
});

router.get("/timeline", (req, res) => {
  const patient = myPatient(req);
  const records = db().medicalRecords.filter((r) => r.patientId === patient.id);
  res.json(buildPatientTimeline(records));
});

router.get("/risk-prediction", (req, res) => {
  const patient = myPatient(req);
  const records = db().medicalRecords.filter((r) => r.patientId === patient.id);
  res.json(predictHealthRisks(patient, records));
});

// QR / NFC
router.get("/qr/status", (req, res) => {
  const patient = myPatient(req);
  const token = db().qrTokens.find((t) => t.patientId === patient.id && t.active);
  res.json(token ? { active: true, id: token.id, createdAt: token.createdAt, dataUrl: token.dataUrl } : { active: false });
});

router.post("/qr/generate", async (req, res) => {
  const patient = myPatient(req);
  const result = await generateQrForPatient(patient.id);
  patient.qrTokenId = result.tokenId;
  persist();
  res.json({ dataUrl: result.dataUrl });
});

router.post("/qr/revoke", (req, res) => {
  const patient = myPatient(req);
  const count = revokeQr(patient.id);
  res.json({ revoked: count });
});

router.get("/nfc/status", (req, res) => {
  const patient = myPatient(req);
  const card = db().nfcCards.find((c) => c.patientId === patient.id && c.active);
  res.json(card ? { registered: true, id: card.id, createdAt: card.createdAt } : { registered: false });
});

router.post("/nfc/register", (req, res) => {
  const patient = myPatient(req);
  const { cardUid } = req.body;
  if (!cardUid) return res.status(400).json({ error: "cardUid is required" });
  const card = registerNfcCard(patient.id, cardUid);
  patient.nfcCardId = card.id;
  persist();
  res.status(201).json({ id: card.id, active: card.active });
});

// Access history — every time this patient's record was viewed, by whom
router.get("/access-history", (req, res) => {
  const patient = myPatient(req);
  const logs = db()
    .auditLogs.filter((l) => l.patientId === patient.id)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .map((log) => {
      const actorUser = db().users.find((u) => u.id === log.actorUserId);
      let hospitalName = null;
      let matchingRequest = null;

      if (log.actorRole === "doctor") {
        const doctor = db().doctors.find((d) => d.userId === log.actorUserId);
        if (doctor) {
          hospitalName = db().hospitals.find((h) => h.id === doctor.hospitalId)?.name || null;
          matchingRequest = db()
            .emergencyRequests.filter((r) => r.doctorId === doctor.id && r.patientId === patient.id)
            .sort((a, b) => Math.abs(new Date(a.createdAt) - new Date(log.timestamp)) - Math.abs(new Date(b.createdAt) - new Date(log.timestamp)))[0];
        }
      } else if (log.actorRole === "paramedic") {
        const staff = db().ambulanceStaff.find((s) => s.userId === log.actorUserId);
        if (staff) {
          hospitalName = db().hospitals.find((h) => h.id === staff.hospitalId)?.name || null;
          matchingRequest = db()
            .emergencyRequests.filter((r) => r.ambulanceStaffId === staff.id && r.patientId === patient.id)
            .sort((a, b) => Math.abs(new Date(a.createdAt) - new Date(log.timestamp)) - Math.abs(new Date(b.createdAt) - new Date(log.timestamp)))[0];
        }
      }

      const durationMinutes =
        matchingRequest && matchingRequest.status === "approved" && matchingRequest.expiresAt
          ? Math.round((new Date(matchingRequest.expiresAt) - new Date(matchingRequest.createdAt)) / 60000)
          : null;

      return {
        ...log,
        actorName: actorUser?.name || "Unknown",
        hospitalName,
        durationMinutes,
        requestStatus: matchingRequest?.status || null,
      };
    });
  res.json(logs);
});

router.get("/notifications", (req, res) => {
  const items = db().notifications.filter((n) => n.userId === req.user.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(items);
});

router.get("/health-summary", (req, res) => {
  const patient = myPatient(req);
  const records = db().medicalRecords.filter((r) => r.patientId === patient.id);
  const { emergencyPin, ...safePatient } = patient;
  res.json({
    patient: safePatient,
    records,
    timeline: buildPatientTimeline(records),
    generatedAt: new Date().toISOString(),
  });
});

export default router;
