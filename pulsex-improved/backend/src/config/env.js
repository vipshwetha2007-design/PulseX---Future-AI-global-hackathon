// Centralized environment/secret loading.
//
// A healthcare app has exactly two secrets that matter: the JWT signing key
// and the field-level encryption key. Previously these fell back silently to
// hardcoded demo strings in two different files, which is an easy way for a
// real deployment to go live still signing tokens with a public string.
// This module is the single place that decides "is it safe to boot", so a
// misconfigured production deployment fails loudly instead of quietly
// running on a well-known default key.

const isProd = process.env.NODE_ENV === "production";

const DEV_FALLBACK_JWT_SECRET = "pulsex-access-secret-dev-only";
const DEV_FALLBACK_ENC_KEY = "pulsex-ai-demo-key-please-rotate!!";

function required(name, devFallback) {
  const value = process.env[name];
  if (value && value.trim().length >= 16) return value;

  if (isProd) {
    // Fail fast — never let a healthcare deployment run with a guessable key.
    throw new Error(
      `[PulseX AI] Missing or weak ${name} in production. Set a strong random value ` +
        `(32+ chars) in the environment before starting the server.`
    );
  }

  // Dev/demo convenience only — loudly flagged so nobody mistakes it for secure.
  console.warn(
    `⚠️  [PulseX AI] ${name} is not set — falling back to a known DEV-ONLY value. ` +
      `This is fine for local hackathon demos but must never be used in production.`
  );
  return devFallback;
}

export const env = {
  isProd,
  port: Number(process.env.PORT) || 4000,
  jwtAccessSecret: required("JWT_ACCESS_SECRET", DEV_FALLBACK_JWT_SECRET),
  encryptionKey: required("PULSEX_ENC_KEY", DEV_FALLBACK_ENC_KEY),
  // Comma-separated list of allowed browser origins, e.g. "https://app.pulsex.ai,https://admin.pulsex.ai"
  corsOrigins: (process.env.CORS_ORIGINS || "http://localhost:5173,http://127.0.0.1:5173")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
};
