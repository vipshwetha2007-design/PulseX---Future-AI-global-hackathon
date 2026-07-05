import jwt from "jsonwebtoken";
import { db } from "../db/store.js";
import { env } from "../config/env.js";

const ACCESS_SECRET = env.jwtAccessSecret;

export function signAccessToken(user) {
  return jwt.sign({ sub: user.id, role: user.role, name: user.name }, ACCESS_SECRET, { expiresIn: "20m" });
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing access token" });
  try {
    const payload = jwt.verify(token, ACCESS_SECRET);
    // Re-check deactivation on every request, not just at login — a token issued
    // before deactivation would otherwise stay valid until it naturally expires.
    const user = db().users.find((u) => u.id === payload.sub);
    if (!user || user.deactivated) {
      return res.status(403).json({ error: "This account has been deactivated. Contact an administrator for help." });
    }
    req.user = { id: payload.sub, role: payload.role, name: payload.name };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired session — please log in again" });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "You do not have permission to perform this action" });
    }
    next();
  };
}

export { ACCESS_SECRET };
