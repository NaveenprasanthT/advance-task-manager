import { NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import { TaskModel } from "@/models/Task";
import { UserModel } from "@/models/User";
import { requireAdmin } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";

export async function GET() {
  try {
    await requireAdmin();
    await connectMongoose();

    const now = Date.now();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const twelveWeeksAgo = new Date(now - 84 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      signupTrend,
      active7d,
      active30d,
      onTime,
      leaderboard,
      categorySplit,
      createdTrend,
      completedTrend,
    ] = await Promise.all([
      UserModel.countDocuments(),
      UserModel.aggregate([
        { $match: { createdAt: { $gte: twelveWeeksAgo } } },
        { $group: { _id: { $dateTrunc: { date: "$createdAt", unit: "week" } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      TaskModel.distinct("owner", { updatedAt: { $gte: sevenDaysAgo } }),
      TaskModel.distinct("owner", { updatedAt: { $gte: thirtyDaysAgo } }),
      TaskModel.aggregate([
        { $match: { status: "Done" } },
        {
          $project: {
            onTime: {
              $cond: [{ $eq: ["$dueDate", null] }, true, { $lte: ["$actualCompletedAt", "$dueDate"] }],
            },
          },
        },
        { $group: { _id: "$onTime", count: { $sum: 1 } } },
      ]),
      TaskModel.aggregate([
        { $match: { status: "Done" } },
        {
          $group: {
            _id: "$owner",
            completed: { $sum: 1 },
            onTime: {
              $sum: {
                $cond: [
                  { $or: [{ $eq: ["$dueDate", null] }, { $lte: ["$actualCompletedAt", "$dueDate"] }] },
                  1,
                  0,
                ],
              },
            },
          },
        },
        { $sort: { completed: -1 } },
        { $limit: 10 },
        {
          $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" },
        },
        { $unwind: "$user" },
        {
          $project: {
            name: "$user.name",
            email: "$user.email",
            completed: 1,
            onTimeRate: {
              $cond: [{ $eq: ["$completed", 0] }, 0, { $round: [{ $multiply: [{ $divide: ["$onTime", "$completed"] }, 100] }, 0] }],
            },
          },
        },
      ]),
      TaskModel.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }]),
      TaskModel.aggregate([
        { $match: { createdAt: { $gte: twelveWeeksAgo } } },
        { $group: { _id: { $dateTrunc: { date: "$createdAt", unit: "week" } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      TaskModel.aggregate([
        { $match: { status: "Done", actualCompletedAt: { $gte: twelveWeeksAgo } } },
        { $group: { _id: { $dateTrunc: { date: "$actualCompletedAt", unit: "week" } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const onTimeCount = onTime.find((r) => r._id === true)?.count ?? 0;
    const lateCount = onTime.find((r) => r._id === false)?.count ?? 0;
    const totalCompleted = onTimeCount + lateCount;
    const platformOnTimeRate = totalCompleted > 0 ? Math.round((onTimeCount / totalCompleted) * 100) : null;

    const weekMap = new Map<string, { created: number; completed: number }>();
    for (const row of createdTrend) {
      const key = new Date(row._id).toISOString();
      weekMap.set(key, { created: row.count, completed: weekMap.get(key)?.completed ?? 0 });
    }
    for (const row of completedTrend) {
      const key = new Date(row._id).toISOString();
      weekMap.set(key, { created: weekMap.get(key)?.created ?? 0, completed: row.count });
    }
    const engagementTrend = Array.from(weekMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, counts]) => ({ week, ...counts }));

    return NextResponse.json({
      totalUsers,
      signupTrend: signupTrend.map((r) => ({ week: new Date(r._id).toISOString(), count: r.count })),
      activeUsers7d: active7d.length,
      activeUsers30d: active30d.length,
      platformOnTimeRate,
      leaderboard,
      categorySplit: Object.fromEntries(categorySplit.map((r) => [r._id, r.count])),
      engagementTrend,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
