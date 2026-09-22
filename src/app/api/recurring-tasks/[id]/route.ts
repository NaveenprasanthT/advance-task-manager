import { NextRequest, NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import { RecurringTaskModel, RECURRENCE_FREQUENCIES, type RecurrenceFrequency } from "@/models/RecurringTask";
import { requireUser } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";
import { serializeRecurringTask } from "@/lib/serialize";

type Params = { params: Promise<{ id: string }> };

const SIMPLE_FIELDS = ["title", "description", "priority", "estimateValue", "estimateUnit", "active"] as const;
const DATE_FIELDS = ["endDate"] as const;

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await req.json();

    await connectMongoose();
    const template = await RecurringTaskModel.findOne({ _id: id, owner: user.id });
    if (!template) return NextResponse.json({ error: "Recurring task not found" }, { status: 404 });

    for (const field of SIMPLE_FIELDS) {
      if (field in body) {
        const value = body[field];
        if (field === "active") {
          template.active = Boolean(value);
        } else {
          (template as never as Record<string, unknown>)[field] =
            typeof value === "string" ? value.trim() || undefined : value;
        }
      }
    }
    for (const field of DATE_FIELDS) {
      if (field in body) {
        const value = body[field];
        (template as never as Record<string, unknown>)[field] = value ? new Date(value) : undefined;
      }
    }

    // The recurrence rule (frequency + which days) is validated and applied
    // as one bundle - changing it only affects future generation, since
    // already-created occurrences are independent Task documents.
    if ("frequency" in body) {
      const { frequency, daysOfWeek, daysOfMonth } = body;
      if (!RECURRENCE_FREQUENCIES.includes(frequency as RecurrenceFrequency)) {
        return NextResponse.json({ error: "A valid frequency is required" }, { status: 400 });
      }
      if (frequency === "weekly" && (!Array.isArray(daysOfWeek) || daysOfWeek.length === 0)) {
        return NextResponse.json({ error: "Select at least one day of the week" }, { status: 400 });
      }
      if (frequency === "monthly" && (!Array.isArray(daysOfMonth) || daysOfMonth.length === 0)) {
        return NextResponse.json({ error: "Select at least one date of the month" }, { status: 400 });
      }
      template.frequency = frequency;
      template.daysOfWeek = frequency === "weekly" ? daysOfWeek : undefined;
      template.daysOfMonth = frequency === "monthly" ? daysOfMonth : undefined;
    }

    await template.save();
    return NextResponse.json(serializeRecurringTask(template.toObject()));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await connectMongoose();

    // Only stops future generation - already-generated Task occurrences are
    // independent documents and are left untouched (they remain normal
    // tasks the user can edit/delete individually).
    const result = await RecurringTaskModel.deleteOne({ _id: id, owner: user.id });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Recurring task not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
