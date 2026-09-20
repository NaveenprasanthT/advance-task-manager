import { NextRequest, NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import { TaskModel } from "@/models/Task";
import { requireUser } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";
import { serializeTask } from "@/lib/serialize";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await req.json();
    const title = String(body?.title ?? "").trim();

    if (!title) {
      return NextResponse.json({ error: "Subtask title is required" }, { status: 400 });
    }

    await connectMongoose();
    const task = await TaskModel.findOne({ _id: id, owner: user.id });
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const order = task.subtasks.length;
    task.subtasks.push({ title, status: "Todo", order });

    await task.save();
    return NextResponse.json(serializeTask(task.toObject()), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
