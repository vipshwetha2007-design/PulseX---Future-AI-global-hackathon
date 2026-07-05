import { useCallback, useEffect, useState } from "react";

/**
 * Minimal fetch-state hook. Not a replacement for React Query — this project
 * doesn't have it configured — just enough to avoid re-writing
 * loading/error/refetch plumbing on every page.
 */
export function useApiData(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetcher()
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.error || "Failed to load data");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => load(), [load]);

  return { data, setData, loading, error, refetch: load };
}
