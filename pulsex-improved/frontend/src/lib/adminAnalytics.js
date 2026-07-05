// Small, dependency-free helpers that turn raw admin API payloads into
// chart-ready shapes. Kept separate from adminApi.js so pages can compose
// exactly the aggregation they need without duplicating date math.

const DAY_MS = 24 * 60 * 60 * 1000;

function dayLabel(date) {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// Builds a fixed-length daily series (oldest -> newest) counting how many
// items from `records` fall on each of the last `days` days, using `dateKey`
// to read the timestamp off each record.
export function dailySeries(records, dateKey, days = 14) {
  const buckets = [];
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(now.getTime() - i * DAY_MS);
    buckets.push({ label: dayLabel(day), start: new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime() });
  }
  const counts = buckets.map((b) => ({ label: b.label, value: 0, start: b.start }));
  records.forEach((r) => {
    const t = new Date(r[dateKey]).getTime();
    if (Number.isNaN(t)) return;
    for (let i = counts.length - 1; i >= 0; i--) {
      if (t >= counts[i].start) {
        if (i === counts.length - 1 || t < counts[i + 1].start) counts[i].value += 1;
        break;
      }
    }
  });
  return counts.map(({ label, value }) => ({ label, value }));
}

export function countBy(list, keyFn) {
  const map = new Map();
  list.forEach((item) => {
    const key = keyFn(item) ?? "unknown";
    map.set(key, (map.get(key) || 0) + 1);
  });
  return [...map.entries()].map(([label, value]) => ({ label, value }));
}

export function percentChange(current, previous) {
  if (!previous) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

// Splits a daily series in half and compares the two halves — a lightweight
// stand-in for real period-over-period comparison given this demo dataset
// doesn't carry historical snapshots.
export function trendFromSeries(series) {
  const mid = Math.floor(series.length / 2) || 1;
  const first = series.slice(0, mid).reduce((s, p) => s + p.value, 0);
  const second = series.slice(mid).reduce((s, p) => s + p.value, 0);
  return percentChange(second, first);
}

export const severityTone = { high: "pulse", medium: "amber", low: "vital" };
