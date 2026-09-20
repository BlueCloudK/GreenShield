import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";

export function useApiResource(path, options = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!path) return;
    if (!options.silent) setLoading(true);
    try {
      const result = await api(path);
      setData(result);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [path, options.silent]);

  useEffect(() => { load(); }, [load]);
  return { data, error, loading, reload: load, setData };
}

