import { RecurringTaskLogModel } from "@/models/RecurringTaskLog";
import type { IRecurringTask } from "@/models/RecurringTask";
import { isDueOn, toDateOnly, addDays } from "@/lib/recurrence";
import type { HydratedDocument } from "mongoose";

const MAX_SWEEP_DAYS = 14;

function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code?: number }).code === 11000;
}

/**
 * Walks forward from this template's sweep cursor (or its start date, for a
 * brand-new template) through YESTERDAY - today is never swept, since the
 * day isn't over yet - inserting a "missed" log row for every due day with
 * no existing row. Capped at 14 days back so a missed cron run self-heals
 * instead of losing history, without walking back indefinitely. A day the
 * user already resolved (Done or Missed) before the sweep runs hits the
 * unique index and is silently skipped, not overwritten.
 */
export async function sweepMissedOccurrences(
  template: HydratedDocument<IRecurringTask>,
  today: Date,
): Promise<number> {
  const todayOnly = toDateOnly(today);
  const lastSweepable = addDays(todayOnly, -1);
  const cursorStart = template.lastGeneratedDate
    ? addDays(toDateOnly(new Date(template.lastGeneratedDate)), 1)
    : toDateOnly(new Date(template.startDate));
  const earliestAllowed = addDays(todayOnly, -MAX_SWEEP_DAYS);
  let cursor = cursorStart < earliestAllowed ? earliestAllowed : cursorStart;

  let missedCount = 0;
  while (cursor <= lastSweepable) {
    if (isDueOn(template, cursor)) {
      try {
        await RecurringTaskLogModel.create({
          recurringTaskId: template._id,
          owner: template.owner,
          date: cursor,
          status: "missed",
          resolvedAt: new Date(),
        });
        missedCount++;
      } catch (err) {
        if (!isDuplicateKeyError(err)) throw err;
      }
    }
    cursor = addDays(cursor, 1);
  }

  if (lastSweepable >= cursorStart) {
    template.lastGeneratedDate = lastSweepable;
    await template.save();
  }
  return missedCount;
}
