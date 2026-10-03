"use client";

import { useQuery } from "@tanstack/react-query";
import type { TodayView } from "@/types/today";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export function useToday() {
  return useQuery({
    queryKey: ["today"],
    queryFn: () => fetchJson<TodayView>("/api/today"),
  });
}
