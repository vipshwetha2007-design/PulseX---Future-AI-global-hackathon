import { Router } from "express";
import bcrypt from "bcryptjs";
import { body, validationResult } from "express-validator";
import { db, id, persist } from "../db/store.js";
import { signAccessToken } from "../middleware/auth.js";

const router = Router();

function fail(res, errors) {
  return res.status(400).json({ error: "Validation failed", details: errors.array() });
}

// ---------- Patient registration ----------
router.post(
  "/register/patient",
  [
    body("name").trim().notEmpty(),
    body("email").isEmail(),
    body("password").isLength({ min: 8 }),
    body("bloodGroup").notEmpty(),
    body("emergencyPin").isLength({ min: 4, max: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return fail(res, errors);

    const { name, email, password, bloodGroup, emergencyPin, dob } = req.body;
    if (db().users.find((u) => u.email === email)) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = { id: id(), role: "patient", email, passwordHash, name, mfaEnabled: false, deviceIds: [], createdAt: new Date().toISOString() };
    db().users.push(user);

    const patient = {
      id: id(),
      userId: user.id,
      bloodGroup,
      dob: dob || null,
      phone: "",
      address: "",
      photoUrl: null,
      allergies: [],
      chronicDiseases: [],
      currentMedicines: [],
      surgeries: [],
      vaccinations: [],
      emergencyContacts: [],
      emergencyPin: await bcrypt.hash(emergencyPin, 10),
      consent: { emergencyConsent: true, familyAccess: true, doctorAccess: true, researchSharing: false },
      familyMemberUserIds: [],
    };
    db().patients.push(patient);
    persist();

    const token = signAccessToken(user);
    res.status(201).json({ token, user: { id: user.id, name: user.name, role: user.role }, patientId: patient.id });
  }
);

// ---------- Doctor registration (pending hospital verification) ----------
router.post(
  "/register/doctor",
  [
    body("name").trim().notEmpty(),
    body("email").isEmail(),
    body("password").isLength({ min: 8 }),
    body("hospitalId").notEmpty(),
    body("licenseNumber").notEmpty(),
    body("specialization").notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return fail(res, errors);

    const { name, email, password, hospitalId, licenseNumber, specialization } = req.body;
    const hospital = db().hospitals.find((h) => h.id === hospitalId);
    if (!hospital) return res.status(404).json({ error: "Hospital not found" });
    if (db().users.find((u) => u.email === email)) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = { id: id(), role: "doctor", email, passwordHash, name, mfaEnabled: true, deviceIds: [], createdAt: new Date().toISOString() };
    db().users.push(user);

    const doctor = {
      id: id(),
      userId: user.id,
      hospitalId,
      licenseNumber,
      licenseVerified: hospital.verified, // auto-verified for demo when parent hospital is verified
      specialization,
    };
    db().doctors.push(doctor);
    persist();

    const token = signAccessToken(user);
    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, role: user.role },
      doctorId: doctor.id,
      licenseVerified: doctor.licenseVerified,
    });
  }
);

// ---------- Ambulance / Paramedic registration ----------
router.post(
  "/register/ambulance",
  [body("name").trim().notEmpty(), body("email").isEmail(), body("password").isLength({ min: 8 }), body("hospitalId").notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return fail(res, errors);
    const { name, email, password, hospitalId } = req.body;
    const hospital = db().hospitals.find((h) => h.id === hospitalId);
    if (!hospital) return res.status(404).json({ error: "Hospital not found" });
    if (db().users.find((u) => u.email === email)) return res.status(409).json({ error: "An account with this email already exists" });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = { id: id(), role: "paramedic", email, passwordHash, name, mfaEnabled: false, deviceIds: [], createdAt: new Date().toISOString() };
    db().users.push(user);
    const staff = { id: id(), userId: user.id, hospitalId };
    db().ambulanceStaff.push(staff);
    persist();

    const token = signAccessToken(user);
    res.status(201).json({ token, user: { id: user.id, name: user.name, role: user.role }, staffId: staff.id });
  }
);

// ---------- Admin bootstrap (only when no admin exists yet — demo convenience) ----------
router.post(
  "/register/admin",
  [body("name").trim().notEmpty(), body("email").isEmail(), body("password").isLength({ min: 8 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return fail(res, errors);
    if (db().admins.length > 0) {
      return res.status(403).json({ error: "An admin account already exists for this deployment" });
    }
    const { name, email, password } = req.body;
    if (db().users.find((u) => u.email === email)) return res.status(409).json({ error: "An account with this email already exists" });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = { id: id(), role: "admin", email, passwordHash, name, mfaEnabled: true, deviceIds: [], createdAt: new Date().toISOString() };
    db().users.push(user);
    const admin = { id: id(), userId: user.id };
    db().admins.push(admin);
    persist();

    const token = signAccessToken(user);
    res.status(201).json({ token, user: { id: user.id, name: user.name, role: user.role } });
  }
);

// ---------- Login (all roles) ----------
router.post("/login", [body("email").isEmail(), body("password").notEmpty()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return fail(res, errors);

  const { email, password } = req.body;
  const user = db().users.find((u) => u.email === email);
  if (!user) return res.status(401).json({ error: "Invalid email or password" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid email or password" });

  if (user.deactivated) {
    return res.status(403).json({ error: "This account has been deactivated. Contact an administrator for help." });
  }

  const token = signAccessToken(user);
  const roleRecord =
    user.role === "patient" ? db().patients.find((p) => p.userId === user.id) :
    user.role === "doctor" ? db().doctors.find((d) => d.userId === user.id) :
    user.role === "paramedic" ? db().ambulanceStaff.find((a) => a.userId === user.id) :
    user.role === "admin" ? db().admins.find((a) => a.userId === user.id) : null;

  res.json({
    token,
    user: { id: user.id, name: user.name, role: user.role, mfaEnabled: user.mfaEnabled },
    roleRecordId: roleRecord ? roleRecord.id : null,
  });
});

// ---------- Public: list verified hospitals (for registration dropdowns) ----------
router.get("/hospitals", (req, res) => {
  res.json(db().hospitals.map((h) => ({ id: h.id, name: h.name, verified: h.verified })));
});

export default router;
