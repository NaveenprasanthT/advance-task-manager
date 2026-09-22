import { NextRequest, NextResponse } from "next/server";
import type { QueryFilter } from "mongoose";
import { connectMongoose } from "@/lib/mongoose";
import { AiRequestLogModel, AI_REQUEST_STATUSES, type AiRequestStatus, type IAiRequestLog } from "@/models/AiRequestLog";
import { requireAdmin } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    await connectMongoose();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const userEmail = searchParams.get("userEmail");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || 20));

    const query: QueryFilter<IAiRequestLog> = {};

    if (status) {
      const statuses = status
        .split(",")
        .filter((s): s is AiRequestStatus => (AI_REQUEST_STATUSES as readonly string[]).includes(s));
      if (statuses.length) query.status = { $in: statuses };
    }
    if (userEmail) query.userEmail = { $regex: userEmail.trim(), $options: "i" };
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    const [logs, total] = await Promise.all([
      AiRequestLogModel.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      AiRequestLogModel.countDocuments(query),
    ]);

    return NextResponse.json({
      logs: logs.map((log) => ({
        id: log._id.toString(),
        feature: log.feature,
        userEmail: log.userEmail ?? null,
        status: log.status,
        stage: log.stage ?? null,
        errorMessage: log.errorMessage ?? null,
        attempts: log.attempts ?? 1,
        durationMs: log.durationMs ?? null,
        createdAt: log.createdAt?.toISOString() ?? null,
      })),
      total,
      page,
      pageSize,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
