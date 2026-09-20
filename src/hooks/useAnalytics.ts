"use client";

import { useQuery } from "@tanstack/react-query";

export interface UserAnalytics {
  statusCounts: Record<string, number>;
  categoryCounts: Record<string, number>;
  onTimeRate: number | null;
  onTimeCount: number;
  lateCount: number;
  overdueCount: number;
  completionTrend: { week: string; completed: number }[];
  avgTimeInStatusDays: Record<string, number>;
  subtaskCompletionRate: number | null;
  totalSubtasks: number;
}

export interface AdminAnalytics {
  totalUsers: number;
  signupTrend: { week: string; count: number }[];
  activeUsers7d: number;
  activeUsers30d: number;
  platformOnTimeRate: number | null;
  leaderboard: { name: string; email: string; completed: number; onTimeRate: number }[];
  categorySplit: Record<string, number>;
  engagementTrend: { week: string; created: number; completed: number }[];
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load analytics");
  return res.json();
}

export function useUserAnalytics() {
  return useQuery({
    queryKey: ["analytics", "user"],
    queryFn: () => fetchJson<UserAnalytics>("/api/analytics/user"),
  });
}

export function useAdminAnalytics() {
  return useQuery({
    queryKey: ["analytics", "admin"],
    queryFn: () => fetchJson<AdminAnalytics>("/api/analytics/admin"),
  });
}
