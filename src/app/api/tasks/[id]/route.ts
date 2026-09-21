import { NextRequest, NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import { TaskModel } from "@/models/Task";
import { requireUser } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";
import { serializeTask } from "@/lib/serialize";

type Params = { params: Promise<{ id: string }> };

const EDITABLE_FIELDS = [
  "title",
  "description",
  "estimateValue",
  "estimateUnit",
  "priority",
  "dueDate",
  "plannedStart",
  "plannedEnd",
] as const;

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await connectMongoose();

    const task = await TaskModel.findOne({ _id: id, owner: user.id }).lean();
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    return NextResponse.json(serializeTask(task as never));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await req.json();

    await connectMongoose();
    const task = await TaskModel.findOne({ _id: id, owner: user.id });
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    for (const field of EDITABLE_FIELDS) {
      if (field in body) {
        const value = body[field];
        if (["dueDate", "plannedStart", "plannedEnd"].includes(field)) {
          (task as never as Record<string, unknown>)[field] = value ? new Date(value) : undefined;
        } else {
          (task as never as Record<string, unknown>)[field] =
            typeof value === "string" ? value.trim() || undefined : value;
        }
      }
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
    const { id } = await params;
    await connectMongoose();

    const result = await TaskModel.deleteOne({ _id: id, owner: user.id });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
