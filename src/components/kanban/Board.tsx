"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { ListTodo, Briefcase, LayoutGrid, List as ListIcon } from "lucide-react";
import type { TaskCategory, TaskOrigin, TaskPriority, TaskStatus } from "@/models/Task";
import type { TaskDTO } from "@/types/task";
import { BOARD_LANES, PRIORITY_ORDER, STATUS_COLUMNS } from "@/lib/constants";
import { CATEGORY_CHART_COLORS } from "@/lib/chart-colors";
import { isTaskOverdue, OVERDUE_LANE_ID } from "@/lib/task-utils";
import { useTasksQuery, useUpdateTaskStatus } from "@/hooks/useTasks";
import { Column } from "./Column";
import { ListView } from "./ListView";
import { TaskDetailSheet } from "./TaskDetailSheet";
import { AbortReasonDialog } from "./AbortReasonDialog";
import { NewTaskDialog } from "./NewTaskDialog";
import { BoardFilters } from "./BoardFilters";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STATUS_SET = new Set(STATUS_COLUMNS.map((c) => c.status));

export function Board({ category }: { category: TaskCategory }) {
  const { data: tasks, isLoading } = useTasksQuery(category);
  const updateStatus = useUpdateTaskStatus(category);

  const [view, setView] = useState<"grid" | "list">("grid");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [pendingAbort, setPendingAbort] = useState<{ id: string; boardOrder: number } | null>(null);

  const [priorityFilter, setPriorityFilter] = useState<TaskPriority[]>([]);
  const [originFilter, setOriginFilter] = useState<"all" | TaskOrigin>("all");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [search, setSearch] = useState("");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const lane = (task: TaskDTO) => (isTaskOverdue(task) ? OVERDUE_LANE_ID : task.status);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (tasks ?? []).filter((task) => {
      if (priorityFilter.length > 0 && !priorityFilter.includes(task.priority)) return false;
      if (originFilter !== "all" && task.origin !== originFilter) return false;
      if (overdueOnly && !isTaskOverdue(task)) return false;
      if (query && !task.title.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [tasks, priorityFilter, originFilter, overdueOnly, search]);

  const grouped = useMemo(() => {
    const map: Record<string, TaskDTO[]> = {};
    for (const { id } of BOARD_LANES) map[id] = [];
    for (const task of filteredTasks) {
      map[lane(task)] = [...(map[lane(task)] ?? []), task];
    }
    for (const id of Object.keys(map)) {
      map[id] = map[id].slice().sort((a, b) => {
        const p = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
        return p !== 0 ? p : a.boardOrder - b.boardOrder;
      });
    }
    return map;
  }, [filteredTasks]);

  const selectedTask = tasks?.find((t) => t.id === selectedTaskId) ?? null;

  function resolveTargetStatus(overId: string): TaskStatus | null {
    if (STATUS_SET.has(overId as TaskStatus)) return overId as TaskStatus;
    const task = tasks?.find((t) => t.id === overId);
    return task?.status ?? null;
  }

  function computeBoardOrder(targetStatus: TaskStatus, overId: string, activeId: string): number {
    const columnTasks = (grouped[targetStatus] ?? []).filter((t) => t.id !== activeId);
    const overIndex = STATUS_SET.has(overId as TaskStatus)
      ? columnTasks.length
      : Math.max(columnTasks.findIndex((t) => t.id === overId), 0);

    const prev = columnTasks[overIndex - 1];
    const next = columnTasks[overIndex];
    const prevOrder = prev?.boardOrder ?? (next ? next.boardOrder - 2 : 0);
    const nextOrder = next?.boardOrder ?? prevOrder + 2;
    return (prevOrder + nextOrder) / 2;
  }

  function requestStatusChange(taskId: string, status: TaskStatus, boardOrder?: number) {
    if (status === "Aborted") {
      setPendingAbort({ id: taskId, boardOrder: boardOrder ?? 0 });
      return;
    }
    updateStatus.mutate({ id: taskId, status, boardOrder });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    const activeTask = tasks?.find((t) => t.id === activeId);
    if (!activeTask) return;

    const targetStatus = resolveTargetStatus(overId);
    if (!targetStatus) return;
    if (targetStatus === activeTask.status && activeId === overId) return;

    const boardOrder = computeBoardOrder(targetStatus, overId, activeId);
    requestStatusChange(activeId, targetStatus, boardOrder);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="flex size-8 items-center justify-center rounded-lg text-white"
            style={{ backgroundColor: CATEGORY_CHART_COLORS[category] }}
          >
            {category === "Personal" ? <ListTodo className="size-4" /> : <Briefcase className="size-4" />}
          </span>
          <h1 className="text-2xl font-semibold">{category} Board</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border p-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Grid view"
              className={cn(view === "grid" && "bg-muted")}
              onClick={() => setView("grid")}
            >
              <LayoutGrid className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="List view"
              className={cn(view === "list" && "bg-muted")}
              onClick={() => setView("list")}
            >
              <ListIcon className="size-4" />
            </Button>
          </div>
          <NewTaskDialog category={category} />
        </div>
      </div>

      <BoardFilters
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
        originFilter={originFilter}
        onOriginFilterChange={setOriginFilter}
        overdueOnly={overdueOnly}
        onOverdueOnlyChange={setOverdueOnly}
        search={search}
        onSearchChange={setSearch}
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading tasks...</p>
      ) : view === "grid" ? (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          <div className="flex flex-1 gap-4 overflow-x-auto pb-4">
            {BOARD_LANES.map(({ id, label, badgeClassName }) => (
              <Column
                key={id}
                laneId={id}
                label={label}
                badgeClassName={badgeClassName}
                tasks={grouped[id] ?? []}
                onSelectTask={setSelectedTaskId}
              />
            ))}
          </div>
        </DndContext>
      ) : (
        <ListView
          grouped={grouped}
          onSelectTask={setSelectedTaskId}
          onChangeStatus={(taskId, status) => requestStatusChange(taskId, status)}
        />
      )}

      <TaskDetailSheet task={selectedTask} category={category} onClose={() => setSelectedTaskId(null)} />

      <AbortReasonDialog
        open={Boolean(pendingAbort)}
        onCancel={() => setPendingAbort(null)}
        onConfirm={(reason) => {
          if (!pendingAbort) return;
          updateStatus.mutate({
            id: pendingAbort.id,
            status: "Aborted",
            boardOrder: pendingAbort.boardOrder,
            abortReason: reason,
          });
          setPendingAbort(null);
        }}
      />
    </div>
  );
}
