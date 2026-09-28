"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { apiClient } from "@/lib/http/client";

/** Fetches an admin list endpoint whenever its query parameters change. */
export function useAdminList<T>(path: string, params: Record<string, string | number | undefined>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== "" && v !== "ALL") as [string, string][],
  ).toString();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await apiClient.get<T>(`${path}${qs ? `?${qs}` : ""}`));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load");
    } finally {
      setLoading(false);
    }
  }, [path, qs]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, reload: load, queryString: qs };
}
