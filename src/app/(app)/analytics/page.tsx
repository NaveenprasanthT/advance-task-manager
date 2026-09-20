"use client";

import { useUserAnalytics } from "@/hooks/useAnalytics";
import { StatCard } from "@/components/analytics/StatCard";
import { StatusBreakdownChart } from "@/components/analytics/StatusBreakdownChart";
import { CategorySplitChart } from "@/components/analytics/CategorySplitChart";
import { CompletionTrendChart } from "@/components/analytics/CompletionTrendChart";
import { TimeInStatusChart } from "@/components/analytics/TimeInStatusChart";

export default function AnalyticsPage() {
  const { data, isLoading } = useUserAnalytics();

  if (isLoading || !data) {
    return <p className="text-sm text-muted-foreground">Loading analytics...</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Analytics</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Completed on time" value={data.onTimeCount} tone="good" />
        <StatCard label="Completed late" value={data.lateCount} tone="warning" />
        <StatCard label="Total subtasks" value={data.totalSubtasks} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <StatusBreakdownChart statusCounts={data.statusCounts} />
        <CategorySplitChart categoryCounts={data.categoryCounts} />
        <CompletionTrendChart trend={data.completionTrend} />
        <TimeInStatusChart avgDays={data.avgTimeInStatusDays} />
      </div>
    </div>
  );
}
