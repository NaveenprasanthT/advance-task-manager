import { NextRequest, NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import { RecurringTaskModel } from "@/models/RecurringTask";
import { RecurringTaskLogModel, RECURRING_LOG_STATUSES, type RecurringLogStatus } from "@/models/RecurringTaskLog";
import { requireUser } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";
import { isDueOn, toDateOnly, parseDateOnly, formatDateOnly } from "@/lib/recurrence";

type Params = { params: Promise<{ id: string; date: string }> };

function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code?: number }).code === 11000;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    const { id, date: dateParam } = await params;
    const body = await req.json();
    const status = body.status as RecurringLogStatus;

    if (!RECURRING_LOG_STATUSES.includes(status)) {
      return NextResponse.json({ error: "status must be 'done' or 'missed'" }, { status: 400 });
    }

    const date = parseDateOnly(dateParam);
    if (!date) return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    if (date > toDateOnly(new Date())) {
      return NextResponse.json({ error: "Cannot resolve a future day" }, { status: 400 });
    }

    await connectMongoose();
    const template = await RecurringTaskModel.findOne({ _id: id, owner: user.id }).lean();
    if (!template) return NextResponse.json({ error: "Recurring task not found" }, { status: 404 });

    if (!isDueOn(template, date)) {
      return NextResponse.json({ error: "This recurring task is not due on that day" }, { status: 400 });
    }

    const update = { $set: { status, resolvedAt: new Date(), owner: user.id } };
    let log;
    try {
      log = await RecurringTaskLogModel.findOneAndUpdate({ recurringTaskId: id, date }, update, {
        upsert: true,
        new: true,
      });
    } catch (err) {
      // Simultaneous first-time inserts for the same day can race on the
      // unique index - retry once as a plain update now that the row exists.
      if (!isDuplicateKeyError(err)) throw err;
      log = await RecurringTaskLogModel.findOneAndUpdate({ recurringTaskId: id, date }, update, { new: true });
    }

    return NextResponse.json({ date: formatDateOnly(date), status: log!.status, resolvedAt: log!.resolvedAt });
  } catch (error) {
    return handleApiError(error);
  }
}
