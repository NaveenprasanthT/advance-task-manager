import type { EstimateUnit, SubtaskStatus, TaskCategory, TaskOrigin, TaskStatus } from "@/models/Task";

export interface SubtaskDTO {
  id: string;
  title: string;
  status: SubtaskStatus;
  order: number;
  completedAt: string | null;
  createdAt: string;
}

export interface StatusHistoryEntryDTO {
  status: TaskStatus;
  enteredAt: string;
}

export interface TaskDTO {
  id: string;
  category: TaskCategory;
  title: string;
  description: string | null;
  status: TaskStatus;
  estimateValue: number | null;
  estimateUnit: EstimateUnit;
  dueDate: string | null;
  plannedStart: string | null;
  plannedEnd: string | null;
  actualCompletedAt: string | null;
  abortReason: string | null;
  statusHistory: StatusHistoryEntryDTO[];
  subtasks: SubtaskDTO[];
  boardOrder: number;
  resourceUrl: string | null;
  origin: TaskOrigin;
  createdAt: string;
  updatedAt: string;
}
