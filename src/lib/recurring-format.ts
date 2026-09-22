import type { RecurringTaskDTO } from "@/types/recurring-task";

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const WEEKDAY_OPTIONS = WEEKDAY_LABELS.map((label, value) => ({ value: String(value), label }));

export const MONTH_DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => String(i + 1));

export function ordinal(n: number): string {
  if (n % 10 === 1 && n !== 11) return `${n}st`;
  if (n % 10 === 2 && n !== 12) return `${n}nd`;
  if (n % 10 === 3 && n !== 13) return `${n}rd`;
  return `${n}th`;
}

export function frequencySummary(
  template: Pick<RecurringTaskDTO, "frequency" | "daysOfWeek" | "daysOfMonth">,
): string {
  if (template.frequency === "daily") return "Daily";
  if (template.frequency === "weekly") {
    return `Weekly - ${(template.daysOfWeek ?? []).map((d) => WEEKDAY_LABELS[d]).join(", ")}`;
  }
  return `Monthly - ${(template.daysOfMonth ?? []).map(ordinal).join(", ")}`;
}
