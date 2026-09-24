import type { TaskDTO } from "@/types/task";

/**
 * A task is "overdue" once today's calendar date is strictly after its due
 * date's calendar date - not merely after the due date's stored timestamp
 * (which is UTC midnight of that day), so a task due "today" stays on-time
 * for the entire day and only flips to Overdue the day after. Computed at
 * render time - never persisted as its own status - so it updates
 * automatically as time passes and clears the instant the task is
 * completed, aborted, or its due date is pushed out.
 */
export function isTaskOverdue(task: Pick<TaskDTO, "status" | "dueDate">): boolean {
  if (!task.dueDate) return false;
  if (task.status === "Done" || task.status === "Aborted") return false;

  const due = new Date(task.dueDate);
  const dueDateOnly = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const todayOnly = new Date();
  todayOnly.setHours(0, 0, 0, 0);
  return dueDateOnly < todayOnly;
}

export const OVERDUE_LANE_ID = "Overdue" as const;

export const OVERDUE_BADGE_CLASS = "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200";
