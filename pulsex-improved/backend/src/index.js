import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { env } from "./config/env.js";
import { load } from "./db/store.js";
import authRoutes from "./routes/auth.js";
import patientRoutes from "./routes/patient.js";
import doctorRoutes from "./routes/doctor.js";
import ambulanceRoutes from "./routes/ambulance.js";
import adminRoutes from "./routes/admin.js";

load();

const app = express();
const PORT = env.port;

// Helmet with an explicit, healthcare-appropriate posture: no cross-origin data
// leakage via referrer, no third-party framing (clickjacking), HSTS in production.
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "same-site" },
    referrerPolicy: { policy: "no-referrer" },
    hsts: env.isProd ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
  })
);

// CORS is allowlisted rather than wide-open — this API issues bearer tokens that
// gate real medical records, so any origin being allowed to call it is not
// acceptable outside of local development.
app.use(
  cors({
    origin(origin, callback) {
      // Allow same-origin / non-browser requests (no Origin header) and anything on the allowlist.
      if (!origin || env.corsOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS policy"));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));

// Global rate limiting — tighter on auth endpoints to blunt credential stuffing / brute force
const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false });
app.use(globalLimiter);

app.get("/api/health", (req, res) => res.json({ status: "ok", service: "PulseX AI Backend", time: new Date().toISOString() }));

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/ambulance", ambulanceRoutes);
app.use("/api/admin", adminRoutes);

// Basic input-safety net: reject obviously malformed JSON bodies before they reach routes
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Malformed request body" });
  }
  if (err.message === "Not allowed by CORS policy") {
    return res.status(403).json({ error: "This origin is not permitted to access the API" });
  }
  next(err);
});

// Central error handler — never leak stack traces to the client
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: "An unexpected error occurred" });
});

app.use((req, res) => res.status(404).json({ error: "Not found" }));

app.listen(PORT, () => {
  console.log(`PulseX AI backend running on http://localhost:${PORT}`);
  console.log(`   Environment: ${env.isProd ? "production" : "development"}`);
  console.log(`   Allowed origins: ${env.corsOrigins.join(", ")}`);
});
