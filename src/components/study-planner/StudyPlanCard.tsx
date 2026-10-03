"use client";

import Link from "next/link";
import { Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { StudyPlanSummaryDTO } from "@/types/study-plan";

const FREQUENCY_LABELS: Record<StudyPlanSummaryDTO["frequency"], string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

export function StudyPlanCard({ plan }: { plan: StudyPlanSummaryDTO }) {
  return (
    <Link href={`/study-planner/${plan.id}`}>
      <Card className="cursor-pointer transition-shadow hover:shadow-md">
        <CardHeader>
          <CardTitle className="flex items-start justify-between gap-2">
            <span className="line-clamp-2">{plan.title}</span>
            {plan.status === "archived" ? <Badge variant="secondary">Archived</Badge> : null}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary" className="font-normal">
              {FREQUENCY_LABELS[plan.frequency]}
            </Badge>
            <span>
              {new Date(plan.startDate).toLocaleDateString()}
              {plan.endDate ? ` - ${new Date(plan.endDate).toLocaleDateString()}` : ""}
            </span>
          </div>

          <div className="space-y-1">
            <Progress value={plan.percentComplete ?? 0} />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {plan.completedEntries}/{plan.totalEntries} complete
                {plan.percentComplete === null ? "" : ` (${plan.percentComplete}%)`}
              </span>
              <span className="flex items-center gap-1">
                <Flame className="size-3.5 text-orange-500" />
                {plan.currentStreak}
              </span>
            </div>
          </div>

          {plan.totalEntries > 0 ? (
            <Badge
              variant="secondary"
              className={
                plan.paceStatus === "behind"
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200"
                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200"
              }
            >
              {plan.paceStatus === "behind" ? `Behind by ${plan.behindCount}` : "On track"}
            </Badge>
          ) : null}

          {plan.nextPendingEntry ? (
            <p className="text-sm text-muted-foreground">
              Next: Day {plan.nextPendingEntry.index + 1}
              {plan.nextPendingEntry.label ? ` - ${plan.nextPendingEntry.label}` : ""}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
}
