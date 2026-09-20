import type { TaskStatus } from "@/models/Task";
import { OVERDUE_BADGE_CLASS, OVERDUE_LANE_ID } from "@/lib/task-utils";

export const STATUS_COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "Suggested", label: "Suggested" },
  { status: "Todo", label: "To Do" },
  { status: "InProgress", label: "In Progress" },
  { status: "OnHold", label: "On Hold" },
  { status: "Done", label: "Done" },
  { status: "Aborted", label: "Aborted" },
];

export const STATUS_COLORS: Record<TaskStatus, string> = {
  Suggested: "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-200",
  Todo: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  InProgress: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200",
  OnHold: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200",
  Done: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200",
  Aborted: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200",
};

/**
 * Board lanes, in display order. "Overdue" is a virtual lane - never a stored
 * status - that a task falls into automatically (computed via isTaskOverdue)
 * instead of its real Todo/InProgress/OnHold lane once its due date passes.
 */
export const BOARD_LANES: { id: string; label: string; badgeClassName: string }[] = [
  { id: "Suggested", label: "Suggested", badgeClassName: STATUS_COLORS.Suggested },
  { id: "Todo", label: "To Do", badgeClassName: STATUS_COLORS.Todo },
  { id: "InProgress", label: "In Progress", badgeClassName: STATUS_COLORS.InProgress },
  { id: "OnHold", label: "On Hold", badgeClassName: STATUS_COLORS.OnHold },
  { id: OVERDUE_LANE_ID, label: "Overdue", badgeClassName: OVERDUE_BADGE_CLASS },
  { id: "Done", label: "Done", badgeClassName: STATUS_COLORS.Done },
  { id: "Aborted", label: "Aborted", badgeClassName: STATUS_COLORS.Aborted },
];
