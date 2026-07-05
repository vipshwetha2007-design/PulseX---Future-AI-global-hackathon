import api from "./api";

let hospitalCache = null;

export const doctorApi = {
  me: () => api.get("/doctor/me").then((r) => r.data),

  accessRequests: () => api.get("/doctor/access-requests").then((r) => r.data),
  accessRequest: (reqId) => api.get(`/doctor/access-requests/${reqId}`).then((r) => r.data),
  createAccessRequest: (payload) => api.post("/doctor/access-requests", payload).then((r) => r.data),

  emergencyInfo: (patientId) => api.get(`/doctor/patients/${patientId}/emergency-info`).then((r) => r.data),
  timeline: (patientId) => api.get(`/doctor/patients/${patientId}/timeline`).then((r) => r.data),

  addRecord: (patientId, payload) => api.post(`/doctor/patients/${patientId}/records`, payload).then((r) => r.data),
  medicationCheck: (patientId, payload) => api.post(`/doctor/patients/${patientId}/medication-check`, payload).then((r) => r.data),

  hospitals: () => api.get("/auth/hospitals").then((r) => r.data),

  // Cached id -> name map, since hospital identity is looked up from several pages
  // and doesn't change mid-session.
  hospitalMap: async () => {
    if (hospitalCache) return hospitalCache;
    const list = await api.get("/auth/hospitals").then((r) => r.data);
    hospitalCache = Object.fromEntries(list.map((h) => [h.id, h.name]));
    return hospitalCache;
  },
};
