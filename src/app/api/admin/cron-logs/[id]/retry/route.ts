import { NextRequest, NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import { UserModel } from "@/models/User";
import { CronLogModel, cronLogExpiryFrom, type ICronLogEntry } from "@/models/CronLog";
import { CronLockModel, isLockConflict } from "@/models/CronLock";
import { runCategoryGeneration } from "@/lib/auto-generate/run-category";
import { requireAdmin } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const entryId = typeof body.entryId === "string" ? body.entryId : null;
    if (!entryId) return NextResponse.json({ error: "entryId is required" }, { status: 400 });

    await connectMongoose();

    const sourceLog = await CronLogModel.findById(id).lean();
    if (!sourceLog) return NextResponse.json({ error: "Log not found" }, { status: 404 });

    const sourceEntry = sourceLog.entries.find((e) => String(e._id) === entryId);
    if (!sourceEntry || sourceEntry.type !== "user_category" || !sourceEntry.userId || !sourceEntry.category) {
      return NextResponse.json({ error: "This entry cannot be retried" }, { status: 400 });
    }

    const user = await UserModel.findById(sourceEntry.userId);
    if (!user) return NextResponse.json({ error: "User no longer exists" }, { status: 404 });

    const categoryKey = sourceEntry.category === "Personal" ? "personal" : "professional";
    const settings = user.autoGen?.[categoryKey];
    const interests = settings?.interests ?? [];
    if (!interests.length) {
      return NextResponse.json({ error: "User has no interests configured for this category" }, { status: 400 });
    }

    const lockId = `retry:${sourceEntry.userId.toString()}:${sourceEntry.category}`;
    const startedAt = new Date();
    try {
      await CronLockModel.create({ _id: lockId, lockedAt: startedAt, expiresAt: new Date(startedAt.getTime() + 120_000) });
    } catch (err) {
      if (isLockConflict(err)) {
        return NextResponse.json({ error: "A retry for this user/category is already running" }, { status: 409 });
      }
      throw err;
    }

    let entry: ICronLogEntry;
    try {
      const result = await runCategoryGeneration({
        ownerId: sourceEntry.userId.toString(),
        category: sourceEntry.category,
        interests,
      });
      const advanced = result.suggestionsCreated > 0;
      if (advanced && settings) {
        settings.lastGeneratedAt = new Date();
        await user.save();
      }
      entry = {
        type: "user_category",
        userId: user._id.toString(),
        userEmail: user.email,
        userName: user.name,
        category: sourceEntry.category,
        status: result.status,
        interests: result.interests,
        suggestionsCreated: result.suggestionsCreated,
        lastGeneratedAtAdvanced: advanced,
      };
    } finally {
      await CronLockModel.deleteOne({ _id: lockId }).catch((err) => console.error("Failed to release retry lock", err));
    }

    const finishedAt = new Date();
    const runStatus = entry.status === "failure" ? "failure" : entry.status === "partial" ? "partial" : "success";

    const log = await CronLogModel.create({
      trigger: "manual_retry",
      triggeredBy: admin.id,
      retryOfLogId: sourceLog._id,
      retryOfEntryId: sourceEntry._id,
      status: runStatus,
      startedAt,
      finishedAt,
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      usersConsidered: 1,
      entries: [entry],
      expiresAt: cronLogExpiryFrom(startedAt),
    });

    return NextResponse.json({ logId: log._id.toString(), entry });
  } catch (error) {
    return handleApiError(error);
  }
}
