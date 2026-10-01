"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { RecurringTaskDTO } from "@/types/recurring-task";
import type { TaskCategory, EstimateUnit, TaskPriority } from "@/models/Task";
import type { RecurrenceFrequency } from "@/models/RecurringTask";
import type { RecurringLogStatus } from "@/models/RecurringTaskLog";

export type { RecurringLogStatus };

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

const QUERY_KEY = ["recurring-tasks"];

export function useRecurringTasksQuery() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => fetchJson<RecurringTaskDTO[]>("/api/recurring-tasks"),
  });
}

export interface RecurringTemplateStats {
  id: string;
  title: string;
  category: TaskCategory;
  frequency: RecurrenceFrequency;
  active: boolean;
  totalDue: number;
  totalDone: number;
  adherenceRate: number | null;
  currentStreak: number;
  bestStreak: number;
}

export interface RecurringDailyTrendPoint {
  date: string; // "YYYY-MM-DD"
  totalDue: number;
  totalDone: number;
}

export interface RecurringAnalytics {
  overall: { totalDue: number; totalDone: number; adherenceRate: number | null };
  templates: RecurringTemplateStats[];
  dailyTrend: RecurringDailyTrendPoint[];
}

export function useRecurringAnalytics() {
  return useQuery({
    queryKey: ["recurring-analytics"],
    queryFn: () => fetchJson<RecurringAnalytics>("/api/analytics/recurring"),
  });
}

export interface CreateRecurringTaskInput {
  category: TaskCategory;
  title: string;
  description?: string;
  priority?: TaskPriority;
  estimateValue?: number;
  estimateUnit?: EstimateUnit;
  frequency: RecurrenceFrequency;
  daysOfWeek?: number[];
  daysOfMonth?: number[];
  startDate?: string;
  endDate?: string;
}

function invalidateRecurring(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  queryClient.invalidateQueries({ queryKey: ["recurring-analytics"] });
  queryClient.invalidateQueries({ queryKey: ["tasks"] });
}

export function useCreateRecurringTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRecurringTaskInput) =>
      fetchJson<RecurringTaskDTO>("/api/recurring-tasks", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      invalidateRecurring(queryClient);
      toast.success("Recurring task created");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export interface UpdateRecurringTaskInput {
  id: string;
  title?: string;
  description?: string;
  priority?: TaskPriority;
  estimateValue?: number;
  estimateUnit?: EstimateUnit;
  active?: boolean;
  endDate?: string | null;
  frequency?: RecurrenceFrequency;
  daysOfWeek?: number[];
  daysOfMonth?: number[];
}

export function useUpdateRecurringTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateRecurringTaskInput) =>
      fetchJson<RecurringTaskDTO>(`/api/recurring-tasks/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => {
      invalidateRecurring(queryClient);
      toast.success("Recurring task updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteRecurringTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchJson<{ success: boolean }>(`/api/recurring-tasks/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidateRecurring(queryClient);
      toast.success("Recurring task deleted");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export interface RecurringLogEntry {
  date: string; // "YYYY-MM-DD"
  status: RecurringLogStatus;
}

export interface RecurringTaskLogResponse {
  templateId: string;
  from: string;
  to: string;
  entries: RecurringLogEntry[];
  dueDates: string[];
}

export function useRecurringTaskLog(templateId: string | null, days = 90) {
  return useQuery({
    queryKey: ["recurring-log", templateId, days],
    queryFn: () => fetchJson<RecurringTaskLogResponse>(`/api/recurring-tasks/${templateId}/log?days=${days}`),
    enabled: Boolean(templateId),
  });
}

export function useToggleRecurringLogDay(templateId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["recurring-log", templateId] as const;

  return useMutation({
    mutationFn: ({ date, status }: { date: string; status: RecurringLogStatus }) =>
      fetchJson<RecurringLogEntry & { resolvedAt: string }>(`/api/recurring-tasks/${templateId}/log/${date}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onMutate: async ({ date, status }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueriesData<RecurringTaskLogResponse>({ queryKey });
      queryClient.setQueriesData<RecurringTaskLogResponse>({ queryKey }, (old) => {
        if (!old) return old;
        const withoutDay = old.entries.filter((e) => e.date !== date);
        return { ...old, entries: [...withoutDay, { date, status }] };
      });
      return { previous };
    },
    onError: (error: Error, _input, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
      toast.error(error.message || "Couldn't update that day");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["recurring-analytics"] });
    },
  });
}
