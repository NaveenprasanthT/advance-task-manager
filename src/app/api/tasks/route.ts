import { NextRequest, NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import { TaskModel, TASK_CATEGORIES, type TaskCategory } from "@/models/Task";
import { requireUser } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";
import { serializeTask } from "@/lib/serialize";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const category = req.nextUrl.searchParams.get("category") as TaskCategory | null;
    if (category && !TASK_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    await connectMongoose();
    const filter: Record<string, unknown> = { owner: user.id };
    if (category) filter.category = category;

    const tasks = await TaskModel.find(filter).sort({ boardOrder: 1 }).lean();
    return NextResponse.json(tasks.map((t) => serializeTask(t as never)));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const { category, title, description, estimateValue, estimateUnit, priority, dueDate, plannedStart, plannedEnd } =
      body;

    if (!category || !TASK_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: "A valid category is required" }, { status: 400 });
    }
    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    await connectMongoose();

    const highestOrder = await TaskModel.findOne({ owner: user.id, category, status: "Todo" })
      .sort({ boardOrder: -1 })
      .select("boardOrder")
      .lean();

    const task = await TaskModel.create({
      owner: user.id,
      category,
      title: title.trim(),
      description: description?.trim() || undefined,
      estimateValue: estimateValue ?? undefined,
      estimateUnit: estimateUnit ?? "hours",
      priority: priority ?? undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      plannedStart: plannedStart ? new Date(plannedStart) : undefined,
      plannedEnd: plannedEnd ? new Date(plannedEnd) : undefined,
      boardOrder: highestOrder ? (highestOrder.boardOrder ?? 0) + 1 : 0,
    });

    return NextResponse.json(serializeTask(task.toObject()), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
