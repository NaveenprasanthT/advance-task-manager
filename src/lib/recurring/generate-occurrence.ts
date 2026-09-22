import { TaskModel } from "@/models/Task";
import type { IRecurringTask } from "@/models/RecurringTask";
import { isDueOn, toDateOnly, addDays } from "@/lib/recurrence";
import type { HydratedDocument } from "mongoose";

const MAX_BACKFILL_DAYS = 14;

async function generateOccurrenceIfDue(template: HydratedDocument<IRecurringTask>, date: Date): Promise<boolean> {
  if (!isDueOn(template, date)) return false;

  const day = toDateOnly(date);
  const existing = await TaskModel.exists({
    recurringTaskId: template._id,
    occurrenceDate: { $gte: day, $lt: addDays(day, 1) },
  });
  if (existing) return false;

  const highestOrder = await TaskModel.findOne({ owner: template.owner, category: template.category, status: "Todo" })
    .sort({ boardOrder: -1 })
    .select("boardOrder")
    .lean();

  await TaskModel.create({
    owner: template.owner,
    category: template.category,
    title: template.title,
    description: template.description,
    priority: template.priority,
    estimateValue: template.estimateValue,
    estimateUnit: template.estimateUnit,
    origin: "recurring",
    recurringTaskId: template._id,
    occurrenceDate: day,
    status: "Todo",
    statusHistory: [{ status: "Todo", enteredAt: new Date() }],
    boardOrder: highestOrder ? (highestOrder.boardOrder ?? 0) + 1 : 0,
  });
  return true;
}

/**
 * Walks forward from this template's generation cursor (or its start date,
 * for a brand-new template) through today, creating any missing due
 * occurrences along the way - capped at 14 days back so a missed cron run
 * self-heals instead of losing history, without walking back indefinitely.
 * Used identically by the daily cron and by "generate today's occurrence
 * immediately on create" (a fresh template's cursor is unset, so this walks
 * from its start date through today - typically just today).
 */
export async function backfillOccurrences(
  template: HydratedDocument<IRecurringTask>,
  today: Date,
): Promise<number> {
  const todayOnly = toDateOnly(today);
  const cursorStart = template.lastGeneratedDate
    ? addDays(toDateOnly(new Date(template.lastGeneratedDate)), 1)
    : toDateOnly(new Date(template.startDate));
  const earliestAllowed = addDays(todayOnly, -MAX_BACKFILL_DAYS);
  let cursor = cursorStart < earliestAllowed ? earliestAllowed : cursorStart;

  let created = 0;
  while (cursor <= todayOnly) {
    if (await generateOccurrenceIfDue(template, cursor)) created++;
    cursor = addDays(cursor, 1);
  }

  template.lastGeneratedDate = todayOnly;
  await template.save();
  return created;
}
