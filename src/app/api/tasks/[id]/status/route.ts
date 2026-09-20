import { NextRequest, NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import { TaskModel, TASK_STATUSES, type TaskStatus } from "@/models/Task";
import { requireUser } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";
import { serializeTask } from "@/lib/serialize";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await req.json();
    const { status, abortReason, boardOrder } = body as {
      status?: TaskStatus;
      abortReason?: string;
      boardOrder?: number;
    };

    if (!status || !TASK_STATUSES.includes(status)) {
      return NextResponse.json({ error: "A valid status is required" }, { status: 400 });
    }
    if (status === "Aborted" && !abortReason?.trim()) {
      return NextResponse.json({ error: "abortReason is required when aborting a task" }, { status: 400 });
    }

    await connectMongoose();
    const task = await TaskModel.findOne({ _id: id, owner: user.id });
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const statusChanged = task.status !== status;

    task.status = status;
    if (typeof boardOrder === "number") task.boardOrder = boardOrder;

    if (status === "Aborted") {
      task.abortReason = abortReason!.trim();
    } else {
      task.abortReason = undefined;
    }

    if (status === "Done") {
      task.actualCompletedAt = new Date();
    } else {
      task.actualCompletedAt = undefined;
    }

    if (statusChanged) {
      task.statusHistory.push({ status, enteredAt: new Date() });
    }

    await task.save();
    return NextResponse.json(serializeTask(task.toObject()));
  } catch (error) {
    return handleApiError(error);
  }
}
