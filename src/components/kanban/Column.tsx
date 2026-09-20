"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { TaskDTO } from "@/types/task";
import { TaskCard } from "./TaskCard";
import { cn } from "@/lib/utils";

interface ColumnProps {
  laneId: string;
  label: string;
  badgeClassName: string;
  tasks: TaskDTO[];
  onSelectTask: (id: string) => void;
}

export function Column({ laneId, label, badgeClassName, tasks, onSelectTask }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: laneId });

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-lg border bg-muted/20">
      <div className="flex items-center justify-between px-3 py-2">
        <span className={cn("rounded px-2 py-0.5 text-xs font-medium", badgeClassName)}>{label}</span>
        <span className="text-xs text-muted-foreground">{tasks.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-24 flex-1 flex-col gap-2 p-2 pt-0 transition-colors",
          isOver && "bg-muted/50",
        )}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => onSelectTask(task.id)} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
