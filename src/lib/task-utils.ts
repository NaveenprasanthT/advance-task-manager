import type { TaskDTO } from "@/types/task";

/**
 * A task is "overdue" when it has a due date in the past and hasn't reached a
 * terminal state (Done/Aborted). This is computed at render time - it is never
 * persisted as its own status - so it updates automatically as time passes and
 * clears the instant the task is completed, aborted, or its due date is pushed out.
 */
export function isTaskOverdue(task: Pick<TaskDTO, "status" | "dueDate">): boolean {
  if (!task.dueDate) return false;
  if (task.status === "Done" || task.status === "Aborted") return false;
  return new Date(task.dueDate) < new Date();
}

export const OVERDUE_LANE_ID = "Overdue" as const;

export const OVERDUE_BADGE_CLASS = "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200";
