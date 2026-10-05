"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { StudyPlanTimeline } from "@/components/study-planner/StudyPlanTimeline";
import { AddStudyPlanEntryDialog } from "@/components/study-planner/AddStudyPlanEntryDialog";
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import { useStudyPlan, useDeleteStudyPlan } from "@/hooks/useStudyPlans";

const FREQUENCY_LABELS: Record<string, string> = { daily: "Daily", weekly: "Weekly", monthly: "Monthly" };

export default function StudyPlanDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading } = useStudyPlan(params.id);
  const deletePlan = useDeleteStudyPlan();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (isLoading || !data) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  const { plan, entries } = data;
  const completed = entries.filter((e) => e.status === "Completed").length;
  const percent = entries.length > 0 ? Math.round((completed / entries.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <Button type="button" variant="ghost" size="sm" onClick={() => router.push("/study-planner")}>
        <ArrowLeft className="size-4" />
        Back to Study Planner
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold sm:text-2xl">{plan.title}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary" className="font-normal">
              {FREQUENCY_LABELS[plan.frequency]}
            </Badge>
            <span>
              {new Date(plan.startDate).toLocaleDateString()}
              {plan.endDate ? ` - ${new Date(plan.endDate).toLocaleDateString()}` : ""}
            </span>
          </div>
        </div>
        <Button type="button" variant="destructive" size="sm" onClick={() => setConfirmingDelete(true)}>
          <Trash2 className="size-4" />
          Delete plan
        </Button>
      </div>

      <ConfirmDeleteDialog
        open={confirmingDelete}
        itemName={plan.title}
        itemTypeLabel="study plan"
        isPending={deletePlan.isPending}
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={() => {
          deletePlan.mutate(plan.id, { onSuccess: () => router.push("/study-planner") });
        }}
      />

      <div className="space-y-1">
        <Progress value={percent} />
        <p className="text-sm text-muted-foreground">
          {completed}/{entries.length} days complete ({percent}%)
        </p>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Timeline</h2>
        <AddStudyPlanEntryDialog planId={plan.id} />
      </div>

      <StudyPlanTimeline entries={entries} planId={plan.id} />
    </div>
  );
}
