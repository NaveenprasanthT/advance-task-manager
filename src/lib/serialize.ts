import type { ITask } from "@/models/Task";
import type { TaskDTO } from "@/types/task";

export function serializeTask(task: ITask): TaskDTO {
  return {
    id: task._id.toString(),
    category: task.category,
    title: task.title,
    description: task.description ?? null,
    status: task.status,
    estimateValue: task.estimateValue ?? null,
    estimateUnit: task.estimateUnit,
    dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : null,
    plannedStart: task.plannedStart ? new Date(task.plannedStart).toISOString() : null,
    plannedEnd: task.plannedEnd ? new Date(task.plannedEnd).toISOString() : null,
    actualCompletedAt: task.actualCompletedAt ? new Date(task.actualCompletedAt).toISOString() : null,
    abortReason: task.abortReason ?? null,
    statusHistory: (task.statusHistory ?? []).map((entry) => ({
      status: entry.status,
      enteredAt: new Date(entry.enteredAt).toISOString(),
    })),
    subtasks: (task.subtasks ?? []).map((subtask) => ({
      id: subtask._id.toString(),
      title: subtask.title,
      status: subtask.status,
      order: subtask.order ?? 0,
      completedAt: subtask.completedAt ? new Date(subtask.completedAt).toISOString() : null,
      createdAt: new Date(subtask.createdAt ?? Date.now()).toISOString(),
    })),
    boardOrder: task.boardOrder ?? 0,
    resourceUrl: task.resourceUrl ?? null,
    origin: task.origin ?? "manual",
    createdAt: new Date(task.createdAt ?? Date.now()).toISOString(),
    updatedAt: new Date(task.updatedAt ?? Date.now()).toISOString(),
  };
}
