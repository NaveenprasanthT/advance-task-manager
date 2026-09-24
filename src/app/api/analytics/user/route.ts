import { NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import { TaskModel } from "@/models/Task";
import { requireUser } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";
import { Types } from "mongoose";

export async function GET() {
  try {
    const user = await requireUser();
    await connectMongoose();
    const ownerId = new Types.ObjectId(user.id);
    // Due dates are stored as UTC midnight of their calendar day (see
    // task-utils.ts's isTaskOverdue for the full explanation) - comparing
    // against UTC midnight of *today*, not the exact current instant,
    // keeps a task due "today" counted as on-time for the whole day.
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);

    const [statusCounts, categoryCounts, onTime, overdue, trend, timeInStatus, subtaskStats] = await Promise.all([
      TaskModel.aggregate([
        { $match: { owner: ownerId } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      TaskModel.aggregate([
        { $match: { owner: ownerId } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
      ]),
      TaskModel.aggregate([
        { $match: { owner: ownerId, status: "Done" } },
        {
          $project: {
            onTime: {
              $cond: [
                { $eq: ["$dueDate", null] },
                true,
                { $lte: ["$actualCompletedAt", "$dueDate"] },
              ],
            },
          },
        },
        { $group: { _id: "$onTime", count: { $sum: 1 } } },
      ]),
      TaskModel.countDocuments({
        owner: ownerId,
        status: { $nin: ["Done", "Aborted"] },
        dueDate: { $lt: startOfToday },
      }),
      TaskModel.aggregate([
        {
          $match: {
            owner: ownerId,
            status: "Done",
            actualCompletedAt: { $gte: new Date(Date.now() - 84 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: { $dateTrunc: { date: "$actualCompletedAt", unit: "week" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      TaskModel.aggregate([
        { $match: { owner: ownerId } },
        { $unwind: "$statusHistory" },
        { $sort: { "statusHistory.enteredAt": 1 } },
        {
          $group: {
            _id: "$_id",
            entries: { $push: "$statusHistory" },
          },
        },
      ]),
      TaskModel.aggregate([
        { $match: { owner: ownerId } },
        { $unwind: { path: "$subtasks", preserveNullAndEmptyArrays: false } },
        {
          $group: {
            _id: "$subtasks.status",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const statusMap: Record<string, number> = {};
    for (const row of statusCounts) statusMap[row._id] = row.count;

    const categoryMap: Record<string, number> = {};
    for (const row of categoryCounts) categoryMap[row._id] = row.count;

    const onTimeCount = onTime.find((r) => r._id === true)?.count ?? 0;
    const lateCount = onTime.find((r) => r._id === false)?.count ?? 0;
    const totalCompleted = onTimeCount + lateCount;
    const onTimeRate = totalCompleted > 0 ? Math.round((onTimeCount / totalCompleted) * 100) : null;

    const completionTrend = trend.map((row) => ({
      week: new Date(row._id).toISOString(),
      completed: row.count,
    }));

    const durations: Record<string, number[]> = {};
    for (const task of timeInStatus) {
      const entries = task.entries as { status: string; enteredAt: Date }[];
      for (let i = 0; i < entries.length; i++) {
        const current = entries[i];
        const next = entries[i + 1];
        const end = next ? new Date(next.enteredAt).getTime() : Date.now();
        const start = new Date(current.enteredAt).getTime();
        const days = (end - start) / (1000 * 60 * 60 * 24);
        durations[current.status] ??= [];
        durations[current.status].push(days);
      }
    }
    const avgTimeInStatus = Object.fromEntries(
      Object.entries(durations).map(([status, values]) => [
        status,
        Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10,
      ]),
    );

    const subtaskMap: Record<string, number> = {};
    for (const row of subtaskStats) subtaskMap[row._id] = row.count;
    const totalSubtasks = Object.values(subtaskMap).reduce((a, b) => a + b, 0);
    const subtaskCompletionRate =
      totalSubtasks > 0 ? Math.round(((subtaskMap.Done ?? 0) / totalSubtasks) * 100) : null;

    return NextResponse.json({
      statusCounts: statusMap,
      categoryCounts: categoryMap,
      onTimeRate,
      onTimeCount,
      lateCount,
      overdueCount: overdue,
      completionTrend,
      avgTimeInStatusDays: avgTimeInStatus,
      subtaskCompletionRate,
      totalSubtasks,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
