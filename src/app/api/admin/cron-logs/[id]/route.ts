import { NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import { CronLogModel } from "@/models/CronLog";
import { requireAdmin } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;

    await connectMongoose();
    const log = await CronLogModel.findById(id).lean();
    if (!log) return NextResponse.json({ error: "Log not found" }, { status: 404 });

    return NextResponse.json({
      id: log._id.toString(),
      trigger: log.trigger,
      triggeredBy: log.triggeredBy?.toString() ?? null,
      retryOfLogId: log.retryOfLogId?.toString() ?? null,
      retryOfEntryId: log.retryOfEntryId?.toString() ?? null,
      status: log.status,
      startedAt: log.startedAt.toISOString(),
      finishedAt: log.finishedAt?.toISOString() ?? null,
      durationMs: log.durationMs ?? null,
      usersConsidered: log.usersConsidered,
      hadUnauthorizedAttempt: log.hadUnauthorizedAttempt,
      hadRouteError: log.hadRouteError,
      entries: log.entries.map((entry) => ({
        id: String(entry._id),
        type: entry.type,
        userId: entry.userId ?? null,
        userEmail: entry.userEmail ?? null,
        userName: entry.userName ?? null,
        category: entry.category ?? null,
        status: entry.status,
        interests: entry.interests ?? [],
        suggestionsCreated: entry.suggestionsCreated ?? 0,
        lastGeneratedAtAdvanced: entry.lastGeneratedAtAdvanced ?? false,
        errorMessage: entry.errorMessage ?? null,
        durationMs: entry.durationMs ?? null,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
