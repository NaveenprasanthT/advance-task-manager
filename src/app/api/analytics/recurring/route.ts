import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectMongoose } from "@/lib/mongoose";
import { TaskModel } from "@/models/Task";
import { RecurringTaskModel } from "@/models/RecurringTask";
import { requireUser } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";
import { toDateOnly, addDays } from "@/lib/recurrence";

const WINDOW_DAYS = 30;

export async function GET() {
  try {
    const user = await requireUser();
    await connectMongoose();
    const ownerId = new Types.ObjectId(user.id);

    const templates = await RecurringTaskModel.find({ owner: ownerId }).lean();
    if (templates.length === 0) {
      return NextResponse.json({ overall: { totalDue: 0, totalDone: 0, adherenceRate: null }, templates: [] });
    }

    const today = toDateOnly(new Date());
    const windowStart = addDays(today, -WINDOW_DAYS);
    const templateIds = templates.map((t) => t._id);

    const occurrences = await TaskModel.find({
      owner: ownerId,
      recurringTaskId: { $in: templateIds },
      occurrenceDate: { $gte: windowStart },
    })
      .select("recurringTaskId occurrenceDate status")
      .sort({ occurrenceDate: -1 })
      .lean();

    const byTemplate = new Map<string, typeof occurrences>();
    for (const occ of occurrences) {
      const key = occ.recurringTaskId!.toString();
      if (!byTemplate.has(key)) byTemplate.set(key, []);
      byTemplate.get(key)!.push(occ);
    }

    const templateStats = templates.map((t) => {
      const occs = byTemplate.get(t._id.toString()) ?? [];
      const totalDue = occs.length;
      const totalDone = occs.filter((o) => o.status === "Done").length;
      const adherenceRate = totalDue > 0 ? Math.round((totalDone / totalDue) * 100) : null;

      // Occurrences only ever exist for due days, so walking them in
      // descending date order is already walking consecutive due-days -
      // today's still-pending occurrence doesn't break the streak, since
      // the day isn't over yet.
      let currentStreak = 0;
      for (const occ of occs) {
        const occDate = toDateOnly(new Date(occ.occurrenceDate!));
        if (occ.status === "Done") {
          currentStreak++;
          continue;
        }
        if (occDate.getTime() === today.getTime()) continue;
        break;
      }

      return {
        id: t._id.toString(),
        title: t.title,
        category: t.category,
        frequency: t.frequency,
        active: t.active,
        totalDue,
        totalDone,
        adherenceRate,
        currentStreak,
      };
    });

    const overallDue = templateStats.reduce((a, t) => a + t.totalDue, 0);
    const overallDone = templateStats.reduce((a, t) => a + t.totalDone, 0);

    return NextResponse.json({
      overall: {
        totalDue: overallDue,
        totalDone: overallDone,
        adherenceRate: overallDue > 0 ? Math.round((overallDone / overallDue) * 100) : null,
      },
      templates: templateStats,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
