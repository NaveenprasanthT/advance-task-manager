import type { TaskDTO } from "@/types/task";
import type { TaskCategory, TaskPriority } from "@/models/Task";
import type { StudyPlanEntryStatus } from "@/models/StudyPlanEntry";

export interface TodayRecurringItem {
  id: string;
  title: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: "done" | "missed" | "pending";
}

export interface TodayStudyPlanTopic {
  title: string;
  description: string | null;
}

export interface TodayStudyPlanItem {
  planId: string;
  planTitle: string;
  entryId: string;
  index: number;
  label: string | null;
  topics: TodayStudyPlanTopic[];
  status: StudyPlanEntryStatus;
}

export interface TodayView {
  date: string; // "YYYY-MM-DD"
  tasks: { dueToday: TaskDTO[]; overdue: TaskDTO[] };
  recurring: TodayRecurringItem[];
  studyPlans: TodayStudyPlanItem[];
}
