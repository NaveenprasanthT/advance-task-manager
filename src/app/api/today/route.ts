import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectMongoose } from "@/lib/mongoose";
import { TaskModel } from "@/models/Task";
import { RecurringTaskModel } from "@/models/RecurringTask";
import { RecurringTaskLogModel } from "@/models/RecurringTaskLog";
import { StudyPlanModel } from "@/models/StudyPlan";
import { StudyPlanEntryModel } from "@/models/StudyPlanEntry";
import { requireUser } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";
import { serializeTask } from "@/lib/serialize";
import { isDueOn, toDateOnly, addDays, formatDateOnly } from "@/lib/recurrence";

// Aggregates the three independent "due today" concepts in this app (plain
// tasks, recurring routines, study plan entries) into one payload so a
// single page can show "what do I need to do today" without three round
// trips and three different definitions of "today" drifting apart.
export async function GET() {
  try {
    const user = await requireUser();
    await connectMongoose();
    const ownerId = new Types.ObjectId(user.id);

    const today = toDateOnly(new Date());
    const tomorrow = addDays(today, 1);

    // --- Tasks: due today or overdue, not yet resolved. Recurring-origin
    // Task docs are historical-only (see src/app/api/tasks/route.ts) and
    // excluded here too - recurring is handled via its own section below.
    const dueTasks = await TaskModel.find({
      owner: ownerId,
      origin: { $ne: "recurring" },
      status: { $nin: ["Done", "Aborted"] },
      dueDate: { $ne: null, $lt: tomorrow },
    })
      .sort({ dueDate: 1 })
      .lean();

    const dueToday: ReturnType<typeof serializeTask>[] = [];
    const overdue: ReturnType<typeof serializeTask>[] = [];
    for (const task of dueTasks) {
      const dto = serializeTask(task as never);
      if (toDateOnly(new Date(task.dueDate!)).getTime() < today.getTime()) overdue.push(dto);
      else dueToday.push(dto);
    }

    // --- Recurring routines due today.
    const templates = await RecurringTaskModel.find({ owner: ownerId, active: true }).lean();
    const dueTemplates = templates.filter((t) => isDueOn(t, today));
    const templateIds = dueTemplates.map((t) => t._id);
    const todayLogs = await RecurringTaskLogModel.find({
      recurringTaskId: { $in: templateIds },
      date: today,
    })
      .select("recurringTaskId status")
      .lean();
    const logByTemplate = new Map(todayLogs.map((l) => [l.recurringTaskId.toString(), l.status]));

    const recurring = dueTemplates.map((t) => ({
      id: t._id.toString(),
      title: t.title,
      category: t.category,
      priority: t.priority ?? "Medium",
      status: logByTemplate.get(t._id.toString()) ?? "pending",
    }));

    // --- Study plan entries due today.
    const plans = await StudyPlanModel.find({ owner: ownerId, status: "active" }).lean();
    const planIds = plans.map((p) => p._id);
    const planTitleById = new Map(plans.map((p) => [p._id.toString(), p.title]));
    const todayEntries = await StudyPlanEntryModel.find({ studyPlanId: { $in: planIds }, date: today })
      .select("studyPlanId index label status topics")
      .lean();

    const studyPlans = todayEntries.map((e) => ({
      planId: e.studyPlanId.toString(),
      planTitle: planTitleById.get(e.studyPlanId.toString()) ?? "",
      entryId: e._id.toString(),
      index: e.index,
      label: e.label ?? null,
      topics: (e.topics ?? []).map((t) => ({ title: t.title, description: t.description ?? null })),
      status: e.status,
    }));

    return NextResponse.json({
      date: formatDateOnly(today),
      tasks: { dueToday, overdue },
      recurring,
      studyPlans,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
