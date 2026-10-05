"use client";

import { useStudyPlans } from "@/hooks/useStudyPlans";
import { StudyPlanCard } from "@/components/study-planner/StudyPlanCard";
import { NewStudyPlanDialog } from "@/components/study-planner/NewStudyPlanDialog";

export default function StudyPlannerPage() {
  const { data: plans, isLoading } = useStudyPlans();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold sm:text-2xl">Study Planner</h1>
          <p className="text-sm text-muted-foreground">Track a curriculum day by day, imported from a file or built by hand.</p>
        </div>
        <NewStudyPlanDialog />
      </div>

      {isLoading || !plans ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : plans.length === 0 ? (
        <p className="text-sm text-muted-foreground">No study plans yet - create one to get started.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <StudyPlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      )}
    </div>
  );
}
