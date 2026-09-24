"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CalendarClock, ListChecks, Sparkles, ExternalLink } from "lucide-react";
import type { TaskDTO } from "@/types/task";
import { Card } from "@/components/ui/card";
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

  const doneSubtasks = task.subtasks?.filter((s) => s.status === "Done").length ?? 0;
  const overdue = isTaskOverdue(task);
  const borderColor = overdue ? OVERDUE_COLOR : STATUS_CHART_COLORS[task.status];
  const hasMetadata = Boolean(task.dueDate || task.estimateValue || (task.subtasks && task.subtasks.length > 0));

  return (
    <Card
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        "cursor-grab touch-none w-full shrink-0 border-l-4 p-3.5 min-h-[108px] shadow-sm transition-all hover:shadow-md active:cursor-grabbing rounded-lg flex flex-col justify-between gap-3 overflow-hidden",
        isDragging && "opacity-50",
      )}
      style={{ ...style, borderLeftColor: borderColor }}
    >
      {/* Top: Title and optional resource link */}
      <div className="space-y-1.5">
        <p className="text-sm font-medium leading-snug break-words">
          {task.title}
        </p>
        {task.resourceUrl ? (
          <a
            href={task.resourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <ExternalLink className="size-3" />
            Learn more
          </a>
        ) : null}
      </div>

      {/* Bottom: Tags and Metadata */}
      <div className="flex flex-wrap items-end justify-between gap-2 shrink-0">
        <div className="flex flex-wrap items-center gap-1.5">
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

        {hasMetadata ? (
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
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
            {task.subtasks && task.subtasks.length > 0 ? (
              <span className="flex items-center gap-1">
                <ListChecks className="size-3" />
                {doneSubtasks}/{task.subtasks.length}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
