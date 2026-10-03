import type { StudyPlanFrequency } from "@/models/StudyPlan";
import { toDateOnly, addDays } from "@/lib/recurrence";

/** The calendar date for ordinal `index` (0-based) of a plan starting on `startDate`. */
export function computeEntryDate(startDate: Date, frequency: StudyPlanFrequency, index: number): Date {
  const start = toDateOnly(startDate);
  if (frequency === "daily") return addDays(start, index);
  if (frequency === "weekly") return addDays(start, index * 7);

  const monthly = new Date(start);
  monthly.setUTCMonth(monthly.getUTCMonth() + index);
  return monthly;
}
