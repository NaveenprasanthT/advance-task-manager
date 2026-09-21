"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CalendarClock, ListChecks, Sparkles, ExternalLink } from "lucide-react";
import type { TaskDTO } from "@/types/task";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { STATUS_CHART_COLORS, OVERDUE_COLOR } from "@/lib/chart-colors";
import { PRIORITY_COLORS } from "@/lib/constants";
import { isTaskOverdue } from "@/lib/task-utils";

export function TaskCard({ task, onClick }: { task: TaskDTO; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const doneSubtasks = task.subtasks.filter((s) => s.status === "Done").length;
  const overdue = isTaskOverdue(task);
  const borderColor = overdue ? OVERDUE_COLOR : STATUS_CHART_COLORS[task.status];

  return (
    <Card
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        "cursor-grab touch-none border-l-4 py-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing",
        isDragging && "opacity-50",
      )}
      style={{ ...style, borderLeftColor: borderColor }}
    >
      <CardContent className="space-y-2 px-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-snug">{task.title}</p>
          <div className="flex shrink-0 gap-1">
            <Badge variant="secondary" className={PRIORITY_COLORS[task.priority]}>
              {task.priority}
            </Badge>
            {task.origin === "auto" ? (
              <Badge
                variant="secondary"
                className="gap-1 bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-200"
              >
                <Sparkles className="size-3" />
                Auto
              </Badge>
            ) : null}
          </div>
        </div>
        {task.resourceUrl ? (
          <a
            href={task.resourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <ExternalLink className="size-3" />
            Learn more
          </a>
        ) : null}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {task.dueDate ? (
            <span className={cn("flex items-center gap-1", overdue && "font-medium text-destructive")}>
              <CalendarClock className="size-3" />
              {new Date(task.dueDate).toLocaleDateString()}
            </span>
          ) : null}
          {task.estimateValue ? (
            <span>
              {task.estimateValue} {task.estimateUnit}
            </span>
          ) : null}
          {task.subtasks.length > 0 ? (
            <span className="flex items-center gap-1">
              <ListChecks className="size-3" />
              {doneSubtasks}/{task.subtasks.length}
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
