import type { TaskCategory, TaskPriority, EstimateUnit } from "@/models/Task";
import type { RecurrenceFrequency } from "@/models/RecurringTask";

export interface RecurringTaskDTO {
  id: string;
  category: TaskCategory;
  title: string;
  description: string | null;
  priority: TaskPriority;
  estimateValue: number | null;
  estimateUnit: EstimateUnit;
  frequency: RecurrenceFrequency;
  daysOfWeek: number[] | null;
  daysOfMonth: number[] | null;
  active: boolean;
  startDate: string;
  endDate: string | null;
  createdAt: string;
}
