import api from "./api";

export const adminApi = {
  overview: () => api.get("/admin/overview").then((r) => r.data),

  users: () => api.get("/admin/users").then((r) => r.data),
  deactivateUser: (userId) => api.put(`/admin/users/${userId}/deactivate`).then((r) => r.data),

  hospitals: () => api.get("/admin/hospitals").then((r) => r.data),
  createHospital: (payload) => api.post("/admin/hospitals", payload).then((r) => r.data),
  verifyHospital: (hospitalId) => api.put(`/admin/hospitals/${hospitalId}/verify`).then((r) => r.data),

  doctors: () => api.get("/admin/doctors").then((r) => r.data),
  verifyDoctor: (doctorId) => api.put(`/admin/doctors/${doctorId}/verify`).then((r) => r.data),

  auditLogs: () => api.get("/admin/audit-logs").then((r) => r.data),
  emergencyRequests: () => api.get("/admin/emergency-requests").then((r) => r.data),

  fraudAlerts: () => api.get("/admin/fraud-alerts").then((r) => r.data),
  riskScores: () => api.get("/admin/risk-scores").then((r) => r.data),

  aiConfig: () => api.get("/admin/ai-config").then((r) => r.data),
  updateAiConfig: (payload) => api.put("/admin/ai-config", payload).then((r) => r.data),
};
