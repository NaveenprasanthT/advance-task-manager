"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { MemoryDTO } from "@/types/memory";
import type { TaskPriority } from "@/models/Task";

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
async function fetchFormData<T>(url: string, method: "POST", formData: FormData): Promise<T> {
  const res = await fetch(url, { method, body: formData });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export interface MemoryFiltersState {
  search: string;
  category: string;
  priority: TaskPriority[];
  scope: "all" | "upcoming" | "past";
}

export const DEFAULT_MEMORY_FILTERS: MemoryFiltersState = {
  search: "",
  category: "",
  priority: [],
  scope: "all",
};

function buildQuery(filters: MemoryFiltersState): string {
  const params = new URLSearchParams();
  if (filters.search.trim()) params.set("search", filters.search.trim());
  if (filters.category.trim()) params.set("category", filters.category.trim());
  if (filters.priority.length === 1) params.set("priority", filters.priority[0]);
  if (filters.scope !== "all") params.set("scope", filters.scope);
  return params.toString();
}

export function useMemoriesQuery(filters: MemoryFiltersState) {
  return useQuery({
    queryKey: ["memories", filters],
    queryFn: () => fetchJson<MemoryDTO[]>(`/api/memories?${buildQuery(filters)}`),
  });
}

export function useUpcomingMemories(limit = 5) {
  return useQuery({
    queryKey: ["memories", "upcoming", limit],
    queryFn: () => fetchJson<MemoryDTO[]>(`/api/memories?scope=upcoming&limit=${limit}`),
  });
}

export interface CreateMemoryInput {
  name: string;
  description?: string;
  rememberDate?: string;
  category?: string;
  priority?: TaskPriority;
  files: File[];
}

function toFormData(input: Omit<CreateMemoryInput, "files"> & { files?: File[] }): FormData {
  const formData = new FormData();
  formData.set("name", input.name);
  if (input.description) formData.set("description", input.description);
  if (input.rememberDate) formData.set("rememberDate", input.rememberDate);
  if (input.category) formData.set("category", input.category);
  if (input.priority) formData.set("priority", input.priority);
  for (const file of input.files ?? []) formData.append("files", file);
  return formData;
}

function invalidateMemories(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["memories"] });
}

export function useCreateMemory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMemoryInput) =>
      fetchFormData<MemoryDTO>("/api/memories", "POST", toFormData(input)),
    onSuccess: () => {
      invalidateMemories(queryClient);
      toast.success("Memory saved");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export interface UpdateMemoryInput {
  id: string;
  name?: string;
  description?: string;
  rememberDate?: string | null;
  category?: string;
  priority?: TaskPriority;
}

export function useUpdateMemory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateMemoryInput) =>
      fetchJson<MemoryDTO>(`/api/memories/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => {
      invalidateMemories(queryClient);
      toast.success("Memory updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteMemory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchJson<{ success: boolean }>(`/api/memories/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidateMemories(queryClient);
      toast.success("Memory deleted");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useAddMemoryFiles() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, files }: { id: string; files: File[] }) => {
      const formData = new FormData();
      for (const file of files) formData.append("files", file);
      return fetchFormData<MemoryDTO>(`/api/memories/${id}/files`, "POST", formData);
    },
    onSuccess: () => {
      invalidateMemories(queryClient);
      toast.success("Files added");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteMemoryFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, fileId }: { id: string; fileId: string }) =>
      fetchJson<MemoryDTO>(`/api/memories/${id}/files/${fileId}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidateMemories(queryClient);
      toast.success("File removed");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
