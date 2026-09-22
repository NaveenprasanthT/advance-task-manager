"use client";

import { AlertTriangle, CheckCircle2, ListChecks, Timer } from "lucide-react";
import { useUserAnalytics } from "@/hooks/useAnalytics";
import { StatCard } from "@/components/analytics/StatCard";
import { StatusBreakdownChart } from "@/components/analytics/StatusBreakdownChart";
import { CategorySplitChart } from "@/components/analytics/CategorySplitChart";
import { UpcomingMemoriesCard } from "@/components/dashboard/UpcomingMemoriesCard";
import { RoutineAdherenceCard } from "@/components/dashboard/RoutineAdherenceCard";

export default function DashboardPage() {
  const { data, isLoading } = useUserAnalytics();

  if (isLoading || !data) {
    return <p className="text-sm text-muted-foreground">Loading dashboard...</p>;
  }

  const totalTasks = Object.values(data.statusCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div data-tour="dashboard-overview" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total tasks" value={totalTasks} icon={ListChecks} />
        <StatCard
          label="On-time completion"
          value={data.onTimeRate === null ? "—" : `${data.onTimeRate}%`}
          icon={CheckCircle2}
          tone="good"
        />
        <StatCard
          label="Overdue tasks"
          value={data.overdueCount}
          icon={AlertTriangle}
          tone={data.overdueCount > 0 ? "critical" : "default"}
        />
        <StatCard
          label="Subtask completion"
          value={data.subtaskCompletionRate === null ? "—" : `${data.subtaskCompletionRate}%`}
          icon={Timer}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <StatusBreakdownChart statusCounts={data.statusCounts} />
        <CategorySplitChart categoryCounts={data.categoryCounts} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RoutineAdherenceCard />
        <UpcomingMemoriesCard />
      </div>
    </div>
  );
}
