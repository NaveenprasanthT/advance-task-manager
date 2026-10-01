import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectMongoose } from "@/lib/mongoose";
import { RecurringTaskModel, type IRecurringTask } from "@/models/RecurringTask";
import { RecurringTaskLogModel } from "@/models/RecurringTaskLog";
import { requireUser } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";
import { isDueOn, toDateOnly, addDays, formatDateOnly } from "@/lib/recurrence";

const WINDOW_DAYS = 30;

export async function GET() {
  try {
    const user = await requireUser();
    await connectMongoose();
    const ownerId = new Types.ObjectId(user.id);

    const templates = await RecurringTaskModel.find({ owner: ownerId }).lean();
    if (templates.length === 0) {
      return NextResponse.json({
        overall: { totalDue: 0, totalDone: 0, adherenceRate: null },
        templates: [],
        dailyTrend: [],
      });
    }

    const today = toDateOnly(new Date());
    const windowStart = addDays(today, -WINDOW_DAYS);
    const templateIds = templates.map((t) => t._id);

    // Accumulates due/done counts across ALL templates for each calendar
    // day, independent of the per-template stats below - this is what
    // drives the analytics-page daily adherence trend chart.
    const dayTotals = new Map<number, { totalDue: number; totalDone: number }>();
    for (let cursor = windowStart; cursor <= today; cursor = addDays(cursor, 1)) {
      dayTotals.set(cursor.getTime(), { totalDue: 0, totalDone: 0 });
    }

    const logs = await RecurringTaskLogModel.find({
      recurringTaskId: { $in: templateIds },
      date: { $gte: windowStart, $lte: today },
    })
      .select("recurringTaskId date status")
      .lean();

    const byTemplate = new Map<string, typeof logs>();
    for (const log of logs) {
      const key = log.recurringTaskId.toString();
      if (!byTemplate.has(key)) byTemplate.set(key, []);
      byTemplate.get(key)!.push(log);
    }

    const templateStats = templates.map((t) => {
      const logByDate = new Map(
        (byTemplate.get(t._id.toString()) ?? []).map((l) => [toDateOnly(new Date(l.date)).getTime(), l.status]),
      );

      // Due-ness is derived from isDueOn(), not from which rows happen to
      // exist - an unresolved due day has no row at all under this model.
      let totalDue = 0;
      let totalDone = 0;
      let runningStreak = 0;
      let bestStreak = 0;
      let cursor = windowStart;
      while (cursor <= today) {
        if (isDueOn(t as IRecurringTask, cursor)) {
          totalDue++;
          const dayTotal = dayTotals.get(cursor.getTime())!;
          dayTotal.totalDue++;
          const status = logByDate.get(cursor.getTime());
          if (status === "done") {
            totalDone++;
            dayTotal.totalDone++;
            runningStreak++;
            bestStreak = Math.max(bestStreak, runningStreak);
          } else if (status === "missed") {
            runningStreak = 0;
          } else if (cursor.getTime() !== today.getTime()) {
            // Past due day with no row - shouldn't happen once the cron
            // sweep has run, but don't let it silently keep a streak alive.
            runningStreak = 0;
          }
          // else: today, due, unresolved - leave the running streak as-is,
          // the day isn't over yet.
        }
        cursor = addDays(cursor, 1);
      }

      const adherenceRate = totalDue > 0 ? Math.round((totalDone / totalDue) * 100) : null;

      return {
        id: t._id.toString(),
        title: t.title,
        category: t.category,
        frequency: t.frequency,
        active: t.active,
        totalDue,
        totalDone,
        adherenceRate,
        currentStreak: runningStreak,
        bestStreak,
      };
    });

    const overallDue = templateStats.reduce((a, t) => a + t.totalDue, 0);
    const overallDone = templateStats.reduce((a, t) => a + t.totalDone, 0);

    const dailyTrend = Array.from(dayTotals.entries())
      .sort(([a], [b]) => a - b)
      .map(([ms, totals]) => ({ date: formatDateOnly(new Date(ms)), ...totals }));

    return NextResponse.json({
      overall: {
        totalDue: overallDue,
        totalDone: overallDone,
        adherenceRate: overallDue > 0 ? Math.round((overallDone / overallDue) * 100) : null,
      },
      templates: templateStats,
      dailyTrend,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
