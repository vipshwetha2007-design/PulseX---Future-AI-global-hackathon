import api from "./api";

let hospitalCache = null;

export const ambulanceApi = {
  scanQr: (token) => api.post("/ambulance/scan/qr", { token }).then((r) => r.data),
  scanNfc: (cardUid) => api.post("/ambulance/scan/nfc", { cardUid }).then((r) => r.data),
  history: () => api.get("/ambulance/history").then((r) => r.data),

  // Cached id -> name map, same pattern as doctorApi.hospitalMap — hospital
  // identity for a scan record is looked up from the shared public directory.
  hospitalMap: async () => {
    if (hospitalCache) return hospitalCache;
    const list = await api.get("/auth/hospitals").then((r) => r.data);
    hospitalCache = Object.fromEntries(list.map((h) => [h.id, h.name]));
    return hospitalCache;
  },
};
