"use client";

import { Users, UserCheck, TrendingUp } from "lucide-react";
import { useAdminAnalytics } from "@/hooks/useAnalytics";
import { StatCard } from "@/components/analytics/StatCard";
import { CategorySplitChart } from "@/components/analytics/CategorySplitChart";
import { CompletionTrendChart } from "@/components/analytics/CompletionTrendChart";
import { LeaderboardChart } from "@/components/analytics/LeaderboardChart";
import { EngagementTrendChart } from "@/components/analytics/EngagementTrendChart";

export default function AdminDashboardPage() {
  const { data, isLoading } = useAdminAnalytics();

  if (isLoading || !data) {
    return <p className="text-sm text-muted-foreground">Loading admin dashboard...</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total users" value={data.totalUsers} icon={Users} />
        <StatCard label="Active (7 days)" value={data.activeUsers7d} icon={UserCheck} />
        <StatCard label="Active (30 days)" value={data.activeUsers30d} icon={UserCheck} />
        <StatCard
          label="Platform on-time rate"
          value={data.platformOnTimeRate === null ? "—" : `${data.platformOnTimeRate}%`}
          icon={TrendingUp}
          tone="good"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CompletionTrendChart trend={data.signupTrend.map((s) => ({ week: s.week, completed: s.count }))} title="New signups" />
        <CategorySplitChart categoryCounts={data.categorySplit} />
        <LeaderboardChart leaderboard={data.leaderboard} />
        <EngagementTrendChart trend={data.engagementTrend} />
      </div>
    </div>
  );
}
