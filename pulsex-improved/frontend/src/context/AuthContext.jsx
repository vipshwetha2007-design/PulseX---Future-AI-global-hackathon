import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { getTokenExpiryMs, isTokenExpired } from "../lib/jwt";

const AuthContext = createContext(null);

const ROLE_LOGIN = { patient: "/login/patient", doctor: "/login/doctor", paramedic: "/login/paramedic", admin: "/login/admin" };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [roleRecordId, setRoleRecordId] = useState(null);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();
  const expiryTimer = useRef(null);

  const clearSession = useCallback(() => {
    localStorage.removeItem("pulsex_token");
    localStorage.removeItem("pulsex_user");
    localStorage.removeItem("pulsex_role_record_id");
    if (expiryTimer.current) {
      clearTimeout(expiryTimer.current);
      expiryTimer.current = null;
    }
    setUser(null);
    setRoleRecordId(null);
  }, []);

  // Schedule an automatic logout for the moment the current token expires,
  // so a session doesn't silently look "logged in" past its real lifetime.
  const scheduleExpiry = useCallback(
    (token, currentUser) => {
      if (expiryTimer.current) clearTimeout(expiryTimer.current);
      const expiryMs = getTokenExpiryMs(token);
      if (expiryMs === null) return;
      const delay = expiryMs - Date.now();
      if (delay <= 0) {
        clearSession();
        navigate((currentUser && ROLE_LOGIN[currentUser.role]) || "/", { state: { sessionExpired: true } });
        return;
      }
      expiryTimer.current = setTimeout(() => {
        clearSession();
        navigate((currentUser && ROLE_LOGIN[currentUser.role]) || "/", { state: { sessionExpired: true } });
      }, delay);
    },
    [clearSession, navigate]
  );

  // Restore session on load / refresh, but only if the stored token hasn't
  // already expired while the app was closed.
  useEffect(() => {
    const token = localStorage.getItem("pulsex_token");
    const stored = localStorage.getItem("pulsex_user");
    const rid = localStorage.getItem("pulsex_role_record_id");

    if (token && stored && !isTokenExpired(token)) {
      const parsedUser = JSON.parse(stored);
      setUser(parsedUser);
      if (rid) setRoleRecordId(rid);
      scheduleExpiry(token, parsedUser);
    } else if (token || stored) {
      clearSession();
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If any API call comes back 401 (token invalid/expired/revoked server-side),
  // drop the local session and send the person back to sign in.
  useEffect(() => {
    function onSessionExpired() {
      const expiredUser = user;
      clearSession();
      navigate((expiredUser && ROLE_LOGIN[expiredUser.role]) || "/", { state: { sessionExpired: true } });
    }
    window.addEventListener("pulsex:session-expired", onSessionExpired);
    return () => window.removeEventListener("pulsex:session-expired", onSessionExpired);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, clearSession, navigate]);

  function loginSuccess({ token, user, patientId, doctorId, staffId, roleRecordId }) {
    const rid = patientId || doctorId || staffId || roleRecordId || null;
    localStorage.setItem("pulsex_token", token);
    localStorage.setItem("pulsex_user", JSON.stringify(user));
    if (rid) localStorage.setItem("pulsex_role_record_id", rid);
    setUser(user);
    setRoleRecordId(rid);
    scheduleExpiry(token, user);
  }

  async function login(email, password) {
    const { data } = await api.post("/auth/login", { email, password });
    loginSuccess(data);
    return data;
  }

  function logout() {
    clearSession();
  }

  return (
    <AuthContext.Provider value={{ user, roleRecordId, ready, login, loginSuccess, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
