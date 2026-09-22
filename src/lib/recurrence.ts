import type { IRecurringTask } from "@/models/RecurringTask";

/** Midnight UTC for the given date - used throughout so day comparisons never depend on server timezone. */
export function toDateOnly(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

type RecurrenceRule = Pick<
  IRecurringTask,
  "frequency" | "daysOfWeek" | "daysOfMonth" | "startDate" | "endDate"
>;

/**
 * Single source of truth for "is this template due on this calendar day" -
 * used identically by the generation cron and the create-route's
 * generate-today-immediately step, so they can never disagree.
 */
export function isDueOn(template: RecurrenceRule, date: Date): boolean {
  const day = toDateOnly(date);
  const start = toDateOnly(new Date(template.startDate));
  if (day < start) return false;
  if (template.endDate && day > toDateOnly(new Date(template.endDate))) return false;

  switch (template.frequency) {
    case "daily":
      return true;
    case "weekly":
      return (template.daysOfWeek ?? []).includes(day.getUTCDay());
    case "monthly":
      return (template.daysOfMonth ?? []).includes(day.getUTCDate());
    default:
      return false;
  }
}
