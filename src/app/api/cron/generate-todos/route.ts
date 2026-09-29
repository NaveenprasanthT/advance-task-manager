import { NextRequest, NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import { CronLogModel, cronLogExpiryFrom, type CronRunStatus } from "@/models/CronLog";
import { CronLockModel, isLockConflict } from "@/models/CronLock";
import { runFullGenerationCycle, deriveRunStatus, LOCK_ID, LOCK_TTL_MS } from "@/lib/auto-generate/run-full-cycle";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const startedAt = new Date();

  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    try {
      await connectMongoose();
      await CronLogModel.create({
        trigger: "scheduled",
        status: "failure",
        startedAt,
        finishedAt: new Date(),
        durationMs: Date.now() - startedAt.getTime(),
        usersConsidered: 0,
        entries: [{ type: "unauthorized", status: "failure", errorMessage: "Invalid or missing CRON_SECRET" }],
        hadUnauthorizedAttempt: true,
        expiresAt: cronLogExpiryFrom(startedAt),
      });
    } catch (logErr) {
      console.error("Failed to record unauthorized cron attempt", logErr);
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectMongoose();

  try {
    await CronLockModel.create({ _id: LOCK_ID, lockedAt: startedAt, expiresAt: new Date(startedAt.getTime() + LOCK_TTL_MS) });
  } catch (err) {
    if (isLockConflict(err)) {
      return NextResponse.json({ skipped: true, reason: "A run is already in progress" }, { status: 409 });
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

  await CronLogModel.create({
    trigger: "scheduled",
    status: runStatus,
    startedAt,
    finishedAt,
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    usersConsidered,
    entries,
    hadRouteError,
    expiresAt: cronLogExpiryFrom(startedAt),
  });

  return NextResponse.json({ success: !hadRouteError, runStatus, entries: entries.length });
}
