import { Router } from "express";
import { body, validationResult } from "express-validator";
import { db, id, persist } from "../db/store.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { detectFraud, getAiThresholds, setAiThresholds, InvalidThresholdError } from "../services/aiEngine.js";

const router = Router();
router.use(requireAuth, requireRole("admin"));

router.get("/overview", (req, res) => {
  const d = db();
  res.json({
    totalUsers: d.users.length,
    patients: d.patients.length,
    doctors: d.doctors.length,
    hospitals: d.hospitals.length,
    paramedics: d.ambulanceStaff.length,
    emergencyRequests: d.emergencyRequests.length,
    approvedRequests: d.emergencyRequests.filter((r) => r.status === "approved").length,
    pendingReview: d.emergencyRequests.filter((r) => r.status === "pending_review").length,
    rejectedRequests: d.emergencyRequests.filter((r) => r.status === "rejected").length,
    auditLogCount: d.auditLogs.length,
    openFraudAlerts: d.fraudAlerts.filter((a) => !a.resolved).length,
  });
});

router.get("/hospitals", (req, res) => res.json(db().hospitals));

router.post(
  "/hospitals",
  [
    body("name").trim().notEmpty().isLength({ max: 200 }).withMessage("name is required (max 200 chars)"),
    body("address").optional().isString().isLength({ max: 300 }),
    body("departments").optional().isArray(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: "Validation failed", details: errors.array() });

    const { name, address, departments } = req.body;
    const hospital = { id: id(), name, address: address || "", departments: departments || [], verified: false, createdAt: new Date().toISOString() };
    db().hospitals.push(hospital);
    persist();
    res.status(201).json(hospital);
  }
);

router.put("/hospitals/:hospitalId/verify", (req, res) => {
  const hospital = db().hospitals.find((h) => h.id === req.params.hospitalId);
  if (!hospital) return res.status(404).json({ error: "Hospital not found" });
  hospital.verified = true;
  // Auto-verify pending doctor licenses tied to this hospital, mirroring real-world workflow
  db().doctors.filter((d) => d.hospitalId === hospital.id).forEach((d) => (d.licenseVerified = true));
  persist();
  res.json(hospital);
});

router.get("/doctors", (req, res) => {
  const doctors = db().doctors.map((d) => {
    const user = db().users.find((u) => u.id === d.userId);
    const hospital = db().hospitals.find((h) => h.id === d.hospitalId);
    return { ...d, name: user?.name, email: user?.email, hospitalName: hospital?.name };
  });
  res.json(doctors);
});

router.put("/doctors/:doctorId/verify", (req, res) => {
  const doctor = db().doctors.find((d) => d.id === req.params.doctorId);
  if (!doctor) return res.status(404).json({ error: "Doctor not found" });
  doctor.licenseVerified = true;
  persist();
  res.json(doctor);
});

router.get("/users", (req, res) => {
  res.json(db().users.map(({ passwordHash, ...safe }) => safe));
});

router.put("/users/:userId/deactivate", (req, res) => {
  const user = db().users.find((u) => u.id === req.params.userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  user.deactivated = true;
  persist();
  res.json({ ok: true });
});

router.get("/audit-logs", (req, res) => {
  const logs = [...db().auditLogs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  res.json(logs.slice(0, 500));
});

router.get("/emergency-requests", (req, res) => {
  res.json([...db().emergencyRequests].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

router.get("/fraud-alerts", (req, res) => {
  // Re-run fraud detection across all actors who made an access in the audit log,
  // then merge with any persisted alerts.
  const actorIds = [...new Set(db().auditLogs.map((l) => l.actorUserId))];
  const live = actorIds.flatMap((actorId) =>
    detectFraud(actorId, db().auditLogs).map((a) => ({ ...a, actorUserId: actorId }))
  );
  res.json({ live, resolved: db().fraudAlerts.filter((a) => a.resolved) });
});

router.get("/risk-scores", (req, res) => {
  res.json([...db().riskScores].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 200));
});

// AI model configuration (thresholds) — reads/writes the actual live thresholds
// used by aiEngine.scoreEmergencyRequest, so changes here take effect immediately.
router.get("/ai-config", (req, res) => res.json(getAiThresholds()));
router.put("/ai-config", (req, res) => {
  try {
    res.json(setAiThresholds(req.body));
  } catch (err) {
    if (err instanceof InvalidThresholdError) return res.status(400).json({ error: err.message });
    throw err;
  }
});

export default router;
