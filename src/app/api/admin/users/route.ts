import { NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import { UserModel } from "@/models/User";
import { TaskModel } from "@/models/Task";
import { requireAdmin } from "@/lib/rbac";
import { handleApiError } from "@/lib/api-error";

export async function GET() {
  try {
    await requireAdmin();
    await connectMongoose();

    const users = await UserModel.find().sort({ createdAt: -1 }).lean();
    const taskCounts = await TaskModel.aggregate([{ $group: { _id: "$owner", count: { $sum: 1 } } }]);
    const countMap = new Map(taskCounts.map((r) => [r._id.toString(), r.count]));

    return NextResponse.json(
      users.map((u) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role ?? "user",
        image: u.image ?? null,
        authProviders: u.authProviders ?? [],
        puzzleAccess: u.puzzleAccess ?? false,
        taskCount: countMap.get(u._id.toString()) ?? 0,
        createdAt: new Date(u.createdAt ?? Date.now()).toISOString(),
      })),
    );
  } catch (error) {
    return handleApiError(error);
  }
}
