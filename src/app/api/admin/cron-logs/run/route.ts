import { NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import { CronLogModel, cronLogExpiryFrom, type CronRunStatus } from "@/models/CronLog";
import { CronLockModel, isLockConflict } from "@/models/CronLock";
import { runFullGenerationCycle, deriveRunStatus, LOCK_ID, LOCK_TTL_MS } from "@/lib/auto-generate/run-full-cycle";
import { requireAdmin } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";

// Admin-triggered equivalent of the scheduled generate-todos cron - runs the
// exact same full cycle (all eligible users, same frequency gating), sharing
// the same lock id so a manual run can never overlap a scheduled one.
export async function POST() {
  try {
    const admin = await requireAdmin();
    await connectMongoose();

    const startedAt = new Date();
    try {
      await CronLockModel.create({ _id: LOCK_ID, lockedAt: startedAt, expiresAt: new Date(startedAt.getTime() + LOCK_TTL_MS) });
    } catch (err) {
      if (isLockConflict(err)) {
        return NextResponse.json({ error: "A run is already in progress" }, { status: 409 });
      }
      throw err;
    }

    let usersConsidered = 0;
    let entries: Awaited<ReturnType<typeof runFullGenerationCycle>>["entries"] = [];
    let hadRouteError = false;

    try {
      const result = await runFullGenerationCycle();
      usersConsidered = result.usersConsidered;
      entries = result.entries;
      hadRouteError = result.hadRouteError;
    } finally {
      await CronLockModel.deleteOne({ _id: LOCK_ID }).catch((err) => console.error("Failed to release cron lock", err));
    }

    const finishedAt = new Date();
    const runStatus: CronRunStatus = hadRouteError ? "failure" : deriveRunStatus(entries);

    const log = await CronLogModel.create({
      trigger: "manual_full",
      triggeredBy: admin.id,
      status: runStatus,
      startedAt,
      finishedAt,
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      usersConsidered,
      entries,
      hadRouteError,
      expiresAt: cronLogExpiryFrom(startedAt),
    });

    return NextResponse.json({
      logId: log._id.toString(),
      status: runStatus,
      usersConsidered,
      entryCount: entries.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
