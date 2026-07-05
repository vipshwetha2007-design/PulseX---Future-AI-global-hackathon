// PulseX AI — Data Store
// Demo-grade persistence: an in-memory relational model, snapshotted to disk as JSON.
// In production this layer maps 1:1 onto PostgreSQL tables (see /docs/schema.sql for the
// real relational schema, constraints, and indexes this store mirrors).

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { nanoid } from "nanoid";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "pulsex.data.json");

const emptyState = () => ({
  users: [], // {id, role, email, passwordHash, name, mfaEnabled, deviceIds:[], createdAt}
  patients: [], // {id, userId, bloodGroup, dob, phone, address, photoUrl, allergies:[], chronicDiseases:[], currentMedicines:[], surgeries:[], vaccinations:[], emergencyContacts:[], emergencyPin, consent:{}, qrTokenId, nfcCardId}
  doctors: [], // {id, userId, hospitalId, licenseNumber, licenseVerified, specialization}
  hospitals: [], // {id, name, verified, address, departments:[]}
  ambulanceStaff: [], // {id, userId, hospitalId}
  admins: [], // {id, userId}
  medicalRecords: [], // {id, patientId, type, title, date, doctorId, notes, fileRef}
  emergencyRequests: [], // {id, patientId, doctorId, ambulanceStaffId, hospitalId, status, riskScore, decision, reason, createdAt, expiresAt, infoScope}
  auditLogs: [], // immutable: {id, actorUserId, actorRole, patientId, ip, gps, action, infoViewed, reason, timestamp}
  notifications: [], // {id, userId, type, message, read, createdAt}
  qrTokens: [], // {id, patientId, token, active, createdAt, revokedAt}
  nfcCards: [], // {id, patientId, cardUid, active, createdAt}
  fraudAlerts: [], // {id, actorUserId, type, severity, details, createdAt, resolved}
  riskScores: [], // {id, emergencyRequestId, score, factors, decision, createdAt}
  refreshTokens: [], // {id, userId, token, expiresAt}
});

let state = emptyState();

export function load() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      state = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
      return;
    } catch {
      // fall through to reseed on corrupt file
    }
  }
  seed();
  persist();
}

export function persist() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
}

export function db() {
  return state;
}

export function id() {
  return nanoid(12);
}

function seed() {
  state = emptyState();
  // Seeding is intentionally left minimal; real accounts are created through
  // the registration flow. A demo hospital + admin are pre-provisioned so the
  // doctor/ambulance registration flow has something to verify against.
  const hospitalId = id();
  state.hospitals.push({
    id: hospitalId,
    name: "Chennai General Emergency Hospital",
    verified: true,
    address: "Chennai, Tamil Nadu, India",
    departments: ["Emergency", "Cardiology", "General Medicine", "Orthopedics"],
    createdAt: new Date().toISOString(),
  });
}

export function resetToSeed() {
  seed();
  persist();
}

export const HOSPITAL_SEED_NAME = "Chennai General Emergency Hospital";
