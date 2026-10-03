"use client";

import Link from "next/link";
import { Flame, GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStudyPlans } from "@/hooks/useStudyPlans";

export function StudyPlanProgressCard() {
  const { data, isLoading } = useStudyPlans();

  if (!isLoading && (!data || data.length === 0)) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <GraduationCap className="size-4" />
          Study progress
        </CardTitle>
        <Link href="/study-planner" className="text-xs text-primary hover:underline">
          View all
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading || !data ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          <ul className="space-y-1.5">
            {data.map((plan) => (
              <li key={plan.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate">{plan.title}</span>
                <span className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                  <span>{plan.percentComplete === null ? "—" : `${plan.percentComplete}%`}</span>
                  <span className="flex items-center gap-1">
                    <Flame className="size-3.5 text-orange-500" />
                    {plan.currentStreak}
                  </span>
                  {plan.totalEntries > 0 ? (
                    <Badge
                      variant="secondary"
                      className={
                        plan.paceStatus === "behind"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200"
                          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200"
                      }
                    >
                      {plan.paceStatus === "behind" ? `-${plan.behindCount}` : "On track"}
                    </Badge>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
