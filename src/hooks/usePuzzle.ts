"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

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

export interface NewPuzzleResponse {
  needsInterests?: boolean;
  puzzleId?: string;
  imageUrls?: string[];
  wordLength?: number;
}

export function useNewPuzzle() {
  return useMutation({
    mutationFn: () => fetchJson<NewPuzzleResponse>("/api/puzzle/new", { method: "POST" }),
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useGuessPuzzle() {
  return useMutation({
    mutationFn: ({ puzzleId, guess }: { puzzleId: string; guess: string }) =>
      fetchJson<{ correct: boolean }>(`/api/puzzle/${puzzleId}/guess`, {
        method: "POST",
        body: JSON.stringify({ guess }),
      }),
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useClue() {
  return useMutation({
    mutationFn: (puzzleId: string) =>
      fetchJson<{ index: number; letter: string }>(`/api/puzzle/${puzzleId}/clue`, { method: "POST" }),
    onError: (error: Error) => toast.error(error.message),
  });
}
