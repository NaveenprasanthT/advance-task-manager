import type { TaskStatus, TaskCategory } from "@/models/Task";

// Status colors are reserved semantic meaning (neutral/blue/amber/emerald/red),
// reused consistently between badges and charts - never repurposed for other series.
export const STATUS_CHART_COLORS: Record<TaskStatus, string> = {
  Suggested: "#8b5cf6",
  Todo: "#64748b",
  InProgress: "#3b82f6",
  OnHold: "#d97706",
  Done: "#10b981",
  Aborted: "#ef4444",
};

// Fixed categorical order for the two task categories - never cycled.
export const CATEGORY_CHART_COLORS: Record<TaskCategory, string> = {
  Personal: "#6366f1",
  Professional: "#0ea5a4",
};

// Single-hue sequential color for magnitude/trend series (one series per chart).
export const SEQUENTIAL_CHART_COLOR = "#3b82f6";

// Fixed two-series categorical order for the created-vs-completed engagement chart.
export const ENGAGEMENT_CHART_COLORS = {
  created: "#6366f1",
  completed: "#10b981",
};

// Distinct from Aborted's red - Overdue is a virtual (non-persisted) bucket, never a stored status.
export const OVERDUE_COLOR = "#ea580c";
