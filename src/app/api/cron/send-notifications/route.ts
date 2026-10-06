import { NextRequest, NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import { TaskModel } from "@/models/Task";
import { RecurringTaskModel } from "@/models/RecurringTask";
import { RecurringTaskLogModel } from "@/models/RecurringTaskLog";
import { StudyPlanModel } from "@/models/StudyPlan";
import { StudyPlanEntryModel } from "@/models/StudyPlanEntry";
import { PushSubscriptionModel } from "@/models/PushSubscription";
import { isDueOn, toDateOnly } from "@/lib/recurrence";
import { getWebPushClient } from "@/lib/web-push";

export const maxDuration = 60;

// Builds the one-line summary for a single user. Every count is a fresh
// query each run (no "already notified" bookkeeping) - per product
// decision, the alert is meant to repeat daily for as long as something
// stays overdue/unresolved, so there's nothing to deduplicate.
async function buildSummaryForUser(ownerId: string, today: Date) {
  const overdueHighPriorityTasks = await TaskModel.countDocuments({
    owner: ownerId,
    priority: "High",
    status: { $nin: ["Done", "Aborted"] },
    dueDate: { $lt: today },
  });

  const templates = await RecurringTaskModel.find({ owner: ownerId, active: true }).lean();
  const dueToday = templates.filter((t) => isDueOn(t, today));
  const todayLogs = await RecurringTaskLogModel.find({
    recurringTaskId: { $in: dueToday.map((t) => t._id) },
    date: today,
  })
    .select("recurringTaskId status")
    .lean();
  const resolvedTemplateIds = new Set(todayLogs.filter((l) => l.status === "done").map((l) => l.recurringTaskId.toString()));
  const pendingRoutinesToday = dueToday.filter((t) => !resolvedTemplateIds.has(t._id.toString())).length;

  const plans = await StudyPlanModel.find({ owner: ownerId, status: "active" }).select("_id").lean();
  const overdueStudyEntries = await StudyPlanEntryModel.countDocuments({
    studyPlanId: { $in: plans.map((p) => p._id) },
    status: "Pending",
    date: { $lt: today },
  });

  const parts: string[] = [];
  if (overdueHighPriorityTasks > 0) {
    parts.push(`${overdueHighPriorityTasks} overdue high-priority task${overdueHighPriorityTasks === 1 ? "" : "s"}`);
  }
  if (pendingRoutinesToday > 0) {
    parts.push(`${pendingRoutinesToday} routine${pendingRoutinesToday === 1 ? "" : "s"} not done today`);
  }
  if (overdueStudyEntries > 0) {
    parts.push(`${overdueStudyEntries} overdue study day${overdueStudyEntries === 1 ? "" : "s"}`);
  }

  if (parts.length === 0) return null;
  return parts.join(", ");
}

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectMongoose();
  const webpush = getWebPushClient();
  const today = toDateOnly(new Date());

  const ownerIds = await PushSubscriptionModel.distinct("owner");

  let usersNotified = 0;
  let subscriptionsRemoved = 0;

  for (const ownerId of ownerIds) {
    try {
      const summary = await buildSummaryForUser(ownerId.toString(), today);
      if (!summary) continue;

      const subscriptions = await PushSubscriptionModel.find({ owner: ownerId });
      const payload = JSON.stringify({
        title: "TaskFlow: pending items",
        body: summary,
        url: "/today",
      });

      for (const sub of subscriptions) {
        if (!sub.keys?.p256dh || !sub.keys?.auth) continue;
        try {
          await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } }, payload);
        } catch (err) {
          const statusCode = (err as { statusCode?: number }).statusCode;
          if (statusCode === 404 || statusCode === 410) {
            await sub.deleteOne();
            subscriptionsRemoved++;
          } else {
            console.error(`Failed to send push to subscription ${sub._id.toString()}`, err);
          }
        }
      }
      usersNotified++;
    } catch (err) {
      console.error(`Failed to build/send notification summary for user ${ownerId.toString()}`, err);
    }
  }

  return NextResponse.json({ success: true, usersNotified, subscriptionsRemoved });
}
