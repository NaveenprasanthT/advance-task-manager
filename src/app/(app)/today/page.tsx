"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, PartyPopper } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PRIORITY_COLORS } from "@/lib/constants";
import { OVERDUE_BADGE_CLASS } from "@/lib/task-utils";
import { useToday } from "@/hooks/useToday";
import { useUpdateTaskStatus } from "@/hooks/useTasks";
import { useToggleRecurringLogDay } from "@/hooks/useRecurringTasks";
import { useUpdateStudyPlanEntryStatus } from "@/hooks/useStudyPlans";
import type { TaskDTO } from "@/types/task";
import type { TodayRecurringItem, TodayStudyPlanItem } from "@/types/today";

const RECURRING_STATUS_BADGE: Record<TodayRecurringItem["status"], string> = {
  pending: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  done: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200",
  missed: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200",
};

const STUDY_STATUS_BADGE: Record<TodayStudyPlanItem["status"], string> = {
  Pending: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  Completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200",
  Paused: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200",
  Skipped: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200",
};

function TodayTaskRow({ task, overdue }: { task: TaskDTO; overdue?: boolean }) {
  const queryClient = useQueryClient();
  const updateStatus = useUpdateTaskStatus(task.category);

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border p-3">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-medium">{task.title}</span>
          <Badge variant="secondary" className="font-normal">
            {task.category}
          </Badge>
          <Badge className={PRIORITY_COLORS[task.priority]} variant="secondary">
            {task.priority}
          </Badge>
          {overdue ? (
            <Badge className={OVERDUE_BADGE_CLASS} variant="secondary">
              Overdue
            </Badge>
          ) : null}
        </div>
        {task.description ? <p className="truncate text-sm text-muted-foreground">{task.description}</p> : null}
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={updateStatus.isPending}
        onClick={() =>
          updateStatus.mutate(
            { id: task.id, status: "Done" },
            { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["today"] }) },
          )
        }
      >
        <CheckCircle2 className="size-3.5" />
        Done
      </Button>
    </div>
  );
}

function TodayRecurringRow({ item, date }: { item: TodayRecurringItem; date: string }) {
  const queryClient = useQueryClient();
  const toggle = useToggleRecurringLogDay(item.id);
  const isDone = item.status === "done";

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border p-3">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <span className="truncate font-medium">{item.title}</span>
        <Badge variant="secondary" className="font-normal">
          {item.category}
        </Badge>
        <Badge className={RECURRING_STATUS_BADGE[item.status]} variant="secondary">
          {item.status === "done" ? "Done" : item.status === "missed" ? "Missed" : "Pending"}
        </Badge>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {!isDone ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={toggle.isPending}
            onClick={() =>
              toggle.mutate(
                { date, status: "done" },
                { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["today"] }) },
              )
            }
          >
            <CheckCircle2 className="size-3.5" />
            Done
          </Button>
        ) : null}
        <Link href="/recurring" className="text-xs text-primary hover:underline">
          View
        </Link>
      </div>
    </div>
  );
}

function TodayStudyPlanRow({ item }: { item: TodayStudyPlanItem }) {
  const queryClient = useQueryClient();
  const updateStatus = useUpdateStudyPlanEntryStatus(item.planId);
  const isDone = item.status === "Completed";

  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="truncate font-medium">{item.planTitle}</span>
          <span className="text-xs text-muted-foreground">
            Day {item.index + 1}
            {item.label ? ` - ${item.label}` : ""}
          </span>
        </div>
        <Badge className={STUDY_STATUS_BADGE[item.status]} variant="secondary">
          {item.status}
        </Badge>
      </div>

      {item.topics.length > 0 ? (
        <ul className="space-y-1 text-sm">
          {item.topics.map((topic, i) => (
            <li key={i}>
              <span className="font-medium">{topic.title}</span>
              {topic.description ? <span className="text-muted-foreground"> - {topic.description}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex items-center justify-between">
        {!isDone ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={updateStatus.isPending}
            onClick={() =>
              updateStatus.mutate(
                { entryId: item.entryId, status: "Completed" },
                { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["today"] }) },
              )
            }
          >
            <CheckCircle2 className="size-3.5" />
            Complete
          </Button>
        ) : (
          <span />
        )}
        <Link href={`/study-planner/${item.planId}`} className="text-xs text-primary hover:underline">
          View plan
        </Link>
      </div>
    </div>
  );
}

export default function TodayPage() {
  const { data, isLoading } = useToday();

  if (isLoading || !data) {
    return <p className="text-sm text-muted-foreground">Loading today...</p>;
  }

  const { tasks, recurring, studyPlans, date } = data;
  const nothingToDo =
    tasks.dueToday.length === 0 && tasks.overdue.length === 0 && recurring.length === 0 && studyPlans.length === 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Today</h1>

      {nothingToDo ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <PartyPopper className="size-8 text-emerald-500" />
            <p className="font-medium">You&apos;re all caught up.</p>
            <p className="text-sm text-muted-foreground">Nothing due today across tasks, routines, or study plans.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {tasks.overdue.length > 0 || tasks.dueToday.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tasks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {tasks.overdue.map((task) => (
                  <TodayTaskRow key={task.id} task={task} overdue />
                ))}
                {tasks.dueToday.map((task) => (
                  <TodayTaskRow key={task.id} task={task} />
                ))}
              </CardContent>
            </Card>
          ) : null}

          {recurring.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recurring routines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {recurring.map((item) => (
                  <TodayRecurringRow key={item.id} item={item} date={date} />
                ))}
              </CardContent>
            </Card>
          ) : null}

          {studyPlans.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Study plans</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {studyPlans.map((item) => (
                  <TodayStudyPlanRow key={item.entryId} item={item} />
                ))}
              </CardContent>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}
