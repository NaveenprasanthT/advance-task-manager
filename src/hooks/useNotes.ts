"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { NoteDTO } from "@/types/note";

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

const QUERY_KEY = ["notes"];

export function useNotesQuery() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => fetchJson<NoteDTO[]>("/api/notes"),
  });
}

export interface CreateNoteInput {
  title: string;
  date?: string;
  description?: string;
}

function invalidateNotes(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: QUERY_KEY });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateNoteInput) =>
      fetchJson<NoteDTO>("/api/notes", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      invalidateNotes(queryClient);
      toast.success("Note created");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export interface UpdateNoteInput {
  id: string;
  title?: string;
  date?: string | null;
  description?: string;
}

export function useUpdateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateNoteInput) =>
      fetchJson<NoteDTO>(`/api/notes/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => invalidateNotes(queryClient),
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchJson<{ success: boolean }>(`/api/notes/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidateNotes(queryClient);
      toast.success("Note deleted");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
