import { NextRequest, NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import { TaskModel, SUBTASK_STATUSES, type SubtaskStatus } from "@/models/Task";
import { requireUser } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";
import { serializeTask } from "@/lib/serialize";

type Params = { params: Promise<{ id: string; subtaskId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    const { id, subtaskId } = await params;
    const body = await req.json();

    await connectMongoose();
    const task = await TaskModel.findOne({ _id: id, owner: user.id });
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const subtask = task.subtasks.id(subtaskId);
    if (!subtask) return NextResponse.json({ error: "Subtask not found" }, { status: 404 });

    if (typeof body.title === "string" && body.title.trim()) {
      subtask.title = body.title.trim();
    }

    if (body.status) {
      const status = body.status as SubtaskStatus;
      if (!SUBTASK_STATUSES.includes(status)) {
        return NextResponse.json({ error: "Invalid subtask status" }, { status: 400 });
      }
      subtask.status = status;
      subtask.completedAt = status === "Done" ? new Date() : undefined;
    }

    await task.save();
    return NextResponse.json(serializeTask(task.toObject()));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    const { id, subtaskId } = await params;

    await connectMongoose();
    const task = await TaskModel.findOne({ _id: id, owner: user.id });
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const subtask = task.subtasks.id(subtaskId);
    if (!subtask) return NextResponse.json({ error: "Subtask not found" }, { status: 404 });

    subtask.deleteOne();
    await task.save();
    return NextResponse.json(serializeTask(task.toObject()));
  } catch (error) {
    return handleApiError(error);
  }
}
