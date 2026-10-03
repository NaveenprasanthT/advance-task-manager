"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { StudyPlanDTO, StudyPlanSummaryDTO, StudyPlanEntryDTO } from "@/types/study-plan";
import type { StudyPlanFrequency, StudyPlanStatus } from "@/models/StudyPlan";
import type { StudyPlanEntryStatus } from "@/models/StudyPlanEntry";
import type { ParsePlanDocumentResult } from "@/lib/study-plan/parse-plan-document";

export interface StudyPlanAnalytics {
  overall: {
    totalPlans: number;
    activePlans: number;
    totalEntries: number;
    completedEntries: number;
    percentComplete: number | null;
    topicsCompleted: number;
    bestStreak: number;
  };
  statusBreakdown: Record<StudyPlanEntryStatus, number>;
  dailyTrend: { date: string; completedCount: number }[];
}

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

// No Content-Type header here - the browser sets multipart/form-data with
// the correct boundary itself; setting it manually breaks the upload.
async function fetchFormData<T>(url: string, formData: FormData): Promise<T> {
  const res = await fetch(url, { method: "POST", body: formData });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

const LIST_KEY = ["study-plans"];

export function useStudyPlans() {
  return useQuery({
    queryKey: LIST_KEY,
    queryFn: () => fetchJson<StudyPlanSummaryDTO[]>("/api/study-plans"),
  });
}

export interface StudyPlanDetail {
  plan: StudyPlanDTO;
  entries: StudyPlanEntryDTO[];
}

export function useStudyPlan(id: string | null) {
  return useQuery({
    queryKey: ["study-plans", id],
    queryFn: () => fetchJson<StudyPlanDetail>(`/api/study-plans/${id}`),
    enabled: Boolean(id),
  });
}

export function useStudyPlanAnalytics() {
  return useQuery({
    queryKey: ["study-plan-analytics"],
    queryFn: () => fetchJson<StudyPlanAnalytics>("/api/analytics/study-plans"),
  });
}

export function useParseStudyPlanFile() {
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.set("file", file);
      return fetchFormData<ParsePlanDocumentResult>("/api/study-plans/parse", formData);
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export interface CreateStudyPlanInput {
  title: string;
  frequency: StudyPlanFrequency;
  startDate: string;
  endDate?: string;
  entries: { index: number; label?: string; topics: { title: string; description?: string }[] }[];
  sourceFile?: File;
}

export function useCreateStudyPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateStudyPlanInput) => {
      const formData = new FormData();
      formData.set("title", input.title);
      formData.set("frequency", input.frequency);
      formData.set("startDate", input.startDate);
      if (input.endDate) formData.set("endDate", input.endDate);
      formData.set("entries", JSON.stringify(input.entries));
      if (input.sourceFile) formData.set("sourceFile", input.sourceFile);
      return fetchFormData<StudyPlanDTO>("/api/study-plans", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LIST_KEY });
      toast.success("Study plan created");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export interface UpdateStudyPlanInput {
  id: string;
  title?: string;
  frequency?: StudyPlanFrequency;
  endDate?: string | null;
  status?: StudyPlanStatus;
}

export function useUpdateStudyPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateStudyPlanInput) =>
      fetchJson<StudyPlanDTO>(`/api/study-plans/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: (_plan, input) => {
      queryClient.invalidateQueries({ queryKey: LIST_KEY });
      queryClient.invalidateQueries({ queryKey: ["study-plans", input.id] });
      toast.success("Study plan updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteStudyPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchJson<{ success: boolean }>(`/api/study-plans/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LIST_KEY });
      toast.success("Study plan deleted");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useAddStudyPlanEntry(planId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { label?: string; topics: { title: string; description?: string }[] }) =>
      fetchJson<StudyPlanEntryDTO>(`/api/study-plans/${planId}/entries`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["study-plans", planId] });
      queryClient.invalidateQueries({ queryKey: LIST_KEY });
      toast.success("Day added");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateStudyPlanEntry(planId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      entryId,
      ...input
    }: {
      entryId: string;
      label?: string;
      topics?: { title: string; description?: string }[];
      notes?: string;
    }) =>
      fetchJson<StudyPlanEntryDTO>(`/api/study-plans/${planId}/entries/${entryId}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["study-plans", planId] });
      toast.success("Day updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteStudyPlanEntry(planId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entryId: string) =>
      fetchJson<{ success: boolean }>(`/api/study-plans/${planId}/entries/${entryId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["study-plans", planId] });
      queryClient.invalidateQueries({ queryKey: LIST_KEY });
      toast.success("Day removed");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateStudyPlanEntryStatus(planId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["study-plans", planId];

  return useMutation({
    mutationFn: ({ entryId, status, reason }: { entryId: string; status: StudyPlanEntryStatus; reason?: string }) =>
      fetchJson<StudyPlanEntryDTO>(`/api/study-plans/${planId}/entries/${entryId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, reason }),
      }),
    onMutate: async ({ entryId, status, reason }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<StudyPlanDetail>(queryKey);
      queryClient.setQueryData<StudyPlanDetail>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          entries: old.entries.map((e) =>
            e.id === entryId ? { ...e, status, reason: status === "Skipped" ? (reason ?? null) : null } : e,
          ),
        };
      });
      return { previous };
    },
    onError: (error: Error, _input, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      toast.error(error.message || "Couldn't update that day");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: LIST_KEY });
    },
  });
}

export function useAddStudyPlanEntryFiles(planId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entryId, files }: { entryId: string; files: File[] }) => {
      const formData = new FormData();
      for (const file of files) formData.append("files", file);
      return fetchFormData<StudyPlanEntryDTO>(`/api/study-plans/${planId}/entries/${entryId}/files`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["study-plans", planId] });
      toast.success("File added");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteStudyPlanEntryFile(planId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entryId, fileId }: { entryId: string; fileId: string }) =>
      fetchJson<StudyPlanEntryDTO>(`/api/study-plans/${planId}/entries/${entryId}/files/${fileId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["study-plans", planId] });
      toast.success("File removed");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useAddStudyPlanEntryLink(planId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entryId, url, label }: { entryId: string; url: string; label?: string }) =>
      fetchJson<StudyPlanEntryDTO>(`/api/study-plans/${planId}/entries/${entryId}/links`, {
        method: "POST",
        body: JSON.stringify({ url, label }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["study-plans", planId] });
      toast.success("Link added");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteStudyPlanEntryLink(planId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entryId, linkId }: { entryId: string; linkId: string }) =>
      fetchJson<StudyPlanEntryDTO>(`/api/study-plans/${planId}/entries/${entryId}/links/${linkId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["study-plans", planId] });
      toast.success("Link removed");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
