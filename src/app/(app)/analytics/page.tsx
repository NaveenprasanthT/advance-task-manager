"use client";

import { Flame, Repeat, CheckCircle2, GraduationCap, BookOpen } from "lucide-react";
import { useUserAnalytics } from "@/hooks/useAnalytics";
import { useRecurringAnalytics } from "@/hooks/useRecurringTasks";
import { useStudyPlanAnalytics } from "@/hooks/useStudyPlans";
import { StatCard } from "@/components/analytics/StatCard";
import { StatusBreakdownChart } from "@/components/analytics/StatusBreakdownChart";
import { CategorySplitChart } from "@/components/analytics/CategorySplitChart";
import { CompletionTrendChart } from "@/components/analytics/CompletionTrendChart";
import { TimeInStatusChart } from "@/components/analytics/TimeInStatusChart";
import { RecurringAdherenceTrendChart } from "@/components/recurring/RecurringAdherenceTrendChart";
import { RecurringTemplateAdherenceChart } from "@/components/recurring/RecurringTemplateAdherenceChart";
import { StudyPlanActivityTrendChart } from "@/components/study-planner/StudyPlanActivityTrendChart";
import { StudyPlanStatusBreakdownChart } from "@/components/study-planner/StudyPlanStatusBreakdownChart";

export default function AnalyticsPage() {
  const { data, isLoading } = useUserAnalytics();
  const { data: recurring, isLoading: recurringLoading } = useRecurringAnalytics();
  const { data: studyPlans, isLoading: studyPlansLoading } = useStudyPlanAnalytics();

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

      {!recurringLoading && recurring && recurring.templates.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Recurring routines</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label="Routine adherence"
              value={recurring.overall.adherenceRate === null ? "—" : `${recurring.overall.adherenceRate}%`}
              tone="good"
              icon={Repeat}
            />
            <StatCard
              label="Best streak"
              value={Math.max(0, ...recurring.templates.map((t) => t.bestStreak))}
              icon={Flame}
            />
            <StatCard
              label="Active routines"
              value={recurring.templates.filter((t) => t.active).length}
              icon={CheckCircle2}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <RecurringAdherenceTrendChart trend={recurring.dailyTrend} />
            <RecurringTemplateAdherenceChart templates={recurring.templates} />
          </div>
        </div>
      ) : null}

      {!studyPlansLoading && studyPlans && studyPlans.overall.totalPlans > 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Study Plans</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label="Completion"
              value={studyPlans.overall.percentComplete === null ? "—" : `${studyPlans.overall.percentComplete}%`}
              tone="good"
              icon={GraduationCap}
            />
            <StatCard label="Topics studied" value={studyPlans.overall.topicsCompleted} icon={BookOpen} />
            <StatCard label="Best streak" value={studyPlans.overall.bestStreak} icon={Flame} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <StudyPlanActivityTrendChart trend={studyPlans.dailyTrend} />
            <StudyPlanStatusBreakdownChart statusBreakdown={studyPlans.statusBreakdown} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
