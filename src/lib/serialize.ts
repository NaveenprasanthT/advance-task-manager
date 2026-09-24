import type { ITask } from "@/models/Task";
import type { TaskDTO } from "@/types/task";
import type { IMemory } from "@/models/Memory";
import type { MemoryDTO } from "@/types/memory";
import type { IRecurringTask } from "@/models/RecurringTask";
import type { RecurringTaskDTO } from "@/types/recurring-task";
import type { INote } from "@/models/Note";
import type { NoteDTO } from "@/types/note";

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
    priority: task.priority ?? "Medium",
    recurringTaskId: task.recurringTaskId ? task.recurringTaskId.toString() : null,
    occurrenceDate: task.occurrenceDate ? new Date(task.occurrenceDate).toISOString() : null,
    createdAt: new Date(task.createdAt ?? Date.now()).toISOString(),
    updatedAt: new Date(task.updatedAt ?? Date.now()).toISOString(),
  };
}

export function serializeMemory(memory: IMemory): MemoryDTO {
  return {
    id: memory._id.toString(),
    name: memory.name,
    description: memory.description ?? null,
    rememberDate: memory.rememberDate ? new Date(memory.rememberDate).toISOString() : null,
    category: memory.category ?? null,
    priority: memory.priority ?? "Medium",
    files: (memory.files ?? []).map((file) => ({
      id: (file._id ?? "").toString(),
      url: file.url,
      resourceType: file.resourceType,
      fileName: file.fileName,
      fileType: file.fileType ?? null,
      fileSize: file.fileSize ?? null,
      createdAt: new Date(file.createdAt ?? Date.now()).toISOString(),
    })),
    createdAt: new Date(memory.createdAt ?? Date.now()).toISOString(),
    updatedAt: new Date(memory.updatedAt ?? Date.now()).toISOString(),
  };
}

export function serializeRecurringTask(template: IRecurringTask): RecurringTaskDTO {
  return {
    id: template._id.toString(),
    category: template.category,
    title: template.title,
    description: template.description ?? null,
    priority: template.priority ?? "Medium",
    estimateValue: template.estimateValue ?? null,
    estimateUnit: template.estimateUnit ?? "hours",
    frequency: template.frequency,
    daysOfWeek: template.daysOfWeek ?? null,
    daysOfMonth: template.daysOfMonth ?? null,
    active: template.active ?? true,
    startDate: new Date(template.startDate).toISOString(),
    endDate: template.endDate ? new Date(template.endDate).toISOString() : null,
    createdAt: new Date(template.createdAt ?? Date.now()).toISOString(),
  };
}

export function serializeNote(note: INote): NoteDTO {
  return {
    id: note._id.toString(),
    title: note.title,
    date: note.date ? new Date(note.date).toISOString() : null,
    description: note.description ?? null,
    createdAt: new Date(note.createdAt ?? Date.now()).toISOString(),
    updatedAt: new Date(note.updatedAt ?? Date.now()).toISOString(),
  };
}
