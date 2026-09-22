"use client";

import { useQuery } from "@tanstack/react-query";
import type { AiRequestFeature, AiRequestStage, AiRequestStatus } from "@/models/AiRequestLog";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export interface AiRequestLogFiltersState {
  status: AiRequestStatus[];
  userEmail: string;
  from?: string;
  to?: string;
  page: number;
}

export const DEFAULT_AI_REQUEST_LOG_FILTERS: AiRequestLogFiltersState = {
  status: [],
  userEmail: "",
  from: undefined,
  to: undefined,
  page: 1,
};

export interface AiRequestLogRow {
  id: string;
  feature: AiRequestFeature;
  userEmail: string | null;
  status: AiRequestStatus;
  stage: AiRequestStage | null;
  errorMessage: string | null;
  attempts: number;
  durationMs: number | null;
  createdAt: string | null;
}

export interface AiRequestLogListResponse {
  logs: AiRequestLogRow[];
  total: number;
  page: number;
  pageSize: number;
}

function buildQuery(filters: AiRequestLogFiltersState): string {
  const params = new URLSearchParams();
  if (filters.status.length) params.set("status", filters.status.join(","));
  if (filters.userEmail.trim()) params.set("userEmail", filters.userEmail.trim());
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  params.set("page", String(filters.page));
  params.set("pageSize", "20");
  return params.toString();
}

export function useAiRequestLogs(filters: AiRequestLogFiltersState) {
  return useQuery({
    queryKey: ["admin", "ai-request-logs", filters],
    queryFn: () => fetchJson<AiRequestLogListResponse>(`/api/admin/ai-request-logs?${buildQuery(filters)}`),
  });
}
