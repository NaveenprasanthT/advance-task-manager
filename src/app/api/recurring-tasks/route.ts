import { NextRequest, NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import { RecurringTaskModel, RECURRENCE_FREQUENCIES, type RecurrenceFrequency } from "@/models/RecurringTask";
import { TASK_CATEGORIES, TASK_PRIORITIES, type TaskCategory, type TaskPriority } from "@/models/Task";
import { requireUser } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";
import { serializeRecurringTask } from "@/lib/serialize";
import { backfillOccurrences } from "@/lib/recurring/generate-occurrence";

export async function GET() {
  try {
    const user = await requireUser();
    await connectMongoose();

    const templates = await RecurringTaskModel.find({ owner: user.id }).sort({ createdAt: -1 }).lean();
    return NextResponse.json(templates.map((t) => serializeRecurringTask(t as never)));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const {
      category,
      title,
      description,
      priority,
      estimateValue,
      estimateUnit,
      frequency,
      daysOfWeek,
      daysOfMonth,
      startDate,
      endDate,
    } = body;

    if (!category || !TASK_CATEGORIES.includes(category as TaskCategory)) {
      return NextResponse.json({ error: "A valid category is required" }, { status: 400 });
    }
    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (!frequency || !RECURRENCE_FREQUENCIES.includes(frequency as RecurrenceFrequency)) {
      return NextResponse.json({ error: "A valid frequency is required" }, { status: 400 });
    }
    if (priority && !TASK_PRIORITIES.includes(priority as TaskPriority)) {
      return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
    }
    if (frequency === "weekly" && (!Array.isArray(daysOfWeek) || daysOfWeek.length === 0)) {
      return NextResponse.json({ error: "Select at least one day of the week" }, { status: 400 });
    }
    if (frequency === "monthly" && (!Array.isArray(daysOfMonth) || daysOfMonth.length === 0)) {
      return NextResponse.json({ error: "Select at least one date of the month" }, { status: 400 });
    }

    await connectMongoose();

    const template = await RecurringTaskModel.create({
      owner: user.id,
      category,
      title: title.trim(),
      description: description?.trim() || undefined,
      priority: priority ?? "Medium",
      estimateValue: estimateValue ?? undefined,
      estimateUnit: estimateUnit ?? "hours",
      frequency,
      daysOfWeek: frequency === "weekly" ? daysOfWeek : undefined,
      daysOfMonth: frequency === "monthly" ? daysOfMonth : undefined,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : undefined,
    });

    // So a routine created today shows up on the board immediately instead
    // of waiting for tomorrow's cron run.
    await backfillOccurrences(template, new Date());

    return NextResponse.json(serializeRecurringTask(template.toObject()), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
