import { NextRequest, NextResponse } from "next/server";
import type { QueryFilter } from "mongoose";
import { connectMongoose } from "@/lib/mongoose";
import { CronLogModel, CRON_RUN_STATUSES, type CronRunStatus, type ICronLog } from "@/models/CronLog";
import { requireAdmin } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    await connectMongoose();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const userEmail = searchParams.get("userEmail");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || 20));

    const query: QueryFilter<ICronLog> = {};

    if (status) {
      const statuses = status
        .split(",")
        .filter((s): s is CronRunStatus => (CRON_RUN_STATUSES as readonly string[]).includes(s));
      if (statuses.length) query.status = { $in: statuses };
    }
    if (from || to) {
      query.startedAt = {};
      if (from) query.startedAt.$gte = new Date(from);
      if (to) query.startedAt.$lte = new Date(to);
    }
    if (category || userEmail) {
      query.entries = {
        $elemMatch: {
          ...(category ? { category } : {}),
          ...(userEmail ? { userEmail: { $regex: userEmail.trim(), $options: "i" } } : {}),
        },
      };
    }

    const [logs, total] = await Promise.all([
      CronLogModel.find(query)
        .sort({ startedAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      CronLogModel.countDocuments(query),
    ]);

    return NextResponse.json({
      logs: logs.map((log) => {
        const entryStatusCounts = { success: 0, partial: 0, failure: 0, skipped: 0 };
        for (const entry of log.entries) entryStatusCounts[entry.status]++;
        return {
          id: log._id.toString(),
          trigger: log.trigger,
          status: log.status,
          startedAt: log.startedAt.toISOString(),
          finishedAt: log.finishedAt?.toISOString() ?? null,
          durationMs: log.durationMs ?? null,
          usersConsidered: log.usersConsidered,
          entryCount: log.entries.length,
          entryStatusCounts,
          hadUnauthorizedAttempt: log.hadUnauthorizedAttempt,
          hadRouteError: log.hadRouteError,
        };
      }),
      total,
      page,
      pageSize,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
