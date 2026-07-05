import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROLE_LOGIN = { patient: "/login/patient", doctor: "/login/doctor", paramedic: "/login/paramedic", admin: "/login/admin" };

/**
 * Wrap a route element to require a signed-in session, optionally restricted
 * to a set of roles.
 *
 *   <ProtectedRoute><Shell>...</Shell></ProtectedRoute>                 // any authenticated role
 *   <ProtectedRoute roles={["patient"]}><Shell>...</Shell></ProtectedRoute>  // patient only
 */
export default function ProtectedRoute({ roles, children }) {
  const { user, ready } = useAuth();
  const location = useLocation();

  // Wait for session restoration to finish before deciding — otherwise a
  // hard refresh would briefly bounce a logged-in user to /login.
  if (!ready) return null;

  if (!user) {
    const fallback = ROLE_LOGIN[location.pathname.split("/")[1]] || "/login/patient";
    return <Navigate to={fallback} replace state={{ from: location }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
