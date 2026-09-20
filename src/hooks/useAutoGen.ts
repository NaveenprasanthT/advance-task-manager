"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { AutoGenFrequency } from "@/models/User";

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

export interface AutoGenCategorySettings {
  enabled: boolean;
  interests: string[];
  frequency: AutoGenFrequency;
  lastGeneratedAt: string | null;
}

export interface AutoGenSettings {
  personal: AutoGenCategorySettings;
  professional: AutoGenCategorySettings;
}

export type AutoGenCategoryKey = "personal" | "professional";

export function useAutoGenSettings() {
  return useQuery({
    queryKey: ["auto-gen-settings"],
    queryFn: () => fetchJson<AutoGenSettings>("/api/me/auto-generate"),
  });
}

export interface UpdateAutoGenInput {
  category: AutoGenCategoryKey;
  enabled?: boolean;
  interests?: string[];
  frequency?: AutoGenFrequency;
}

export function useUpdateAutoGenSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateAutoGenInput) =>
      fetchJson<AutoGenSettings>("/api/me/auto-generate", {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: (settings) => {
      queryClient.setQueryData(["auto-gen-settings"], settings);
      toast.success("Settings updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
