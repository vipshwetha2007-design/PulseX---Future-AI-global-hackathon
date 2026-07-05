// PulseX AI — AI Decision Engine
//
// This is a deterministic, explainable rule-based engine — the same class of system
// hospitals actually deploy for the "auto-approve vs escalate to a human" decision,
// because black-box scoring is unacceptable when the output gates access to a
// patient's medical record. Every score below returns its contributing factors so
// a human reviewer (or an audit) can see exactly why a decision was made.

const DAY_MS = 24 * 60 * 60 * 1000;

// Live, mutable decision thresholds. Exposed via getters/setters so the admin
// "/admin/ai-config" endpoint actually changes how requests are scored,
// instead of maintaining its own disconnected copy of these numbers.
const thresholds = { approveBelow: 30, rejectAtOrAbove: 60 };

export function getAiThresholds() {
  return { ...thresholds };
}

export class InvalidThresholdError extends Error {}

// Keeps the live risk-scoring thresholds sane no matter what an admin submits —
// a gate that decides who gets emergency access to a medical record shouldn't
// be settable to something self-contradictory (e.g. reject-at lower than approve-below)
// or out of the 0-100 score range the engine actually produces.
export function setAiThresholds({ approveBelow, rejectAtOrAbove } = {}) {
  const next = { ...thresholds };

  if (approveBelow !== undefined) {
    if (typeof approveBelow !== "number" || Number.isNaN(approveBelow) || approveBelow < 0 || approveBelow > 100) {
      throw new InvalidThresholdError("approveBelow must be a number between 0 and 100");
    }
    next.approveBelow = approveBelow;
  }
  if (rejectAtOrAbove !== undefined) {
    if (typeof rejectAtOrAbove !== "number" || Number.isNaN(rejectAtOrAbove) || rejectAtOrAbove < 0 || rejectAtOrAbove > 100) {
      throw new InvalidThresholdError("rejectAtOrAbove must be a number between 0 and 100");
    }
    next.rejectAtOrAbove = rejectAtOrAbove;
  }
  if (next.approveBelow >= next.rejectAtOrAbove) {
    throw new InvalidThresholdError("approveBelow must be lower than rejectAtOrAbove");
  }

  thresholds.approveBelow = next.approveBelow;
  thresholds.rejectAtOrAbove = next.rejectAtOrAbove;
  return getAiThresholds();
}

/**
 * Emergency access verification.
 * Produces a 0-100 risk score and a decision: "approve" | "manual_review" | "reject".
 */
export function scoreEmergencyRequest({ doctor, hospital, ambulanceStaff, patient, previousRequestsForPatient = [], requestedAtHour, gpsMatchesHospital }) {
  const factors = [];
  let risk = 0;

  // Doctor identity & license
  if (!doctor) {
    factors.push({ factor: "No verified doctor attached to request", weight: 35 });
    risk += 35;
  } else if (!doctor.licenseVerified) {
    factors.push({ factor: "Doctor medical license not yet verified", weight: 30 });
    risk += 30;
  } else {
    factors.push({ factor: "Doctor license verified", weight: -5 });
    risk -= 5;
  }

  // Hospital verification
  if (!hospital || !hospital.verified) {
    factors.push({ factor: "Requesting hospital is not verified", weight: 25 });
    risk += 25;
  } else {
    factors.push({ factor: "Hospital is a verified institution", weight: -5 });
    risk -= 5;
  }

  // Ambulance-initiated requests carry inherent urgency legitimacy
  if (ambulanceStaff) {
    factors.push({ factor: "Request originated from dispatched ambulance scan", weight: -10 });
    risk -= 10;
  }

  // GPS plausibility
  if (gpsMatchesHospital === false) {
    factors.push({ factor: "GPS location inconsistent with hospital/ambulance location", weight: 20 });
    risk += 20;
  } else if (gpsMatchesHospital === true) {
    factors.push({ factor: "GPS location consistent with claimed location", weight: -5 });
    risk -= 5;
  }

  // Odd-hour access (still valid for emergencies, but nudges toward review when combined with other flags)
  if (requestedAtHour !== undefined && (requestedAtHour < 5 || requestedAtHour > 23)) {
    factors.push({ factor: "Request made during unusual late-night hours", weight: 8 });
    risk += 8;
  }

  // Repeated access pattern for the same patient
  const recentAccesses = previousRequestsForPatient.filter(
    (r) => Date.now() - new Date(r.createdAt).getTime() < DAY_MS
  );
  if (recentAccesses.length >= 3) {
    factors.push({ factor: `${recentAccesses.length} emergency accesses for this patient in the last 24h`, weight: 25 });
    risk += 25;
  }

  // Patient-controlled emergency consent. Disabling it doesn't block the
  // emergency workflow outright (a life-threatening situation still needs a
  // path in), but it removes the standing benefit-of-the-doubt and nudges
  // the request toward manual review, per what Consent Settings tells patients.
  if (patient && patient.consent && patient.consent.emergencyConsent === false) {
    factors.push({ factor: "Patient has disabled emergency consent", weight: 20 });
    risk += 20;
  }

  risk = Math.max(0, Math.min(100, risk));

  const { approveBelow, rejectAtOrAbove } = thresholds;
  let decision = "approve";
  if (risk >= rejectAtOrAbove) decision = "reject";
  else if (risk >= approveBelow) decision = "manual_review";

  return { score: risk, decision, factors };
}

/**
 * Fraud detection over an actor's recent access history.
 */
export function detectFraud(actorUserId, auditLogs) {
  const alerts = [];
  const mine = auditLogs.filter((l) => l.actorUserId === actorUserId);
  const lastHour = mine.filter((l) => Date.now() - new Date(l.timestamp).getTime() < 60 * 60 * 1000);
  const uniquePatientsLastHour = new Set(lastHour.map((l) => l.patientId));

  if (uniquePatientsLastHour.size >= 5) {
    alerts.push({
      type: "mass_patient_access",
      severity: "high",
      details: `${uniquePatientsLastHour.size} distinct patient records accessed within one hour`,
    });
  }

  const distinctIpsLastHour = new Set(lastHour.map((l) => l.ip));
  if (distinctIpsLastHour.size >= 3) {
    alerts.push({
      type: "location_anomaly",
      severity: "medium",
      details: `Access from ${distinctIpsLastHour.size} different network locations within one hour`,
    });
  }

  const largeDownloads = lastHour.filter((l) => l.action === "download_full_record");
  if (largeDownloads.length >= 2) {
    alerts.push({
      type: "large_record_download",
      severity: "medium",
      details: `${largeDownloads.length} full-record downloads within one hour`,
    });
  }

  const oddHour = lastHour.filter((l) => {
    const h = new Date(l.timestamp).getHours();
    return h < 5 || h > 23;
  });
  if (oddHour.length >= 3) {
    alerts.push({
      type: "suspicious_timing",
      severity: "low",
      details: `${oddHour.length} accesses during unusual hours in the last hour`,
    });
  }

  return alerts;
}

// A small illustrative interaction table — production systems would call a licensed
// drug-interaction database (e.g. RxNorm/DDInter); this demonstrates the check logic.
const INTERACTION_PAIRS = [
  { pair: ["warfarin", "aspirin"], risk: "Increased bleeding risk" },
  { pair: ["ibuprofen", "lisinopril"], risk: "Reduced antihypertensive effect / kidney strain" },
  { pair: ["metformin", "contrast dye"], risk: "Risk of lactic acidosis" },
  { pair: ["sildenafil", "nitroglycerin"], risk: "Severe hypotension risk" },
  { pair: ["simvastatin", "clarithromycin"], risk: "Increased risk of muscle toxicity (rhabdomyolysis)" },
];

const PREGNANCY_UNSAFE = ["warfarin", "isotretinoin", "ace inhibitor", "lisinopril", "methotrexate"];
const KIDNEY_CAUTION = ["ibuprofen", "naproxen", "metformin", "nsaid"];
const LIVER_CAUTION = ["acetaminophen", "paracetamol", "simvastatin", "methotrexate"];

export function checkMedicationSafety({ newMedicine, currentMedicines = [], allergies = [], isPregnant = false, hasKidneyDisease = false, hasLiverDisease = false }) {
  const warnings = [];
  const med = String(newMedicine).toLowerCase();
  const currentLower = currentMedicines.map((m) => String(m).toLowerCase());

  // Duplicate check
  if (currentLower.includes(med)) {
    warnings.push({ type: "duplicate_medicine", severity: "medium", message: `${newMedicine} already appears in current medications` });
  }

  // Interaction check
  for (const entry of INTERACTION_PAIRS) {
    const [a, b] = entry.pair;
    if ((med === a && currentLower.includes(b)) || (med === b && currentLower.includes(a))) {
      warnings.push({ type: "drug_interaction", severity: "high", message: `${newMedicine} interacts with existing medication: ${entry.risk}` });
    }
  }

  // Allergy conflict
  for (const allergy of allergies) {
    if (med.includes(String(allergy).toLowerCase()) || String(allergy).toLowerCase().includes(med)) {
      warnings.push({ type: "allergy_conflict", severity: "critical", message: `Patient has a recorded allergy to ${allergy}` });
    }
  }

  if (isPregnant && PREGNANCY_UNSAFE.some((p) => med.includes(p))) {
    warnings.push({ type: "pregnancy_warning", severity: "critical", message: `${newMedicine} is generally unsafe during pregnancy` });
  }
  if (hasKidneyDisease && KIDNEY_CAUTION.some((p) => med.includes(p))) {
    warnings.push({ type: "kidney_warning", severity: "high", message: `${newMedicine} requires caution in patients with kidney disease` });
  }
  if (hasLiverDisease && LIVER_CAUTION.some((p) => med.includes(p))) {
    warnings.push({ type: "liver_warning", severity: "high", message: `${newMedicine} requires caution in patients with liver disease` });
  }

  return { safe: warnings.length === 0, warnings };
}

/**
 * Builds a concise chronological timeline from a patient's medical records.
 */
export function buildPatientTimeline(medicalRecords) {
  return [...medicalRecords]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((r) => ({
      year: new Date(r.date).getFullYear(),
      date: r.date,
      label: `${r.type}: ${r.title}`,
      recordId: r.id,
    }));
}

/**
 * Lightweight, explainable heuristic risk indicators — a stand-in for the trained
 * models a production deployment would use (e.g. gradient-boosted models trained on
 * longitudinal EHR data), scoped down to something honestly implementable from
 * structured record flags alone.
 */
export function predictHealthRisks(patient, medicalRecords) {
  const conditions = (patient.chronicDiseases || []).map((c) => c.toLowerCase());
  const results = {};

  results.diabetesProgression = conditions.includes("diabetes")
    ? { level: "monitor", note: "Existing diabetes diagnosis — recommend routine HbA1c tracking" }
    : { level: "low", note: "No diabetes diagnosis on record" };

  const heartFlags = ["hypertension", "heart disease", "high cholesterol"].filter((c) => conditions.includes(c));
  results.heartDiseaseRisk = heartFlags.length
    ? { level: heartFlags.length > 1 ? "elevated" : "monitor", note: `Contributing factors: ${heartFlags.join(", ")}` }
    : { level: "low", note: "No cardiac risk factors on record" };

  results.strokeRisk = conditions.includes("hypertension") && conditions.includes("diabetes")
    ? { level: "elevated", note: "Combined hypertension and diabetes increase stroke risk" }
    : { level: "low", note: "No compounding stroke risk factors identified" };

  results.kidneyDisease = conditions.includes("diabetes") || conditions.includes("hypertension")
    ? { level: "monitor", note: "Diabetes/hypertension are leading contributors to kidney disease — recommend renal panel" }
    : { level: "low", note: "No known contributing conditions" };

  const admissions = medicalRecords.filter((r) => r.type === "visit" || r.type === "admission");
  const recentAdmissions = admissions.filter((r) => Date.now() - new Date(r.date).getTime() < 90 * DAY_MS);
  results.readmissionRisk = recentAdmissions.length >= 2
    ? { level: "elevated", note: `${recentAdmissions.length} admissions in the last 90 days` }
    : { level: "low", note: "No frequent recent admissions" };

  return results;
}
