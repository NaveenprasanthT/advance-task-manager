"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { CronLogEntryStatus, CronLogEntryType, CronRunStatus, CronRunTrigger } from "@/models/CronLog";
import type { TaskCategory } from "@/models/Task";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export interface CronLogFiltersState {
  status: CronRunStatus[];
  category: "all" | TaskCategory;
  userEmail: string;
  from?: string;
  to?: string;
  page: number;
}

export const DEFAULT_CRON_LOG_FILTERS: CronLogFiltersState = {
  status: [],
  category: "all",
  userEmail: "",
  from: undefined,
  to: undefined,
  page: 1,
};

export interface CronLogSummary {
  id: string;
  trigger: CronRunTrigger;
  status: CronRunStatus;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  usersConsidered: number;
  entryCount: number;
  entryStatusCounts: Record<CronLogEntryStatus, number>;
  hadUnauthorizedAttempt: boolean;
  hadRouteError: boolean;
}

export interface CronLogListResponse {
  logs: CronLogSummary[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CronLogInterestResult {
  interest: string;
  succeeded: boolean;
  suggestionsCreated: number;
  attempts: number;
  errorMessage?: string | null;
}

export interface CronLogEntryDetail {
  id: string;
  type: CronLogEntryType;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  category: TaskCategory | null;
  status: CronLogEntryStatus;
  interests: CronLogInterestResult[];
  suggestionsCreated: number;
  lastGeneratedAtAdvanced: boolean;
  errorMessage: string | null;
  durationMs: number | null;
}

export interface CronLogDetail {
  id: string;
  trigger: CronRunTrigger;
  triggeredBy: string | null;
  retryOfLogId: string | null;
  retryOfEntryId: string | null;
  status: CronRunStatus;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  usersConsidered: number;
  hadUnauthorizedAttempt: boolean;
  hadRouteError: boolean;
  entries: CronLogEntryDetail[];
}

function buildQuery(filters: CronLogFiltersState): string {
  const params = new URLSearchParams();
  if (filters.status.length) params.set("status", filters.status.join(","));
  if (filters.category !== "all") params.set("category", filters.category);
  if (filters.userEmail.trim()) params.set("userEmail", filters.userEmail.trim());
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  params.set("page", String(filters.page));
  params.set("pageSize", "20");
  return params.toString();
}

export function useCronLogs(filters: CronLogFiltersState) {
  return useQuery({
    queryKey: ["admin", "cron-logs", filters],
    queryFn: () => fetchJson<CronLogListResponse>(`/api/admin/cron-logs?${buildQuery(filters)}`),
  });
}

export function useCronLogDetail(id: string | null) {
  return useQuery({
    queryKey: ["admin", "cron-logs", "detail", id],
    queryFn: () => fetchJson<CronLogDetail>(`/api/admin/cron-logs/${id}`),
    enabled: Boolean(id),
  });
}

export interface RetryCronLogEntryResponse {
  logId: string;
  entry: CronLogEntryDetail;
}

export function useRetryCronLogEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ logId, entryId }: { logId: string; entryId: string }) =>
      fetchJson<RetryCronLogEntryResponse>(`/api/admin/cron-logs/${logId}/retry`, {
        method: "POST",
        body: JSON.stringify({ entryId }),
      }),
    onSuccess: ({ entry }) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "cron-logs"] });
      if (entry.status === "success") toast.success("Retry succeeded");
      else if (entry.status === "partial") toast.warning("Retry partially succeeded");
      else toast.error("Retry did not produce any suggestions");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
