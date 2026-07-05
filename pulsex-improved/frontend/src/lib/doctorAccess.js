export function isActiveGrant(request) {
  return request.status === "approved" && new Date(request.expiresAt) > new Date();
}

/**
 * Collapses the flat access-requests list into one row per patient, keeping
 * the most recent request as the representative record. This is the closest
 * thing to an "assigned patients" list the current API surface supports —
 * doctors only ever see patients they've made an access request for.
 */
export function groupByPatient(requests) {
  const map = new Map();
  for (const r of requests) {
    const existing = map.get(r.patientId);
    if (!existing || new Date(r.createdAt) > new Date(existing.createdAt)) {
      map.set(r.patientId, r);
    }
  }
  return [...map.values()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function activePatients(requests) {
  return groupByPatient(requests).filter(isActiveGrant);
}
