import { NextRequest, NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import { RecurringTaskModel } from "@/models/RecurringTask";
import { RecurringTaskLogModel } from "@/models/RecurringTaskLog";
import { requireUser } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";
import { isDueOn, toDateOnly, addDays, formatDateOnly, parseDateOnly } from "@/lib/recurrence";

type Params = { params: Promise<{ id: string }> };

const DEFAULT_WINDOW_DAYS = 90;

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser();
    const { id } = await params;

    await connectMongoose();
    const template = await RecurringTaskModel.findOne({ _id: id, owner: user.id }).lean();
    if (!template) return NextResponse.json({ error: "Recurring task not found" }, { status: 404 });

    const today = toDateOnly(new Date());
    const toParam = req.nextUrl.searchParams.get("to");
    const fromParam = req.nextUrl.searchParams.get("from");
    const daysParam = req.nextUrl.searchParams.get("days");

    const parsedTo = toParam ? parseDateOnly(toParam) : null;
    if (toParam && !parsedTo) return NextResponse.json({ error: "Invalid 'to' date" }, { status: 400 });
    const to = parsedTo && parsedTo < today ? parsedTo : today;

    const parsedFrom = fromParam ? parseDateOnly(fromParam) : null;
    if (fromParam && !parsedFrom) return NextResponse.json({ error: "Invalid 'from' date" }, { status: 400 });
    const windowDays = daysParam ? Number(daysParam) || DEFAULT_WINDOW_DAYS : DEFAULT_WINDOW_DAYS;
    const from = parsedFrom ?? addDays(to, -windowDays);

    const logs = await RecurringTaskLogModel.find({
      recurringTaskId: id,
      date: { $gte: from, $lte: to },
    })
      .select("date status note")
      .lean();

    const dueDates: string[] = [];
    let cursor = from;
    while (cursor <= to) {
      if (isDueOn(template, cursor)) dueDates.push(formatDateOnly(cursor));
      cursor = addDays(cursor, 1);
    }

    return NextResponse.json({
      templateId: id,
      from: formatDateOnly(from),
      to: formatDateOnly(to),
      entries: logs.map((log) => ({
        date: formatDateOnly(new Date(log.date)),
        status: log.status,
        note: log.note ?? null,
      })),
      dueDates,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
