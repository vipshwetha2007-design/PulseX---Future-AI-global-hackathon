import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:4000/api" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("pulsex_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the backend ever rejects the current token (expired, tampered, revoked),
// broadcast it so AuthContext can clear local session state and redirect to
// login — without api.js needing to know anything about React or routing.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const isAuthRoute = error.config?.url?.includes("/auth/login") || error.config?.url?.includes("/auth/register");
    if (status === 401 && !isAuthRoute) {
      window.dispatchEvent(new CustomEvent("pulsex:session-expired"));
    }
    return Promise.reject(error);
  }
);

export default api;

