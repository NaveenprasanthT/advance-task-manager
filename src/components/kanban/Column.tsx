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
    <div className="flex w-72 shrink-0 flex-col rounded-lg border bg-muted/20 h-full min-h-0 max-h-full">
      <div className="flex items-center justify-between px-3 py-2 shrink-0 border-b bg-muted/30 rounded-t-lg">
        <span className={cn("rounded px-2 py-0.5 text-xs font-medium", badgeClassName)}>{label}</span>
        <span className="text-xs text-muted-foreground font-medium">{tasks.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-1 min-h-0 flex-col gap-2.5 p-2 overflow-y-auto transition-colors",
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
