import { Router } from "express";
import { db, id, persist } from "../db/store.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { resolveQrToken } from "../services/qrService.js";
import { scoreEmergencyRequest, checkMedicationSafety, buildPatientTimeline } from "../services/aiEngine.js";
import { writeAudit, notify } from "../services/auditService.js";

const router = Router();
router.use(requireAuth, requireRole("doctor"));

const EMERGENCY_ACCESS_MINUTES = 30;
const EMERGENCY_SCOPE = ["bloodGroup", "allergies", "currentMedicines", "chronicDiseases", "emergencyContacts"];

function myDoctor(req) {
  return db().doctors.find((d) => d.userId === req.user.id);
}

function activeGrant(patientId, doctorId) {
  return db().emergencyRequests.find(
    (r) => r.patientId === patientId && r.doctorId === doctorId && r.status === "approved" && new Date(r.expiresAt) > new Date()
  );
}

router.get("/me", (req, res) => {
  const doctor = myDoctor(req);
  const hospital = db().hospitals.find((h) => h.id === doctor.hospitalId);
  res.json({ ...doctor, hospitalName: hospital?.name });
});

// ---------- Emergency access request (AI-gated) ----------
router.post("/access-requests", (req, res) => {
  const doctor = myDoctor(req);
  const { qrToken, patientId: directPatientId, gpsMatchesHospital } = req.body;

  let patientId = directPatientId;
  if (qrToken) {
    const resolved = resolveQrToken(qrToken);
    if (!resolved) return res.status(400).json({ error: "QR code is invalid, expired, or has been revoked" });
    patientId = resolved.patientId;
  }
  if (!patientId) return res.status(400).json({ error: "A patientId or qrToken is required" });

  const patient = db().patients.find((p) => p.id === patientId);
  if (!patient) return res.status(404).json({ error: "Patient not found" });

  const hospital = db().hospitals.find((h) => h.id === doctor.hospitalId);
  const previousRequestsForPatient = db().emergencyRequests.filter((r) => r.patientId === patientId);

  const { score, decision, factors } = scoreEmergencyRequest({
    doctor,
    hospital,
    ambulanceStaff: null,
    patient,
    previousRequestsForPatient,
    requestedAtHour: new Date().getHours(),
    gpsMatchesHospital,
  });

  const now = new Date();
  const requestRecord = {
    id: id(),
    patientId,
    doctorId: doctor.id,
    ambulanceStaffId: null,
    hospitalId: hospital.id,
    status: decision === "approve" ? "approved" : decision === "manual_review" ? "pending_review" : "rejected",
    riskScore: score,
    decision,
    reason: req.body.reason || "Emergency clinical access",
    createdAt: now.toISOString(),
    expiresAt: decision === "approve" ? new Date(now.getTime() + EMERGENCY_ACCESS_MINUTES * 60000).toISOString() : null,
    infoScope: EMERGENCY_SCOPE,
  };
  db().emergencyRequests.push(requestRecord);
  db().riskScores.push({ id: id(), emergencyRequestId: requestRecord.id, score, factors, decision, createdAt: now.toISOString() });
  persist();

  writeAudit({
    actorUserId: req.user.id,
    actorRole: "doctor",
    patientId,
    ip: req.ip,
    action: `emergency_access_${requestRecord.status}`,
    infoViewed: [],
    reason: requestRecord.reason,
  });

  notify(patient.userId, "access_alert", `Dr. ${req.user.name} requested emergency access to your record (status: ${requestRecord.status}).`);
  (patient.familyMemberUserIds || []).forEach((uid) => notify(uid, "family_alert", `An emergency access request was made for a family member's record (status: ${requestRecord.status}).`));

  res.status(201).json({ request: requestRecord, riskFactors: factors });
});

router.get("/access-requests/:reqId", (req, res) => {
  const record = db().emergencyRequests.find((r) => r.id === req.params.reqId && r.doctorId === myDoctor(req).id);
  if (!record) return res.status(404).json({ error: "Request not found" });
  res.json(record);
});

router.get("/access-requests", (req, res) => {
  const doctor = myDoctor(req);
  res.json(db().emergencyRequests.filter((r) => r.doctorId === doctor.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

// ---------- Emergency-scoped patient info (only while a valid grant exists) ----------
router.get("/patients/:patientId/emergency-info", (req, res) => {
  const doctor = myDoctor(req);
  const grant = activeGrant(req.params.patientId, doctor.id);
  if (!grant) return res.status(403).json({ error: "No active emergency access grant for this patient. Submit an access request first." });

  const patient = db().patients.find((p) => p.id === req.params.patientId);
  const scoped = {};
  grant.infoScope.forEach((field) => (scoped[field] = patient[field]));

  writeAudit({
    actorUserId: req.user.id,
    actorRole: "doctor",
    patientId: patient.id,
    ip: req.ip,
    action: "view_emergency_info",
    infoViewed: grant.infoScope,
    reason: grant.reason,
  });

  res.json({ ...scoped, accessExpiresAt: grant.expiresAt });
});

router.get("/patients/:patientId/timeline", (req, res) => {
  const doctor = myDoctor(req);
  const grant = activeGrant(req.params.patientId, doctor.id);
  if (!grant) return res.status(403).json({ error: "No active emergency access grant for this patient" });
  const records = db().medicalRecords.filter((r) => r.patientId === req.params.patientId);
  res.json(buildPatientTimeline(records));
});

// ---------- Clinical documentation (requires an active grant) ----------
router.post("/patients/:patientId/records", (req, res) => {
  const doctor = myDoctor(req);
  const grant = activeGrant(req.params.patientId, doctor.id);
  if (!grant) return res.status(403).json({ error: "No active emergency access grant for this patient" });

  const { type, title, notes } = req.body;
  const allowed = ["diagnosis", "prescription", "treatment_plan", "discharge_summary"];
  if (!allowed.includes(type)) return res.status(400).json({ error: `type must be one of: ${allowed.join(", ")}` });

  const record = {
    id: id(),
    patientId: req.params.patientId,
    type,
    title: title || type,
    date: new Date().toISOString(),
    doctorId: doctor.id,
    notes: notes || "",
    fileRef: null,
  };
  db().medicalRecords.push(record);
  persist();

  writeAudit({
    actorUserId: req.user.id,
    actorRole: "doctor",
    patientId: req.params.patientId,
    ip: req.ip,
    action: `create_${type}`,
    infoViewed: [],
    reason: grant.reason,
  });

  const patient = db().patients.find((p) => p.id === req.params.patientId);
  notify(patient.userId, "record_update", `Dr. ${req.user.name} added a new ${type.replace("_", " ")} to your record.`);

  res.status(201).json(record);
});

// ---------- Medication safety check ----------
router.post("/patients/:patientId/medication-check", (req, res) => {
  const doctor = myDoctor(req);
  const grant = activeGrant(req.params.patientId, doctor.id);
  if (!grant) return res.status(403).json({ error: "No active emergency access grant for this patient" });

  const patient = db().patients.find((p) => p.id === req.params.patientId);
  const { newMedicine, isPregnant, hasKidneyDisease, hasLiverDisease } = req.body;
  if (!newMedicine) return res.status(400).json({ error: "newMedicine is required" });

  const result = checkMedicationSafety({
    newMedicine,
    currentMedicines: patient.currentMedicines,
    allergies: patient.allergies,
    isPregnant: !!isPregnant,
    hasKidneyDisease: !!hasKidneyDisease,
    hasLiverDisease: !!hasLiverDisease,
  });
  res.json(result);
});

export default router;
