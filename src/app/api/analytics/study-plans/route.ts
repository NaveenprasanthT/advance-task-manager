import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectMongoose } from "@/lib/mongoose";
import { StudyPlanModel } from "@/models/StudyPlan";
import { StudyPlanEntryModel, STUDY_PLAN_ENTRY_STATUSES, type StudyPlanEntryStatus } from "@/models/StudyPlanEntry";
import { requireUser } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";
import { computeStreakStats } from "@/lib/study-plan/compute-progress";
import { toDateOnly, addDays, formatDateOnly } from "@/lib/recurrence";

const WINDOW_DAYS = 30;

export async function GET() {
  try {
    const user = await requireUser();
    await connectMongoose();
    const ownerId = new Types.ObjectId(user.id);

    const plans = await StudyPlanModel.find({ owner: ownerId }).lean();
    if (plans.length === 0) {
      return NextResponse.json({
        overall: {
          totalPlans: 0,
          activePlans: 0,
          totalEntries: 0,
          completedEntries: 0,
          percentComplete: null,
          topicsCompleted: 0,
          bestStreak: 0,
        },
        statusBreakdown: { Pending: 0, Completed: 0, Paused: 0, Skipped: 0 },
        dailyTrend: [],
      });
    }

    const planIds = plans.map((p) => p._id);
    const entries = await StudyPlanEntryModel.find({ studyPlanId: { $in: planIds } })
      .select("studyPlanId index date status topics resolvedAt")
      .sort({ index: 1 })
      .lean();

    const byPlan = new Map<string, typeof entries>();
    for (const entry of entries) {
      const key = entry.studyPlanId.toString();
      if (!byPlan.has(key)) byPlan.set(key, []);
      byPlan.get(key)!.push(entry);
    }

    const today = toDateOnly(new Date());
    let bestStreak = 0;
    for (const plan of plans) {
      const planEntries = byPlan.get(plan._id.toString()) ?? [];
      bestStreak = Math.max(bestStreak, computeStreakStats(planEntries, today).bestStreak);
    }

    const totalEntries = entries.length;
    const completedEntries = entries.filter((e) => e.status === "Completed").length;
    const topicsCompleted = entries
      .filter((e) => e.status === "Completed")
      .reduce((sum, e) => sum + (e.topics?.length ?? 0), 0);

    const statusBreakdown = STUDY_PLAN_ENTRY_STATUSES.reduce(
      (acc, status) => {
        acc[status] = entries.filter((e) => e.status === status).length;
        return acc;
      },
      {} as Record<StudyPlanEntryStatus, number>,
    );

    // Activity trend: keyed by resolvedAt (when the user actually completed
    // it), not the scheduled date - this is a "did I study today" trend,
    // not a schedule-adherence chart.
    const windowStart = addDays(today, -WINDOW_DAYS);
    const dayTotals = new Map<number, number>();
    for (let cursor = windowStart; cursor <= today; cursor = addDays(cursor, 1)) {
      dayTotals.set(cursor.getTime(), 0);
    }
    for (const entry of entries) {
      if (entry.status !== "Completed" || !entry.resolvedAt) continue;
      const day = toDateOnly(new Date(entry.resolvedAt)).getTime();
      if (dayTotals.has(day)) dayTotals.set(day, dayTotals.get(day)! + 1);
    }
    const dailyTrend = Array.from(dayTotals.entries())
      .sort(([a], [b]) => a - b)
      .map(([ms, completedCount]) => ({ date: formatDateOnly(new Date(ms)), completedCount }));

    return NextResponse.json({
      overall: {
        totalPlans: plans.length,
        activePlans: plans.filter((p) => p.status === "active").length,
        totalEntries,
        completedEntries,
        percentComplete: totalEntries > 0 ? Math.round((completedEntries / totalEntries) * 100) : null,
        topicsCompleted,
        bestStreak,
      },
      statusBreakdown,
      dailyTrend,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
