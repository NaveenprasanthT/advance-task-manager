import { NextRequest, NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import { UserModel, type AutoGenFrequency } from "@/models/User";
import { type TaskCategory } from "@/models/Task";
import { CronLogModel, cronLogExpiryFrom, type CronRunStatus, type ICronLogEntry } from "@/models/CronLog";
import { CronLockModel, isLockConflict } from "@/models/CronLock";
import { runCategoryGeneration } from "@/lib/auto-generate/run-category";

export const maxDuration = 60;

const LOCK_ID = "generate-todos";
const LOCK_TTL_MS = 120_000; // safety valve past maxDuration, in case release itself fails

const CATEGORY_MAP: Record<"personal" | "professional", TaskCategory> = {
  personal: "Personal",
  professional: "Professional",
};

function isDue(frequency: AutoGenFrequency, lastGeneratedAt: Date | null | undefined): boolean {
  if (!lastGeneratedAt) return true;
  const days = { daily: 1, weekly: 7, monthly: 30 }[frequency];
  return Date.now() - new Date(lastGeneratedAt).getTime() >= days * 24 * 60 * 60 * 1000;
}

function deriveRunStatus(entries: ICronLogEntry[]): CronRunStatus {
  if (entries.length === 0) return "success";
  const allOk = entries.every((e) => e.status === "success" || e.status === "skipped");
  if (allOk) return "success";
  const allFailed = entries.every((e) => e.status === "failure");
  return allFailed ? "failure" : "partial";
}

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

  const entries: ICronLogEntry[] = [];
  let usersConsidered = 0;
  let hadRouteError = false;

  try {
    const users = await UserModel.find({
      $or: [{ "autoGen.personal.enabled": true }, { "autoGen.professional.enabled": true }],
    });
    usersConsidered = users.length;

    for (const user of users) {
      const ownerId = user._id.toString();
      let changed = false;

      for (const key of Object.keys(CATEGORY_MAP) as (keyof typeof CATEGORY_MAP)[]) {
        const settings = user.autoGen?.[key];
        const category = CATEGORY_MAP[key];
        if (!settings?.enabled || !settings.interests.length) continue;
        if (!isDue(settings.frequency as AutoGenFrequency, settings.lastGeneratedAt)) continue;

        const entryStart = Date.now();
        const result = await runCategoryGeneration({ ownerId, category, interests: settings.interests });
        const advanced = result.suggestionsCreated > 0;

        // Only advance lastGeneratedAt when the user actually got value this
        // run - a total failure (or a run that found nothing) should be
        // retried on the very next tick instead of waiting a full frequency
        // window (up to 30 days for "monthly").
        if (advanced) {
          settings.lastGeneratedAt = new Date();
          changed = true;
        }

        entries.push({
          type: "user_category",
          userId: user._id.toString(),
          userEmail: user.email,
          userName: user.name,
          category,
          status: result.status,
          interests: result.interests,
          suggestionsCreated: result.suggestionsCreated,
          lastGeneratedAtAdvanced: advanced,
          durationMs: Date.now() - entryStart,
        });
      }

      if (changed) await user.save();
    }
  } catch (err) {
    hadRouteError = true;
    entries.push({
      type: "route_error",
      status: "failure",
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    console.error("generate-todos cron route error", err);
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
