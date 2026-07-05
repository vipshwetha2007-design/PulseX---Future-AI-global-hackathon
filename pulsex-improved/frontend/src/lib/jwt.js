// Client-side JWT helpers. These only ever read the payload for UX purposes
// (e.g. deciding when to proactively log out) — the backend is always the
// real authority on whether a token is valid.

export function decodeToken(token) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function getTokenExpiryMs(token) {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return null;
  return payload.exp * 1000;
}

export function isTokenExpired(token) {
  const expiryMs = getTokenExpiryMs(token);
  if (expiryMs === null) return true;
  return Date.now() >= expiryMs;
}
